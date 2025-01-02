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
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, forkJoin, from, of } from 'rxjs';
import { concatMap, map, toArray } from 'rxjs/operators';
import { v4 } from 'uuid';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { FieldType, SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';
import { Option } from '../../models/option.class';
import { FormValues } from '../../models/form-values.interface';
import { getPropertyId, getPropertyValue, getShaclGeneratedData } from '../../../shared/utility';
import { SHACLFormManagerService } from '../../services/shaclFormManager.service';

interface RawFormValues {
  [key: string]: Option | string | { [key: string]: string|Option } | (Option |string | { [key: string]: { [key: string]: string|Option }})[]
}

interface FormComponent {
  hasSubFields: boolean,
  config: SHACLFormFieldConfig,
  isMultivalued: boolean,
  maxValues?: number
}

/**
 * @class shacl-forms.SHACLFormComponent
 * 
 * A component which creates an Angular Reactive form for a specific SHACL NodeShape and its associated PropertyShapes.
 * Creates a {@link shared.SHACLFormFieldComponent} for every form field configuration with names of the property IRIs
 * controlled by the underlying PropertyShapes. If a form field configuration supports more than one value and is not
 * for a checkbox, creates buttons to add and remove multiple fields. Pre-populates the fields given the provided
 * JSON-LD object representing an instance of the type specified by the NodeShape. Provides hooks on form value and
 * status updates so the parent component can adapt as needed.
 * 
 * @param {JSONLDObject} nodeShape The JSON-LD of the parent NodeShape for the provided form field configurations array
 * @param {SHACLFormFieldConfig[]} formFieldConfigs An array of all the form field configurations to be displayed for
 * this form
 * @param {JSONLDObject} genObj The JSON-LD to use to pre-populate the form. Expects the array to contain an object with
 * properties corresponding to the PropertyShapes represented in the form field configurations. The other objects are
 * any associated objects needed for the object fields
 * @param {Function} updateEvent A Function that expects a parameter of the values of the form and is called every time
 * any one of the fields is updated.
 * @param {Function} statusEvent A Function that expects a parameter of the status string of the form and is called
 * every time the status of the overall form is updated.
 */
@Component({
  selector: 'app-shacl-form',
  templateUrl: './shacl-form.component.html',
  styleUrls: ['./shacl-form.component.scss']
})
export class SHACLFormComponent implements OnInit {

  @Input() nodeShape: JSONLDObject;
  @Input() formFieldConfigs: SHACLFormFieldConfig[] = [];
  @Input() genObj: JSONLDObject[];

  @Output() updateEvent = new EventEmitter<FormValues>();
  @Output() statusEvent = new EventEmitter<string>();

  formComponents: FormComponent[] = [];

  form: FormGroup = this._fb.group({});

  focusNode: JSONLDObject[] = [];

  constructor(private _fb: FormBuilder, private _sh: SHACLFormManagerService, private _ref: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.formComponents = this._generateFormComponents();
    this._populateForm();
    // Whenever a value in the form changes, emit the new values to the parent component
    this.form.valueChanges.subscribe((newValues: RawFormValues) => {
      this.updateEvent.emit(this._normalizeFormValues(newValues));
    });
    // Emits any form status changes to the parent component
    this.form.statusChanges.subscribe(newStatus => {
      this.statusEvent.emit(newStatus);
    });
  }

  /**
   * Sets the `focusNode` property to the object generated by the fields in this form. Does not include any associated
   * object data. Determines whether a property value is a literal or an IRI based on REGEX.
   */
  generateFocusNodeFromForm(): void { 
    const node: JSONLDObject = {
      '@id': `https://mobi.solutions/ontologies/form#${v4()}`,
      '@type': [this.nodeShape['@id']]
    };

    // Normalize the form values first
    const normalizedValues = this._normalizeFormValues(this.form.value);
    // In the future will want to actually set all the generated data to focus node and change the autocomplete options
    // call to support more than one object passed
    getShaclGeneratedData(node, this.formFieldConfigs, normalizedValues);
    if (Object.keys(node).length > 2) {
      this.focusNode = [node];
    } else {
      this.focusNode = undefined;
    }
  }

  /**
   * Adds a new value block for the field represented by the provided FormComponent. As the new FormGroup is added to
   * the field's FormArray, the valueChanges event will be emitted. Assumes the provided FormComponent is multivalued.
   * 
   * @param {FormComponent} comp A multivalued form component that needs a new set of values added
   */
  addFormBlock(comp: FormComponent): void {
    const array: FormArray = this.form.get([comp.config.property]) as FormArray;
    const newIndex = array.controls.length;
    let group: FormGroup;
    if (comp.hasSubFields) { // If the field generates an associated object
      // Create a FormGroup to collect all the fields for the associated object
      group = this._createSubFieldFormGroup(comp.config, newIndex);
    } else { // Else the field is simple (i.e. no associated instance)
      group = this._fb.group({
        [comp.config.property + newIndex]: this._fb.control('')
      });
    }
    array.push(group);
    this.form.markAsDirty(); // Enable the submit button
  }

  /**
   * Removes the value block at the specified index from the field represented by the provided FormComponent. It first 
   * removes the specified value, then clears the array and remakes the values left behind. If the number of values post
   * removal will be 0, emits the valueChanges event as the value is removed. If there will still be values post
   * removal, emits the valuesChanges event only as the values are re-added back to the FormArray. Assumes the provided
   * FormComponent is multivalued.
   * 
   * @param {number} index The index of the value to remove
   * @param {FormComponent} comp A multivalued form component to remove the value from
   */
  deleteFormBlock(index: number, comp: FormComponent): void {
    const array: FormArray = this.form.get([comp.config.property]) as FormArray;
    array.removeAt(index, { emitEvent: array.length === 1 });
    // Reset form indexes
    const values: { [key: string]: string|Option|{ [key: string]: string|Option } }[] = array.value;
    array.clear({ emitEvent: false });
    values.forEach((val, idx) => {
      let group: FormGroup;
      const subGroupVal: string|Option|{ [key: string]: string|Option } = val[`${comp.config.property}${idx < index ? idx : idx + 1}`];
      if (comp.hasSubFields && typeof subGroupVal === 'object') { // If the field generates an associated object
        // Create a FormGroup to collect all the fields for the associated object populated with existing values
        // Control name is the parent property + index after removal of the specified value + sub field property
        group = this._createSubFieldFormGroup(comp.config, idx, 
          (config: SHACLFormFieldConfig) => 
            subGroupVal[`${comp.config.property}${idx < index ? idx : idx + 1}${config.property}`]);
      } else { // Else the field is simple (i.e. no associated object)
        group = this._fb.group({
          [comp.config.property + idx]: this._fb.control(subGroupVal)
        });
      }
      array.push(group);
    });
    this.form.markAsDirty(); // Enable the submit button
  }

  /**
   * Loops through the provided SHACLFormFieldConfigs to generate the Angular Form and representations of the individual
   * components of the form.
   * 
   * @returns {FormComponent[]} An array of the SHACLFormFieldConfigs with some extra metadata
   */
  private _generateFormComponents(): FormComponent[] {
    return this.formFieldConfigs.map(config => {
      if (!config.isValid) { // If the configuration is invalid for any reason, don't setup anything in the form
        return {
          hasSubFields: false,
          config,
          isMultivalued: false
        };
      }
      const maxCount = config.maxCount;
      const comp: FormComponent = {
        hasSubFields: false,
        config,
        isMultivalued: (config.fieldType !== FieldType.CHECKBOX && config.fieldType !== FieldType.HIDDEN_TEXT && config.fieldType !== FieldType.NO_INPUT)
            && (maxCount === undefined || maxCount > 1)
      };
      // If the field is multivalued and is not a checkbox, setup a FormArray and capture the max allowed (if set)
      if (comp.isMultivalued) {
        comp.hasSubFields = config.subFields && !!config.subFields.length;
        comp.maxValues = maxCount;
        const minCount = config.minCount;
        // Determines whether the FormArray should be required based on minCount
        if (minCount && minCount >= 1) {
          this.form.addControl(config.property, this._fb.array([], [Validators.required]), { emitEvent: false });
        } else {
          this.form.addControl(config.property, this._fb.array([]), { emitEvent: false });
        }
      } else { // If the field is a checkbox or does not have a maxCount greater than 1
        // If checkbox, setup a FormArray
        if (config.fieldType === FieldType.CHECKBOX) {
          this.form.addControl(config.property, this._fb.array([]), { emitEvent: false });
        } else { // If not a checkbox
          // If not a checkbox, setup a FormControl
          if (config.subFields && config.subFields.length) { // If config generates an associated object
            comp.hasSubFields = true;
            // Create a FormGroup to collect all the fields for the associated object
            const subGroup = this._createSubFieldFormGroup(config);
            this.form.addControl(config.property, subGroup, { emitEvent: false });
          } else { // If config is simple (i.e. no associated object)
            this.form.addControl(config.property, this._fb.control(''), { emitEvent: false });
          }
        }
      }
      return comp;
    });
  }

  /**
   * "Normalizes" the provided form values by removing prefixes in form field names, simplifying arrays of single
   * values, and providing the value of Options without the label.
   * 
   * @param rawValues The raw values from the Angular Form
   * @returns {FormValues} A simplified version of the values for easier consumption
   */
  private _normalizeFormValues(rawValues: RawFormValues): FormValues {
    return Object.entries(rawValues).reduce((accumulator, [key, value]) => {
      if (Array.isArray(value)) {
        accumulator[key] = value.map((option, idx) => {
          if (typeof option !== 'object') {
            return option;
          }
          if ('value' in option) {
            return option.value;
          }
          if (typeof option[key + idx] !== 'object') {
            return option[key + idx];
          }
          return this._normalizeObjectValue(option[key + idx], key + idx);
        });
      } else if (typeof value === 'object') {
        if ('value' in value) {
          accumulator[key] = value.value;
        } else {
          accumulator[key] = this._normalizeObjectValue(value, key);
        }
      } else {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});
  }

  /**
   * Returns a "normalized" version of an associated object's value coming from the form. Each property on the object
   * corresponds to a property to be set on an associated object. The provided key is the parent key to be stripped out
   * of the raw form value key.
   * 
   * @param {{ [key: string]: string|Option }} obj A form value for an associated object
   * @param {string} key The parent form value key to remove from the object keys
   * @returns {{ [key: string]: string }} "Normalized" version of the associated object values
   */
  private _normalizeObjectValue(obj: { [key: string]: string|Option }, key: string): { [key: string]: string } {
    return Object.entries(obj).reduce((subAccumulator, [subKey, subValue]) => {
      subAccumulator[subKey.replace(key, '')] = typeof subValue === 'string' ? subValue : subValue.value;
      return subAccumulator;
    }, {});
  }

  /**
   * Populates the form fields based on the provided initial values in the `genObj`.
   */
  private _populateForm(): void {
    // If initial data has been provided
    if (this.genObj) {
      // Assumes there is only one instance of the node in the array and that the NodeShape uses implicit class targeting
      const nodeInstance = this.genObj.find(obj => !!obj && obj['@type'].includes(this.nodeShape['@id']));
      if (nodeInstance) {
        // Initializes the focus node with the provided data
        this.focusNode = [nodeInstance];
        // Only care about property fields, not the IRI or types
        Object.keys(nodeInstance).filter(key => key !== '@id' && key !== '@type').forEach(property => {
          const values: JSONLDId[]|JSONLDValue[] = nodeInstance[property];
          // Find the FormComponent representing the property
          const comp = this.formComponents.find(comp => comp.config.property === property);
          if (comp && comp.config.isValid) { // If a Form Component exists and is valid
            // If the field is multivalued and is not a checkbox, add FormGroups with FormControls for each value to FormArray
            if (comp.isMultivalued) {
              this._populateMultiValued(comp, values);
            } else { // If the field is a checkbox or does not have a maxCount greater than 1
              // If checkbox, add FormControls for each value to FormArray
              if (comp.config.fieldType === FieldType.CHECKBOX) {
                this._populateCheckbox(comp, values);
              } else { // If not checkbox set value of FormControl(s)
                // Assumption made there is only one value in the JSON-LD
                const val = values[0];
                this._populateSingleValue(comp, val);
              }
            }
          }
        });
      }
    }
  }
  
  /**
   * ASSUMES FormComponent is multivalued. Populates the form controls represented by the provided FormComponent with
   * the provided JSON-LD values.
   * 
   * @param {FormComponent} comp The FormComponent to populate within the form
   * @param {JSONLDId[]|JSONLDValue[]} values The JSON-LD values of the property represented in the FormComponent to 
   * populate the form with
   */
  private _populateMultiValued(comp: FormComponent, values: JSONLDId[]|JSONLDValue[]): void {
    const array: FormArray = this.form.get([comp.config.property]) as FormArray;
    from(values).pipe(
      // Uses concatMap so the array indices execute in turn and return the FormGroups in order
      concatMap((val, idx) => {
        if (comp.hasSubFields && val['@id']) { // If the field generates an associated object
          // Find the associated object for this value
          const subObject = this.genObj.find(obj => obj['@id'] === val['@id']);
          if (subObject) { // If the associated object exists
            // Get the values of each individual sub field up front
            const subValues$ = comp.config.subFields.map(subField => 
              this._getSingleFieldValue(subField, getPropertyValue(subObject, subField.property) || getPropertyId(subObject, subField.property)));
            return forkJoin(subValues$).pipe(map(result => {
              // Create a FormGroup to collect all the fields for the associated object
              return this._createSubFieldFormGroup(comp.config, idx, 
                (config: SHACLFormFieldConfig) => {
                  const subFieldIndex = comp.config.subFields.findIndex(subField => subField === config);
                  return result[subFieldIndex];
                });
            }));
          }
        } else { // Else the field is a simple field (i.e. no associated object)
          return this._getSingleFieldValue(comp.config, val['@value'] || val['@id']).pipe(map(valToSet => {
            return this._fb.group({
              [comp.config.property + idx]: this._fb.control(valToSet)
            });
          }));
        }
      }),
      toArray()
    ).subscribe(groups => {
      // Add each group to the FormArray in turn
      groups.forEach(group => {
        array.push(group, { emitEvent: false });
      });
      this._ref.markForCheck();
    });
  }

  /**
   * ASSUMES FormComponent is for a checkbox. Populates the form controls represented by the provided FormComponent with
   * the provided JSON-LD values.
   * 
   * @param {FormComponent} comp The FormComponent to populate within the form
   * @param {JSONLDId[]|JSONLDValue[]} values The JSON-LD values of the property represented in the FormComponent to 
   * populate the form with
   */
  private _populateCheckbox(comp: FormComponent, values: JSONLDId[]|JSONLDValue[]): void {
    const array: FormArray = this.form.get([comp.config.property]) as FormArray;
    values.forEach(val => {
      // Need to set the field value to a valid Option
      const existingOption = comp.config.values.find(option => option.value === val['@value'] || val['@id']);
      array.push(new FormControl(existingOption || ''), { emitEvent: false });
    });
  }

  /**
   * ASSUMES FormComponent is for a singular value field. Populates the form controls represented by the provided
   * FormComponent with the provided JSON-LD value.
   * 
   * @param {FormComponent} comp The FormComponent to populate within the form
   * @param {JSONLDId|JSONLDValue} value The JSON-LD value of the property represented in the FormComponent to populate 
   * the form with
   */
  private _populateSingleValue(comp: FormComponent, value: JSONLDId|JSONLDValue): void {
    if (comp.hasSubFields && value['@id']) { // If the field generates an associated object
      // Find the associated object for this value
      const subObject = this.genObj.find(obj => obj['@id'] === value['@id']);
      if (subObject) { // If the associated object exists
        // For each field on the associated object, update the control with the field value
        comp.config.subFields.forEach(subConfig => {
          const valToSet = getPropertyValue(subObject, subConfig.property) || getPropertyId(subObject, subConfig.property);
          this._getSingleFieldValue(comp.config, valToSet).subscribe(result => {
            this.form.get([comp.config.property, comp.config.property + subConfig.property]).setValue(result);
          });
        });
      }
    } else { // Else the field is a simple field (i.e. no associated object)
      this._getSingleFieldValue(comp.config, value['@value'] || value['@id']).subscribe(valToSet => {
        this.form.get([comp.config.property]).setValue(valToSet, { emitEvent: false });
      });
    }
  }

  /**
   * Retrieves the form value to set on an individual Form Control based on the provided SHACLFormFieldConfig and the
   * value that should be set. Assume the value is coming from a JSON-LD property value. If the config is for an
   * autocomplete fetches the options from the backend to choose the appropriate Option. If the config is for a radio
   * button, chooses the appropriate Option from the supported values. For every other field type, just returns back
   * the provided value.
   * 
   * @param {SHACLFormFieldConfig} config The configuration of the field this value is for
   * @param {string} valToSet A string containing the form field value to set
   * @returns {Observable} An Observable with the appropriate form field value to set
   */
  private _getSingleFieldValue(config: SHACLFormFieldConfig, valToSet: string): Observable<string|Option> {
    // If the field is an Autocomplete, we need to set the form value to a valid Option
    if (config.fieldType === FieldType.AUTOCOMPLETE) {
      const nodeInstance = this.genObj.find(obj => !!obj && obj['@type'].includes(this.nodeShape['@id']));
      // TODO: Once WebFormRest supports more than just the node being passed, change second argument to this.genObj
      return this._sh.getAutocompleteOptions(config.collectAllReferencedNodes(), [nodeInstance])
        .pipe(map(options => options.find(option => option.value === valToSet) || ''));
    } else if ([FieldType.RADIO, FieldType.DROPDOWN].includes(config.fieldType)) {
      // If the field is a Radio or Dropdown, we need to set the form value to a valid Option
      return of(config.values.find(option => option.value === valToSet) || '');
    } else {
      // All other FieldTypes can just be the value from the RDF straight
      return of(valToSet);
    }
  }

  /**
   * ASSUMES the field generates an associated object. Creates a FormGroup representing the collecting of fields that
   * should be set on an associated object to the property represented in the provided SHACLFormFieldConfig. If an
   * index is provided, assumes this FormGroup will be within a FormArray and thus should be nested. Optionally takes a
   * function used to generate the value to set on the control for an individual field; otherwise sets the field to an 
   * empty string.
   * 
   * @param {SHACLFormFieldConfig} config The configuration for the field to create a FormGroup for
   * @param {number} [index=undefined] The optional index of the generated FormGroup within a FormArray
   * @param {Function} populateValue An optional function to generate the value for the passed in sub field config
   * @returns {FormGroup} A FormGroup containing controls for all the fields for the associated object generated by the
   * property represented in the provided SHACLFormFieldConfig
   */
  private _createSubFieldFormGroup(config: SHACLFormFieldConfig, index?: number, 
    populateValue?: (config: SHACLFormFieldConfig) => string|Option): FormGroup {
    // Create a FormGroup to collect all the fields for the associated object
    const subGroup = this._fb.group({});
    config.subFields.forEach(subField => {
      // If a value populate function provided, generate the value for the sub field
      const val = populateValue ? populateValue(subField) : '';
      // If this is in a FormArray (i.e. an index was provided), include the index in the form field name
      // Does not emit event and relies on calling function to update the form if needed
      subGroup.addControl(config.property + (index !== undefined ? index : '') + subField.property, this._fb.control(val), { emitEvent: false });
    });

    // If this is in a FormArray (i.e. an index was provided), wrap the group in an outer group
    return index !== undefined ? this._fb.group({ [config.property + index]: subGroup }) : subGroup;
  }

}
