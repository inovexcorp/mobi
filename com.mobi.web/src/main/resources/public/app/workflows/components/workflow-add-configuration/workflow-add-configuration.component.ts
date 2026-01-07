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
import { AbstractControl, FormBuilder, FormGroup } from '@angular/forms';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';

import { capitalize, cloneDeep, difference, get, isEqual } from 'lodash';
import { v4 } from 'uuid';

import { Difference } from '../../../shared/models/difference.class';
import { EntityType } from '../../models/workflow-display.interface';
import { EntityTypeConfig, ModalConfig, ModalType } from '../../models/modal-config.interface';
import { FormValues } from '../../../shacl-forms/models/form-values.interface';
import { getEntityName, getEntityNameProp, getPropertyId, getPropertyValue, getShaclGeneratedData, setDctermsValue }
  from '../../../shared/utility';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';
import { DCTERMS, RDFS, SH, WORKFLOWS } from '../../../prefixes';
import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { SHACLFormFieldConfig } from '../../../shacl-forms/models/shacl-form-field-config';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';

interface DistinctValues {
  base: (JSONLDId|JSONLDValue)[],
  changes: (JSONLDId|JSONLDValue)[]
}

/**
 * @class WorkflowAddConfigurationComponent
 * 
 * A component which creates content for a modal that can add or edit the configuration of an entity in a Workflow.
 * Generates a form with a selector for all the different types of entities that can be created in the context (actions
 * or triggers) and then creates a {@link SHACLFormComponent} using the SHACL definitions of the selected
 * entity type. When submitted, returns the {@link Difference} for the added or edited entity.
 * 
 * @param {ModalConfig} data The configuration for the modal display. Includes details about the Workflow,
 * WorkflowRecord, entity type to add/edit, SHACL definitions for the different entity types, and any selected
 * configuration for editing
 */
@Component({
  selector: 'app-workflow-add-configuration',
  templateUrl: './workflow-add-configuration.component.html'
})
export class WorkflowAddConfigurationComponent implements OnInit {
  /**
   * An error message to display
   * 
   * @type {string} 
   */
  errorMsg: string;
  /**
   * List of configuration type IRIs
   *
   * @type {string[]}
   */
  configurationTypeIris: string[];
  /**
   * Form group definition
   *
   * @type {FormGroup}
   * @property configType - The control for the configuration type.
   */
  configurationFormGroup: FormGroup = this._fb.group({
    configType: [],
    actionTitle: ''
  });
  /**
   * Represents a list of entity type configurations.
   * 
   * @type {EntityTypeConfig[]}
   */
  configurationList: EntityTypeConfig[] = [];
  /**
   * Selected configuration.
   * 
   * @type {EntityTypeConfig}
   */
  selectedConfiguration: EntityTypeConfig;
  /**
   * A variable representing the title of the modal.
   *
   * @type {string}
   */
  modalTitle = '';
  /**
   * Whether the submit button should be disabled. Should update based on form validity.
   * 
   * @type {boolean}
   */
  submitDisabled = true;
  /**
   * Whether the generated SHACL form is valid.
   * 
   * @type {boolean}
   */
  shaclFormValid = false;
  /**
   * The JSON-LD of the main workflow entity being edited.
   * 
   * @type {JSONLDObject}
   */
  entityBeingEdited: JSONLDObject;

  /**
   * Represents the previous value of a title before it is changed in the modal.
   */
  previousTitleValue = undefined;

  /**
   * A boolean variable that indicates whether the values in the SHACL form value has changed. It is changed when
   * the SHACL Config form component emits that a change to its values has happened. Will also update when the type
   * of configuration is changed and the modal is in edit mode.
   *
   */
  formValueChanged = false;

  /**
   * Represents the type of annotation used in a specific context or application.
   * This could indicate the metadata terms or standards being applied,
   * such as Dublin Core Terms (DC Terms).
   *
   * This variable is useful for identifying the annotation standard or schema in use,
   * which can provide a consistent structure for describing resources.
   *
   * Possible usage includes labeling, organizing, or categorizing information
   * according to a recognized metadata specification.
   */
  annotationType = DCTERMS;

  constructor(@Inject(MAT_DIALOG_DATA) public data: ModalConfig,
              private _fb: FormBuilder,
              private _dialogRef: MatDialogRef<WorkflowAddConfigurationComponent>,
              private _wms: WorkflowsManagerService,
              private _sms: SettingManagerService,
              private _ref: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.configurationTypeIris = Object.keys(this.data.shaclDefinitions);
    this._setConfigurationByType(this.configurationTypeIris);
    this._setTitle(capitalize(this.data.entityType));

    this._sms.getAnnotationPreference().subscribe(preference => {
      this.annotationType = preference === 'DC Terms' ? DCTERMS : RDFS;
    }, error => {
      this.annotationType = DCTERMS;
      console.error(error);
    });

    if (this.data.mode === ModalType.EDIT) {
      this.shaclFormValid = true;
      this.setFormValues();
      if (this.selectedConfiguration) {
        this._setTitle(this.selectedConfiguration.label);
      }
    }
  }
  /**
   * Generate form field configurations based on the given JSONLDObject and IRI.
   *
   * @param {JSONLDObject[]} configuration - The JSONLDObject array to search for the node shape.
   * @param {string} iri - The IRI of the node shape to search for.
   * @return {Object} - An object containing the node shape and form field configurations.
   */
  generateFormFieldConfigs(configuration: JSONLDObject[], iri: string): {
    nodeShape: JSONLDObject,
    formFieldConfigs: SHACLFormFieldConfig[]
  } {
    const nodeShape = configuration.find(element => element['@id'] === iri);
    const formFieldConfigs = this.buildFormFieldConfigs(configuration, nodeShape);
    return {
      nodeShape,
      formFieldConfigs: formFieldConfigs,
    };
  }
  /**
   * Builds an array of form field configurations based on the given configuration and node shape.
   *
   * @param {JSONLDObject[]} configuration - The configuration to use for building form field configurations.
   * @param {JSONLDObject} nodeShape - The node shape to extract properties from.
   * @return {SHACLFormFieldConfig[]} - An array of form field configurations.
   */
  buildFormFieldConfigs(configuration: JSONLDObject[], nodeShape: JSONLDObject): SHACLFormFieldConfig[] {
    return get(nodeShape, `${SH}property`, [])
      .map(propertyShapeId => new SHACLFormFieldConfig(nodeShape, propertyShapeId['@id'], configuration));
  }
  /**
   * Updates the selected configuration and performs necessary actions.
   *
   * @param {MatSelectChange} value - The change event object containing the new value for the configuration.
   */
  configurationControlChange({ value = {} }: MatSelectChange): void {
    this.formValueChanged = this.data.mode !== ModalType.EDIT;
    this.selectedConfiguration = undefined; // Removes existing SHACL form so it can be reinitialized with new fields
    this._ref.detectChanges();
    this.selectedConfiguration = value;
    this._setTitle(value.label);
    if (this.configurationFormGroup.controls.actionTitle.dirty) {
      this._checkSubmissionAvailability();
    } else {
      this.submitDisabled = true;
    }
  }

  /**
   * Updates the title value by performing necessary checks to ensure submission availability.
   */
  updateTitleValue(): void {
    this._checkSubmissionAvailability();
  }
  /**
   * Updates the form values of the selected configuration.
   *
   * @param {FormValues} $event - The updated form values.
   */
  updateFormValues($event: FormValues): void {
    this.formValueChanged = true;
    this.selectedConfiguration.formValues = $event;
  }
  /**
   * Updates the validity of a form based on the given form validity string. If the string is 'INVALID', the 
   * submitDisabled property will be set to true, indicating that the form should be disabled for submission.
   *
   * @param {string} $event - The event that occurred, representing the current validity state of the form.
   */
  updateFormValidity($event: string): void {
    this.shaclFormValid = $event !== 'INVALID';
    this.submitDisabled = !this.shaclFormValid;
  }
  /**
   * Submits the form data to the server. If the form is valid, the method returns without performing any actions. If
   * the form is not valid, the method does not call the endpoint and closes the dialog window.
   */
  submit(): void {
    this.errorMsg = '';
    if ((!this._isFormValid() || !this.shaclFormValid) && !this.configurationFormGroup.controls.actionTitle.dirty) {
      return;
    }

    const data = this._buildDifference();
    if (data?.hasChanges()) {
      this._wms.updateWorkflowConfiguration(data, this.data.recordIRI).subscribe(() => {
        this._dialogRef.close(data);
      }, (error: string) => {
        this.errorMsg = error;
      });
    } else {
      this._dialogRef.close(undefined);
    }
  }
  /**
   * Compares two JSON-LD objects for equality and returns any found differences.
   *
   * @param {JSONLDObject} base - The first object to compare.
   * @param {JSONLDObject} changes - The second object to compare.
   * @returns {Difference} A Difference containing any data found different between the two objects
   */
  getObjectDiff(base: JSONLDObject, changes: JSONLDObject): Difference {
    const baseKeys = Object.keys(base).filter(key => !['@id', '@type'].includes(key));
    const changesKeys = Object.keys(changes).filter(key => !['@id', '@type'].includes(key));
    const delObject: JSONLDObject = {
      '@id': base['@id']
    };
    const addObject: JSONLDObject = {
      '@id': base['@id']
    };

    for (const key of baseKeys) {
      if (!changesKeys.includes(key)) {
        delObject[key] = base[key];
      } else {
        const distinctValues = this._getDistinctValues(base[key], changes[key]);
        if (distinctValues.base.length || distinctValues.changes.length) {
          delObject[key] = distinctValues.base;
          addObject[key] = distinctValues.changes;
        }
      }
    }

    const newProps = difference(changesKeys, baseKeys);
    newProps.forEach(prop => {
      addObject[prop] = changes[prop];
    });

    return new Difference(Object.keys(addObject).length > 1 ? [addObject] : [], 
      Object.keys(delObject).length > 1 ? [delObject] : []);
  }
  /**
   * Sets form values based on the given data and configuration.
   */
  setFormValues(): void {
    this.entityBeingEdited = this.data.workflowEntity.find(obj => obj['@id'] === this.data.selectedConfigIRI);
    const title = getEntityName(this.entityBeingEdited, false);
    const type = this.getConfigurationType(this.entityBeingEdited['@type']);
    const config = this.configurationList.find(item => item.value === type[0]);
    this.configurationFormGroup.controls.configType.setValue(config);
    this.selectedConfiguration = config;

    if (title) {
      this.previousTitleValue = title;
      this.configurationFormGroup.controls.actionTitle.setValue(title);
    }

    this.configurationFormGroup.controls.configType.markAllAsTouched();
  }
  /**
   * Filters out specific configuration types from the given types array.
   *
   * @param {string[]} types - The array of configuration types.
   * @return {string[]} - The filtered array of configuration types.
   */
  getConfigurationType(types: string[]): string[] {
    const filterOut = [
      this._buildWorkflowsIRI('Action'), 
      this._buildWorkflowsIRI('Trigger'), 
      this._buildWorkflowsIRI('EventTrigger')
    ];
    return types.filter(item => !filterOut.includes(item));
  }

  /*****************
   * Private methods
   ****************/

  /**
   * Builds a Difference containing all the changed triples based on the SHACL form data and any provided starting
   * configuration data. Even if the modal is in Edit mode, if there is no existing Trigger, will create the Difference
   * for a Trigger to be added.
   * @private
   *
   * @returns {Difference} The added and removed triples represented by the form value changes
   */
  private _buildDifference(): Difference {
    const {formValues} = this.selectedConfiguration;
    const titleControl: AbstractControl = this.configurationFormGroup.controls.actionTitle;
    if (!formValues && !titleControl.dirty) { //no changes have been made
      return new Difference();
    } else if (!formValues && titleControl.dirty) { //only updating the title
      return this._createTitleDiff(this.data.workflowEntity[0]);
    }

    const isEditMode = this.data.mode === ModalType.EDIT;
    const nodeShape = this.selectedConfiguration.nodeShape;
    const isEditActionTrigger = () => (this.data.entityType === EntityType.ACTION ||
      (this.data.entityType === EntityType.TRIGGER && this.data.selectedConfigIRI));
    if (isEditMode && isEditActionTrigger()) {
      return this._editEntity(formValues, nodeShape);
    } else {
      return this._addEntity(formValues, nodeShape);
    }
  }
  /**
   * Returns whether the given values for an individual property are distinct or not.
   * @private
   *
   * @param {(JSONLDId|JSONLDValue)[]} baseValues - The starting values to compare
   * @param {(JSONLDId|JSONLDValue)[]} changedValues - The changed values to compare
   * @returns {Object} - Returns an object with the values from each array that are distinct
   */
  private _getDistinctValues(baseValues: (JSONLDId | JSONLDValue)[], changedValues: (JSONLDId | JSONLDValue)[]): DistinctValues {
    const distinctValues: DistinctValues = { base: [], changes: [] };
    if (isEqual(baseValues, changedValues)) {
      return distinctValues;
    }

    distinctValues.base = baseValues.filter(baseVal => !changedValues.find(changedVal => isEqual(baseVal, changedVal)));
    distinctValues.changes = changedValues.filter(changedVal => !baseValues.find(baseVal => isEqual(changedVal, baseVal)));
    return distinctValues;
  }
  /**
   * Checks if the form is valid and pristine.
   * @private
   * 
   * @returns {boolean} Returns true if the form is invalid and pristine, otherwise false.
   */
  private _isFormValid(): boolean {
    return this.configurationFormGroup.status === 'VALID';
  }
  /**
   * Sets the list of entity type configurations.
   * @private
   * 
   * @param {string[]} list - The list of entity types.
   */
  private _setConfigurationByType(list: string[]): void {
    this.configurationList = list.map(typeIRI => {
      const config = this.generateFormFieldConfigs(this.data.shaclDefinitions[typeIRI], typeIRI);
      return {
        formValues: undefined,
        value: typeIRI,
        label: getPropertyValue(config.nodeShape, `${RDFS}label`),
        ...config
      };
    });
  }
  /**
   * Sets the title of the modal with a prefix.
   * @private
   *
   * @param {string} title - The title to set for the modal after the prefix.
   */
  private _setTitle(title: string): void {
    const prefix = `${this.data.mode === ModalType.ADD ? 'Add' : 'Edit'} - `;
    this.modalTitle = `${prefix}${title}`;
  }
  /**
   * Builds an IRI by appending a given string to the constant WORKFLOWS namespace.
   * @private
   *
   * @param {string} key - The string to append to the WORKFLOWS namespace.
   * @return {string} - The generated IRI.
   */
  private _buildWorkflowsIRI(key: string): string {
    return `${WORKFLOWS}${key}`;
  }
  /**
   * Returns the base type IRI for this type of configuration.
   * @private
   * 
   * @returns {string} An IRI string
   */
  private _getDefaultType(): string {
    return this._buildWorkflowsIRI(capitalize(this.data.entityType));
  }
  /**
   * Creates an array of type IRIs based off the provided SHACL NodeShape. NOTE: Assumes the NodeShape uses implicit
   * class targeting.
   * @private
   * 
   * @param {JSONLDObject} nodeShape - The node shape to create the types array from
   * @returns {string[]} An array of type IRIs
   */
  private _getTypes(nodeShape: JSONLDObject): string[] {
    const subClassOf = getPropertyId(nodeShape, `${RDFS}subClassOf`);
    const defaultType = this._getDefaultType();
    const types = [nodeShape['@id'], subClassOf];
    if (subClassOf !== defaultType) {
      types.push(defaultType);
    }
    return types;
  }
  /**
   * Creates a Difference for editing an entity.
   * @private
   * 
   * @param {FormValues} formValues - The new form values for the entity.
   * @param {JSONLDObject} nodeShape - The node shape for the entity.
   * @return {Difference} - The diff between the workflow activity and the edited definition.
   */
  private _editEntity(formValues: FormValues, nodeShape: JSONLDObject): Difference {
    const entityChanges: JSONLDObject = {
      '@id': this.data.selectedConfigIRI
    };
    const generatedData = getShaclGeneratedData(entityChanges, this.selectedConfiguration.formFieldConfigs, formValues);

    let diff: Difference;
    // If the type of entity was changed, assumes there are no shared triples and calculates additional changes
    if (!this.entityBeingEdited['@type'].includes(this.selectedConfiguration.value)) {
      const newTypes = this._getTypes(nodeShape);
      entityChanges['@type'] = difference(newTypes, this.entityBeingEdited['@type']);
      const entityDeletions = cloneDeep(this.entityBeingEdited);
      entityDeletions['@type'] = difference(entityDeletions['@type'], newTypes);
      this._updateEntityTitle(entityDeletions, entityChanges);
      diff = new Difference([entityChanges], [entityDeletions]);
    } else {
      this._updateEntityTitle(this.entityBeingEdited, entityChanges);
      diff = this.getObjectDiff(this.entityBeingEdited, entityChanges);
    }
    this._updateDiffForReferencedObjects(diff, generatedData);
    return diff;
  }
  /**
   * Updates the provided Difference comparing the provided generated data from a SHACL form to the original workflow
   * entity data in regards to referenced objects, not the main workflow entity itself.
   * @private
   * 
   * @param {Difference} diff The Difference to update
   * @param {JSONLDObject[]} generatedData Generated data from a SHACL form representing the new values to set
   */
  private _updateDiffForReferencedObjects(diff: Difference, generatedData: JSONLDObject[]): void {
    if (this.data.workflowEntity.length > 1) {
      this.data.workflowEntity.filter(obj => obj['@id'] !== this.data.selectedConfigIRI)
        .forEach(obj => {
          const editedObj = generatedData.find(edited => edited['@id'] === obj['@id']);
          if (editedObj) {
            const objDiff = this.getObjectDiff(obj, editedObj);
            if (objDiff.additions.length) {
              diff.additions = (diff.additions as JSONLDObject[]).concat((objDiff.additions as JSONLDObject[]));
            }
            if (objDiff.deletions.length) {
              diff.deletions = (diff.deletions as JSONLDObject[]).concat((objDiff.deletions as JSONLDObject[]));
            }
          } else {
            (diff.deletions as JSONLDObject[]).push(obj);
          }
        });
    }
    generatedData.filter(genObj => !this.data.workflowEntity.find(obj => obj['@id'] === genObj['@id']))
      .forEach(newObj => {
        (diff.additions as JSONLDObject[]).push(newObj);
      });
  }
  /**
   * Creates a Difference for adding an entity.
   * @private
   * 
   * @param {FormValues} formValues - The form values for the entity.
   * @param {JSONLDObject} nodeShape - The JSON-LD of the node shape for the entity.
   * @returns {Difference} - The difference object with the updated configuration and old properties.
   */
  private _addEntity(formValues: FormValues, nodeShape: JSONLDObject): Difference {
    const workflowIri = this.data.workflowIRI.replace('#', '/');
    const newEntity: JSONLDObject = {
      '@id': `${workflowIri}/${this.data.entityType}#${v4()}`,
      '@type': this._getTypes(nodeShape)
    };
    const newValues = getShaclGeneratedData(newEntity, this.selectedConfiguration.formFieldConfigs, formValues);
    const newTitleControl: AbstractControl<any, any> = this.configurationFormGroup.controls.actionTitle;

    if (newTitleControl.value.length > 0 && newTitleControl.dirty) {
      const titleProperty = this.annotationType === DCTERMS ? `${this.annotationType}title` : `${this.annotationType}label`;
      newValues[0][titleProperty] = [{'@value': newTitleControl.value}];
    }

    const parentChanges: JSONLDObject = {
      '@id': this.data.parentIRI,
      [this.data.parentProp]: [{ '@id': newEntity['@id'] }]
    };
    return new Difference([parentChanges].concat(newValues));
  }

  /**
   * Creates a diff object representing changes to the title property of a workflow entity when that is the only
   * change being made.
   *
   * @param {Object} workflowEntity - The workflow entity containing title information to be processed.
   * @return {Difference} An object representing the changes to the title property, including additions and deletions.
   */
  private _createTitleDiff(workflowEntity: JSONLDObject): Difference {
    const titleProperty = getEntityNameProp(workflowEntity, this._sms);
    const newTitleProperty = this.annotationType === DCTERMS ? `${this.annotationType}title` : `${this.annotationType}label`;
    const titles = cloneDeep(workflowEntity[titleProperty]);
    const titleControl: AbstractControl = this.configurationFormGroup.controls.actionTitle;
    if (titles?.length > 0) {
      const changedTitleIndex = titles.findIndex(title => title['@value'] === this.previousTitleValue);
      const changedTitleObj = cloneDeep(titles[changedTitleIndex]);

      const delObj: JSONLDObject = {
        '@id': this.data.selectedConfigIRI,
        [titleProperty]: [changedTitleObj]
      };

      if (titleControl.value) {
        let newValue: any;
        if (changedTitleObj && changedTitleObj['@language']) {
          const lang = changedTitleObj['@language'];
          newValue = [
            {
              '@value': titleControl.value,
              '@language': lang
            }
          ];
        } else {
          newValue = [{'@value': titleControl.value}];
        }

        const addObj: JSONLDObject = {
          '@id': this.data.selectedConfigIRI,
          [newTitleProperty]: newValue
        };

        return new Difference([addObj], [delObj]);
      } else {
        return new Difference([], [delObj]);
      }
    } else if ((titles?.length === 0 || titles === undefined) && titleControl.value) {
      const addObj: JSONLDObject = {
        '@id': this.data.selectedConfigIRI,
        [newTitleProperty]: [{'@value': titleControl.value}]
      };

      return new Difference([addObj], []);
    }
  }

  /**
   * Updates the title(s) of the specified entity based on changes made or a type change.
   *
   * @param {JSONLDObject} entityBeingEdited - The current entity being edited containing all its properties.
   * @param {JSONLDObject} entityChanges - The object capturing changes that need to be applied to the entity.
   * @return {void} Does not return a value. Updates the entityChanges object directly with the modified title.
   */
  private _updateEntityTitle(entityBeingEdited: JSONLDObject, entityChanges: JSONLDObject): void {
    if (this.configurationFormGroup.controls.actionTitle.dirty) {
      const titleProperty = getEntityNameProp(entityBeingEdited, this._sms);
      const newTitleProperty = this.annotationType === DCTERMS ? `${this.annotationType}title` : `${this.annotationType}label`;
      const titles = cloneDeep(entityBeingEdited[titleProperty]);
      if (titles?.length > 0) {
        const changedTitleIndex = titles.findIndex(title => title['@value'] === this.previousTitleValue);
        // const changedTitleObj = cloneDeep(titles[changedTitleIndex]);
        titles[changedTitleIndex]['@value'] = this.configurationFormGroup.controls.actionTitle.value;
        entityChanges[newTitleProperty] = titles;
      } else {
        if (this.configurationFormGroup.controls.actionTitle.value) {
          setDctermsValue(entityChanges, 'title', this.configurationFormGroup.controls.actionTitle.value);
        }
      }
    } else if (!this.configurationFormGroup.controls.actionTitle.dirty) {
      const titleProperty = getEntityNameProp(entityBeingEdited, this._sms);
      delete entityBeingEdited[titleProperty];
    }
  }

  /**
   * Checks the availability of the submission button based on form changes and validity.
   * Updates the `submitDisabled` property to enable or disable the submission button.
   */
  private _checkSubmissionAvailability(): void {
    //check to see if the form has been changed
    if (!this.formValueChanged && this.configurationFormGroup.controls.configType.value) {
      this.submitDisabled = false;
    } else {
      this.submitDisabled = !(this.formValueChanged && this.shaclFormValid);
    }
  }
}
