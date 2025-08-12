/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { cloneDeep, difference, differenceWith, isEqual, remove, union } from 'lodash';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { OWL, RDFS, SH } from '../../../prefixes';
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
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';

/**
 * Data model for the SHACL Target form.
 *
 * @property {string} target SHACL target type IRI.
 * @property {string} targetValue IRI value for single-value targets.
 * @property {string[]} targetValues Array of IRIs for multi-value targets.
 */
interface TargetFormModel {
  target: string;
  targetValue: string;
  targetValues: string[];
}

/**
 * Interface defining the FormControl instances for the targetForm FormGroup.
 *
 * @property {FormControl<string>} target FormControl for the target type.
 * @property {FormControl<string>} targetValue FormControl for the targetValue (single IRI).
 * @property {FormControl<string[]>} targetValues FormControl for the targetValues (array of IRIs).
 */
interface TargetFormControls {
  target: FormControl<string>;
  targetValue: FormControl<string>;
  targetValues: FormControl<string[]>;
}

/**
 * Defines the possible editing states of the component.
 * - `DISABLED`: Read-only mode. Form controls are disabled.
 * - `ENABLED`: User clicks Edit, makes changes, then clicks Save.
 */
type EditMode = 'DISABLED' | 'ENABLED';

/**
 * @class ShaclTargetComponent
 * @requires ChangeDetectorRef
 * @requires NonNullableFormBuilder
 * @requires ToastService
 * @requires ShapesGraphStateService
 *
 * A component that displays the 'Target' section for a selected SHACL Node Shape.
 *
 * SHACL Targets define which RDF nodes a given shape applies to. This component presents
 * a collection of readonly radio buttons for the supported SHACL target types.
 *
 * Reference: https://www.w3.org/TR/shacl/#targets
 *
 * @param {VersionedRdfRecord} versionedRdfRecord The full versioned RDF record for the shapes graph.
 * @param {JSONLDObject} nodeShape The selected item containing node shape data to display.
 * @param {boolean} isImported Indicates whether the entity was imported from another source.
 * @param {boolean} canModify Indicates whether the user has permission to modify the nodeShape.
 */
@Component({
  selector: 'app-shacl-target',
  templateUrl: './shacl-target.component.html'
})
export class ShaclTargetComponent implements OnChanges, OnDestroy {
  @Input() versionedRdfRecord: VersionedRdfRecord;
  @Input() nodeShape: JSONLDObject;
  @Input() isImported: boolean;
  @Input() canModify: boolean;

  private _targetDetector: ShaclTargetDetector;
  private _destroySub$ = new Subject<void>();

  targetForm: FormGroup<TargetFormControls>;
  targetOption: TargetOption;
  editMode: EditMode = 'DISABLED';

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

  constructor(
    private _cdr: ChangeDetectorRef,
    private _fb: NonNullableFormBuilder,
    private _toast: ToastService,
    public stateService: ShapesGraphStateService,
    public pm: PropertyManagerService
  ) {
    this._targetDetector = new ShaclTargetDetector();
    this.targetForm = this._fb.group({
      target: ['', Validators.required],
      targetValue: [''],
      targetValues: [[] as string[]]
    });
    this.targetForm.disable(this.SILENT_UPDATE_OPTION);
  }

  /*
   * Resets edit mode and form status.
   * If a new nodeShape is provided, the form is updated.
   *
   * @param changes Object containing the changed input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.editMode = 'DISABLED';
    this.targetForm.disable(this.SILENT_UPDATE_OPTION);
    if (changes.nodeShape?.currentValue) {
      this._updateForm(this.nodeShape);
    }
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
    this.editMode = 'ENABLED';
    this.targetForm.enable(this.SILENT_UPDATE_OPTION);
    if (this.targetOption) {
      this._updateControlStatesForTarget(this.targetOption.iri);
    }
  }

  /**
   * Exits edit mode, disabling form controls, updates in InProgressCommit
   */
  onSave(): void {
    if (this.targetForm.valid) {
      this.updateInProgressCommit();
      this.editMode = 'DISABLED';
      this.targetForm.disable(this.SILENT_UPDATE_OPTION);
    } else {
      this._toast.createWarningToast('Can not save an invalid form.');
    }
  }

  /**
   * Orchestrates the process of saving changes made to the SHACL Target.
   */
  updateInProgressCommit(): void {
    const deletionJson = this.createDeletionJsonLdObject(this.nodeShape);
    const additionJson = this.createAdditionJsonLdObject(this.nodeShape);
    if (isEqual(deletionJson, additionJson)) {
      return;
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
      additionJson[target] = [{ '@id': formData.targetValue }];
    } else if (target === TARGET_OBJECTS_OF || target === TARGET_SUBJECTS_OF) {
      isExplicitTarget = true;
      additionJson[target] = formData.targetValues.map((iri: string) => ({ '@id': iri }));
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
   * Resets the 'targetValue' and 'targetValues' controls in the form.
   */
  clearFormValues(): void {
    this.targetForm.patchValue({ targetValue: '', targetValues: [] }, this.SILENT_UPDATE_OPTION);
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
    if (targetOption.isUserSelection) {
      this.clearFormValues();
    }
    this._updateControlStatesForTarget(targetOption.iri);
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
          this.pm.addId(selectedItem, prop, target['@id']);
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
   *
   * @param targetTypeIri The IRI of the selected SHACL target type.
   */
  private _updateControlStatesForTarget(targetTypeIri: string): void {
    const targetValueControl = this.targetForm.get('targetValue');
    const targetValuesControl = this.targetForm.get('targetValues');
    if (!targetValueControl || !targetValuesControl) {
      this._toast.createErrorToast('An unexpected error occurred while loading the editor.');
      return;
    }
    if (this.editMode === 'ENABLED') {
      // Enable the correct control based on the target type
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

  /**
   * Initializes or resets the form by populating it with data from the nodeShape input.
   *
   * It detects the current SHACL target and its values, then uses patchValue to update
   * the form. Triggers a validation cycle (child also), ensuring the form's initial validity is set correctly.
   * The update is performed silently to prevent event emissions during setup phase.
   * 
   * @param nodeShape sync form with provided Node Shape
   */
  private _updateForm(nodeShape: JSONLDObject): void {
    const formData: Partial<TargetFormModel> = {};

    const targetType = this._targetDetector.detect(nodeShape);
    if (targetType) {
      formData.target = targetType.targetType;
      if (targetType.multiSelect) {
        formData.targetValues = targetType.values as string[];
      } else {
        formData.targetValue = (targetType as SingleTargetTypeData).value;
      }
    } else {
      formData.target = '';
      formData.targetValue = '';
      formData.targetValues = [];
    }
    if (formData) {
      this.targetForm.patchValue(formData, this.SILENT_UPDATE_OPTION);
    }
  }
}
