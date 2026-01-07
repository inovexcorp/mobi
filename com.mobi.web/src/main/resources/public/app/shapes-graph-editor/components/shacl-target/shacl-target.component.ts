/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';

import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { cloneDeep, difference, differenceWith, isEqual, remove, union } from 'lodash';

import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OWL, RDFS, SH } from '../../../prefixes';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { ShaclTargetDetector, SingleTargetTypeData, TargetTypeData } from '../../models/target-type-data';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import {
  TARGET_NODE,
  TARGET_CLASS,
  TARGET_OBJECTS_OF,
  TARGET_SUBJECTS_OF,
  IMPLICIT_REFERENCE,
  EXPLICIT_TARGETS,
  IMPLICIT_TYPES
} from '../../models/constants';
import { TargetOption } from '../shacl-target-selector/shacl-target-selector.component';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfRecord } from '../../../shared/models/versionedRdfRecord.interface';
import { ValueOption } from '../../models/value-option.interface';

/**
 * Data model for the SHACL Target form.
 *
 * @property {string} target SHACL target type IRI.
 * @property {ValueOption} targetValue Value for single-value targets.
 * @property {ValueOption[]} targetValues Array of values for multi-value targets.
 */
interface TargetFormModel {
  target: string;
  targetValue: ValueOption | null; // Null for when the control is disabled or not applicable
  targetValues: ValueOption[];
}

/**
 * Interface defining the FormControl instances for the targetForm FormGroup.
 *
 * @property {FormControl<string>} target FormControl for the target type.
 * @property {FormControl<ValueOption>} targetValue FormControl for the targetValue (single IRI).
 * @property {FormControl<ValueOption[]>} targetValues FormControl for the targetValues (array of IRIs).
 */
interface TargetFormControls {
  target: FormControl<string>;
  targetValue: FormControl<ValueOption>;
  targetValues: FormControl<ValueOption[]>;
}

/**
 * Defines the different editing states of a component.
 * - `Disabled`: The form is disabled and not editable. Default state for manual mode.
 * - `Enabled`: The user has actively chosen to edit the form.
 * - `Live`: The form is always enabled, and changes are emitted live.
 */
export enum EditMode {
  Disabled = 'DISABLED',
  Enabled = 'ENABLED',
  Live = 'LIVE',
}

/**
 * Defines the data structure emitted on value changes.
 * It provides the parent component with the current value and its validity state.
 *
 * @property {JSONLDObject} value - The current value of the form, represented as a JSON-LD object.
 * @property {boolean} isValid - A boolean indicating if the form is currently valid.
 */
export interface FormState {
  value: JSONLDObject | null; // Allow null for reset events
  isValid: boolean;
}

/**
 * @class shapes-graph-editor.ShaclTargetComponent
 * @requires shared.ToastService
 * @requires shared.ShapesGraphStateService
 * @requires shared.ShapesGraphStateService
 *
 * A component for viewing and editing the target of a SHACL Node Shape.
 * A SHACL Target specifies which RDF nodes a shape applies to. 
 * This component provides the UI and logic for managing these SHACL targets
 *
 * Component has two primary modes of operation:
 *
 * > Live Mode
 * - Activated when a parent subscribes to onValueChanges EventEmitter.
 * - The form is always enabled.
 * - All changes are emitted to the parent component.
 * - The parent is responsible for processing and saving these changes.
 * 
 * > Manual Mode
 * - Default mode when no parent is listening to onValueChanges EventEmitter.
 * - The form starts in the Disabled state.
 * - The user must click the Edit button to transition to the Enabled state for editing.
 * - Changes are saved only when the user clicks the Save button, which triggers an
 *   InProgressCommit
 *
 * @see {@link https://www.w3.org/TR/shacl/#targets | W3C SHACL Targets Specification}
 *
 * @param {VersionedRdfRecord} versionedRdfRecord The full versioned RDF record for the shapes graph.
 * @param {JSONLDObject} nodeShape The selected item containing node shape data to display.
 * @param {boolean} isImported Indicates whether the entity was imported from another source.
 * @param {boolean} canModify Indicates whether the user has permission to modify the nodeShape.
 * @param {EventEmitter<FormState>} onValueChanges Emits the form's state FormState on every change when in LIVE mode.
 */
@Component({
  selector: 'app-shacl-target',
  templateUrl: './shacl-target.component.html'
})
export class ShaclTargetComponent implements OnInit, OnChanges, OnDestroy {
  @Input() versionedRdfRecord: VersionedRdfRecord;
  @Input() nodeShape: JSONLDObject;
  @Input() isImported: boolean;
  @Input() canModify: boolean;

  @Output() onValueChanges = new EventEmitter<FormState>();

  private readonly _MISSING_CONTROLS_ERROR = 'An unexpected error occurred while loading the editor.';
  private _targetDetector: ShaclTargetDetector;
  private _destroySub$ = new Subject<void>();
  private _liveEditSub$: Subscription;

  targetForm: FormGroup<TargetFormControls>;
  targetOption: TargetOption | undefined;
  editMode: EditMode = EditMode.Disabled;
  isLiveMode = false;

  /**
   * An options object passed to form-altering methods to prevent them from emitting valueChanges or statusChanges events.
   * Avoids side-effects and infinite loops.
   * Use this for:
   * - Initializing/resetting form's state
   * - Synchronizing controls from another's value.
   * - Dynamically enabling or disabling controls.
   */
  readonly SILENT_UPDATE_OPTION = { emitEvent: false };
  readonly TARGET_NODE = TARGET_NODE;
  readonly TARGET_CLASS = TARGET_CLASS;
  readonly TARGET_OBJECTS_OF = TARGET_OBJECTS_OF;
  readonly TARGET_SUBJECTS_OF = TARGET_SUBJECTS_OF;
  readonly IMPLICIT_REFERENCE = IMPLICIT_REFERENCE;
  readonly EditMode = EditMode;
  
  constructor(
    private _cdr: ChangeDetectorRef,
    private _fb: NonNullableFormBuilder,
    private _toast: ToastService,
    public stateService: ShapesGraphStateService,
    private _pm: PropertyManagerService
  ) {
    this._targetDetector = new ShaclTargetDetector();
    this.targetForm = this._fb.group({
      target: ['', Validators.required],
      targetValue: [null],
      targetValues: [[] as ValueOption[]]
    });
    this.targetForm.disable(this.SILENT_UPDATE_OPTION);
  }

  ngOnInit(): void {
    this.isLiveMode = this.onValueChanges.observers.length > 0;
    this._initializeOperatingMode();
  }

  /*
   * Resets edit mode and form status.
   * If a new nodeShape is provided, the form is updated.
   *
   * @param changes Object containing the changed input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.nodeShape) {
      this.updateForm(this.nodeShape);
    }
    this._initializeOperatingMode();
  }

  /**
   * Sets the component's initial operating mode
   * Should be called during initialization or when a input that affects the mode changes.
   */
  private _initializeOperatingMode(): void {
    const initialMode = this.isLiveMode ? EditMode.Live : EditMode.Disabled;
    this.setEditMode(initialMode);
  }

  /**
  * Method for transitioning the component between editing modes
  * Responsible for:
  *  - Setting the `editMode` property.
  *  - Clearing any existing subscriptions.
  *  - Enabling or disabling the form based on the newMode.
  *  - If EditMode is LIVE then creates new subscriptions.
  *  - Refreshing the UI of dependent controls.
  *
  * @param newMode The target mode to transition to (Live, Enabled, or Disabled).
  */
  private setEditMode(newMode: EditMode): void {
    this.editMode = newMode;
    this._liveEditSub$?.unsubscribe();
    switch (newMode) {
      case EditMode.Live:
        this.targetForm.enable(this.SILENT_UPDATE_OPTION);
        this._subscribeToLiveChanges();
        break;
      case EditMode.Enabled:
        this.targetForm.enable(this.SILENT_UPDATE_OPTION);
        break;
      case EditMode.Disabled:
        this.targetForm.disable(this.SILENT_UPDATE_OPTION);
        break;
    }
    this._updateControlStatesForTarget();
  }

  /**
   * Handles the user-initiated reset action.
   * 
   * > Live Mode
   * It signals a reset request to the parent component by emitting a null value.
   * The component itself remains in Live mode.
   * 
   * > Enabled Mode
   * It discards any unsaved changes by reverting the form to its original nodeShape data
   * and transitions the component back to Disabled mode.
   *
   * > Disabled Mode
   * No action is performed.
   */
  onReset(): void {
    switch (this.editMode) {
      case EditMode.Live:
        // NOTE: Do not manipulate state directly.
        // The parent will provide a new nodeShape, triggering the update.
        this.onValueChanges.emit({ value: null, isValid: true });
        break;
      case EditMode.Enabled:
        // Revert form to its original state.
        this.updateForm(this.nodeShape);
        this.setEditMode(EditMode.Disabled);
        break;
      case EditMode.Disabled:
      default:
        break; // Do nothing.
    }
  }

  private _subscribeToLiveChanges(): void {
    this._liveEditSub$?.unsubscribe(); // prevent stale events
    // debounceTime prevent race conditions.
    // When the target type changes, ensures form targetValue/targetValues 
    // are cleared before emitting the new state.
    this._liveEditSub$ = this.targetForm.valueChanges.pipe(
      takeUntil(this._destroySub$),
      debounceTime(100), // Needed so that order of operations work
      distinctUntilChanged((a, b) => isEqual(a, b)),
      filter(() => this.editMode === EditMode.Live && this.targetForm.enabled)
    ).subscribe(() => {
      this.onValueChanges.emit({
        value: this.createAdditionJsonLdObject(this.nodeShape),
        isValid: this.targetForm.valid
      });
    });
  }

  /**
   * Cleans up all subscriptions to avoid memory leaks.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  /**
   * Puts the form into edit mode, enabling form controls and applying appropriate validators.
   */
  onEdit(): void {
    if (this.editMode === EditMode.Live) {
      this._toast.createWarningToast('While in live editing mode can not put in edit mode');
      return;
    }
    this.setEditMode(EditMode.Enabled);
  }

  /**
   * Exits edit mode, disabling form controls, updates in InProgressCommit
   */
  onSave(): void {
    if (this.editMode === EditMode.Live) {
      this._toast.createWarningToast('Changes are automatically propagated in live mode.');
      return;
    }
    if (this.targetForm.valid) {
      this.updateInProgressCommit();
      this.setEditMode(EditMode.Disabled); // Set mode to disabled AFTER saving
      this.editMode = EditMode.Disabled; // TODO REMOVE
      this.targetForm.disable(this.SILENT_UPDATE_OPTION);
    } else {
      this._toast.createWarningToast('Can not save an invalid form.');
    }
  }

  /**
   * Initializes or resets the form by populating it with data from the nodeShape input.
   *
   * It detects the current SHACL target and its values, then uses patchValue to update
   * the form. Triggers a validation cycle (child also), ensuring the form's initial validity is set correctly.
   * The update is performed silently to prevent event emissions during setup phase.
   * 
   * @param nodeShape sync form with provided Node Shape
   */
  updateForm(nodeShape: JSONLDObject): void {
    const formData: Partial<TargetFormModel> = {};
    const targetType = this._targetDetector.detect(nodeShape);
    if (targetType) {
      formData.target = targetType.targetType;
      if (targetType.multiSelect) {
        formData.targetValues = targetType.values.map(iri => ({
          value: iri,
          label: this.stateService.getEntityName(iri)
        }));
      } else {
        const iri = (targetType as SingleTargetTypeData).value;
        formData.targetValue = {
          value: iri,
          label: this.stateService.getEntityName(iri)
        };
      }
    } else {
      this.targetOption = null;
      formData.target = '';
      formData.targetValue = null;
      formData.targetValues = [];
    }
    if (formData) {
      this.targetForm.patchValue(formData, this.SILENT_UPDATE_OPTION);
    }
  }

  /**
   * Resets the 'targetValue' and 'targetValues' controls in the form.
   */
  clearFormValues(): void {
    this.targetForm.patchValue({ targetValue: null, targetValues: [] }, this.SILENT_UPDATE_OPTION);
  }

  /**
   * Handles changes to the target radio buttons.
   * @param targetOption - The selectionChange event with the selected targetOption.
   */
  handleTargetChange(targetOption: TargetOption): void {
    if (this.targetOption?.iri === targetOption.iri) {
      return; // Skip if no change
    }
    this.targetOption = targetOption;
    this.targetForm.get('target')?.setValue(targetOption.iri, this.SILENT_UPDATE_OPTION);
    if (targetOption.isUserSelection) {
      this.clearFormValues();
    }
    this._updateControlStatesForTarget();
  }

  /**
   * Orchestrates the process of saving changes made to the SHACL Target.
   */
  updateInProgressCommit(): void {
    const deletionJson = this.createDeletionJsonLdObject(this.nodeShape);
    const additionJson = this.createAdditionJsonLdObject(this.nodeShape);
    if (isEqual(deletionJson, additionJson)) {
      return; // No changes to commit
    }
    if (deletionJson) {
      const propertiesToDelete = Object.keys(deletionJson).filter(key => key !== '@id');
      remove(this.stateService.listItem.additions, pendingAddition => {
        if (pendingAddition['@id'] !== deletionJson['@id']) {
          return false; // Not for the same shape.
        }
        // Return true (to remove) if the pendingAddition has any of the properties we are now deleting.
        return propertiesToDelete.some(propKey => Object.prototype.hasOwnProperty.call(pendingAddition, propKey));
      });
      // update state
      this.stateService.addToDeletions(this.versionedRdfRecord.recordId, deletionJson);
      this._updateSelectedListItemForDeletion(deletionJson);
    }
    if (additionJson) {
      this.stateService.addToAdditions(this.versionedRdfRecord.recordId, additionJson);
      this._updateSelectedListItemForAddition(additionJson);
    }
    if (deletionJson || additionJson) {
      this.stateService
        .saveCurrentChanges()
        .subscribe(() => {
          this.stateService.listItem.selected = cloneDeep(this.stateService.listItem.selected);
          if (additionJson) {
            this.stateService.updateNodeShapeSummaries(this.nodeShape, additionJson);
          }
        });
    }
  }

  /**
   * Generates a JSON-LD object representing addition object for adding to InProgressCommit.
   * This object is based on the current values in the targetForm and will be added to the in-progress commit.
   * @param {JSONLDObject} nodeShape The original node shape data before editing.
   * @returns {JSONLDObject | null} A JSON-LD object for the addition, or null if no target is set.
   */
  createAdditionJsonLdObject(nodeShape: JSONLDObject): JSONLDObject | null {
    const targetOption: TargetOption = this.targetOption;
    if (!targetOption) {
      return null; // No target option selected, nothing to add.
    }
    const target = targetOption.iri;
    const formData: Partial<TargetFormModel> = this.targetForm.value;
    const additionJson: JSONLDObject = {
      '@id': nodeShape['@id']
    };
    let isExplicitTarget = false;
    if (target === TARGET_NODE || target === TARGET_CLASS) {
      isExplicitTarget = true;
      if (formData.targetValue) { // handle null cases
        additionJson[target] = [{ '@id': formData.targetValue.value }];
      } else {
        additionJson[target] = [];
      }
    } else if (target === TARGET_OBJECTS_OF || target === TARGET_SUBJECTS_OF) {
      isExplicitTarget = true;
      additionJson[target] = formData.targetValues.map((option: ValueOption) => ({ '@id': option.value }));
    }
    if (target === IMPLICIT_REFERENCE) {
      let finalTypes = cloneDeep(nodeShape['@type'] || []);
      const hasNodeShapeType = finalTypes.includes(`${SH}NodeShape`);
      if (hasNodeShapeType) {
        finalTypes = finalTypes.filter(type => type !== `${SH}NodeShape`);
      } else {
        finalTypes.push(`${SH}NodeShape`);
      }
      IMPLICIT_TYPES.forEach((implicitType: string) => {
        if (!finalTypes.includes(implicitType)) {
          finalTypes.push(implicitType);
        }
      });
      if (finalTypes.length > 0) {
        additionJson['@type'] = finalTypes;
      }
    } else if (isExplicitTarget) {
      const finalTypes = cloneDeep(nodeShape['@type'] || []);
      if (!finalTypes.includes(`${SH}NodeShape`)) {
        additionJson['@type'] = [`${SH}NodeShape`];
      }
    }
    return additionJson;
  }

  /**
   * Generates a JSON-LD object representing the old SHACL target state to be removed.
   * This object is constructed from the original nodeShape data, ensuring all
   * previous target-related properties are marked for deletion.
   * @param {JSONLDObject} nodeShape The original node shape data before editing.
   * @returns {JSONLDObject | null} A JSON-LD object for the deletion, or null if no shape is provided.
   */
  createDeletionJsonLdObject(nodeShape: JSONLDObject): JSONLDObject | null {
    if (!nodeShape) {
      return null;
    }
    let shouldDelete = false;
    const deletionJson: JSONLDObject = {
      '@id': nodeShape['@id']
    };
    const targetType: TargetTypeData | null = this._targetDetector.detect(nodeShape);
    if (targetType && targetType.targetType === IMPLICIT_REFERENCE) {
      const implicitTypes = (nodeShape['@type'] || []).filter(
        (type: string) => type === `${OWL}Class` || type === `${RDFS}Class`
      );
      if (implicitTypes) {
        shouldDelete = true;
        deletionJson['@type'] = implicitTypes;
      }
    }
    EXPLICIT_TARGETS.forEach((targetType: string) => {
      if (nodeShape[targetType]) {
        shouldDelete = true;
        deletionJson[targetType] = this.nodeShape[targetType];
      }
    });
    if (shouldDelete) {
      return deletionJson;
    }
    return null;
  }

  /**
   * Updates the state of the selected list item based on a newly created addition object.
   * This method reads the additionJson to derive and apply all necessary side effects.
   *
   * @param additionJson The newly created JSON-LD object.
   */
  private _updateSelectedListItemForAddition(additionJson: JSONLDObject): void {
    const selectedItem = this.stateService.listItem.selected;
    for (const prop of EXPLICIT_TARGETS) {
      if (additionJson[prop] && Array.isArray(additionJson[prop])) {
        const targetValues: JSONLDId[] = additionJson[prop];
        targetValues.forEach(target => {
          this._pm.addId(selectedItem, prop, target['@id']);
        });
      }
    }
    if (additionJson['@type']) {
      selectedItem['@type'] = union(selectedItem['@type'], additionJson['@type']);
    }
  }

  /**
   * Updates the state of the selected list item by removing properties and types
   * specified in a deletion object.
   *
   * @param deletionJson The JSON-LD object describing what to remove.
   */
  private _updateSelectedListItemForDeletion(deletionJson: JSONLDObject): void {
    const selectedItem = this.stateService.listItem.selected;
    EXPLICIT_TARGETS.forEach((targetProperty: string) => {
      const valuesToRemove = deletionJson[targetProperty];
      const currentValues = selectedItem[targetProperty];
      if (valuesToRemove && Array.isArray(valuesToRemove) && currentValues && Array.isArray(currentValues)) {
        const updatedValues = differenceWith(currentValues, valuesToRemove, isEqual);
        if (updatedValues.length > 0) {
          selectedItem[targetProperty] = updatedValues; // If items remain, update the property.
        } else {
          delete selectedItem[targetProperty]; // If array empty, remove the property entirely
        }
      }
    });
    if (deletionJson['@type'] && Array.isArray(deletionJson['@type'])) {
      selectedItem['@type'] = difference(selectedItem['@type'], deletionJson['@type']);
    }
  }

  /**
   * Synchronizes the enabled/disabled state of the form controls within targetForm
   * based on the selected SHACL target type and the component's edit mode.
   *
   * It ensures that only the form control relevant to the selected target type is enabled,
   * preventing user input in fields that are not applicable.
   *
   * After adjusting the control states, it forces a re-evaluation of the form's validity.
   * Critical because a control's disabled status affects its validity, and it
   * triggers the NG_VALIDATORS on any active custom form components.
   */
  private _updateControlStatesForTarget(): void {
    const targetControl = this.targetForm.get('target');
    const targetValueControl = this.targetForm.get('targetValue');
    const targetValuesControl = this.targetForm.get('targetValues');
    if (!targetControl || !targetValueControl || !targetValuesControl) {
      this._toast.createErrorToast(this._MISSING_CONTROLS_ERROR);
      return;
    }
    const targetTypeIri = this.targetForm.get('target').value || '';
    // Enable the correct control based on the target type
    if (this.editMode === EditMode.Enabled || this.editMode === EditMode.Live) {
      if (targetTypeIri === TARGET_NODE || targetTypeIri === TARGET_CLASS) {
        targetValueControl.enable(this.SILENT_UPDATE_OPTION);
        targetValuesControl.disable(this.SILENT_UPDATE_OPTION);
      } else if (targetTypeIri === TARGET_OBJECTS_OF || targetTypeIri === TARGET_SUBJECTS_OF) {
        targetValueControl.disable(this.SILENT_UPDATE_OPTION);
        targetValuesControl.enable(this.SILENT_UPDATE_OPTION);
      } else {
        // IMPLICIT_REFERENCE and other cases
        targetValueControl.disable(this.SILENT_UPDATE_OPTION);
        targetValuesControl.disable(this.SILENT_UPDATE_OPTION);
      }
    } else {
      targetValueControl.disable(this.SILENT_UPDATE_OPTION);
      targetValuesControl.disable(this.SILENT_UPDATE_OPTION);
    }
    // Update validity, cascade down to children.
    this.targetForm.updateValueAndValidity(this.SILENT_UPDATE_OPTION);
    // Update parent's form validity to synchronize with child's form validity.
    this._cdr.detectChanges();
  }

}
