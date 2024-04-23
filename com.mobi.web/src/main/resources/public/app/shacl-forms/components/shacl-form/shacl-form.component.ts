/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { v4 } from 'uuid';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { JSONLDId } from '../../../shared/models/JSONLDId.interface';
import { JSONLDValue } from '../../../shared/models/JSONLDValue.interface';
import { Option } from '../../models/option.class';

export interface FormValues {
  [key: string]: string | string[] | { [key:string]: string }[]
}

interface FormComponent {
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
 * @param {Function} updateEvent A Function that expects a parameter of the values of the form and is called every time
 * any one of the fields is updated.
 * @param {Function} statusEvent A Function that expects a parameter of the status string of the form and is called
 * every time the status of the overall form is updated.
 * @param {JSONLDObject} nodeShape The JSON-LD of the parent NodeShape for the provided form field configurations array
 * @param {SHACLFormFieldConfig[]} formFieldConfigs An array of all the form field configurations to be displayed for
 * this form
 * @param {JSONLDObject} genObj The JSON-LD of the object to use to pre-populate the form. Expects the object to have
 * properties corresponding to the PropertyShapes represented in the form field configurations
 */
@Component({
  selector: 'app-shacl-form',
  templateUrl: './shacl-form.component.html',
  styleUrls: ['./shacl-form.component.scss']
})
export class SHACLFormComponent implements OnInit {

  @Input() nodeShape: JSONLDObject;
  @Input() formFieldConfigs: SHACLFormFieldConfig[] = [];
  @Input() genObj: JSONLDObject;

  @Output() updateEvent = new EventEmitter<FormValues>();
  @Output() statusEvent = new EventEmitter<string>();

  formComponents: FormComponent[] = [];

  form: FormGroup = this._fb.group({});

  focusNode: JSONLDObject[];

  constructor(private _fb: FormBuilder) { }

  ngOnInit(): void {
    this.formComponents = this.formFieldConfigs.map(config => {
      if (!config.isValid) { // If the configuration is invalid for any reason, don't setup anything in the form
        return {
          config,
          isMultivalued: false
        };
      }
      const maxCount = config.maxCount;
      const comp: FormComponent = {
        config,
        isMultivalued: config.fieldType !== 'checkbox' && (maxCount === undefined || maxCount > 1)
      };
      // If the field supports multiple values and is not a checkbox, setup a FormArray and capture the max allowed (if set)
      if (comp.isMultivalued) {
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
        if (config.fieldType === 'checkbox') {
          this.form.addControl(config.property, this._fb.array([]), { emitEvent: false });
        } else {
          // If not a checkbox, setup a FormControl
          this.form.addControl(config.property, this._fb.control(''), { emitEvent: false });
        }
      }
      return comp;
    });
    // Pre-populate form based on provided data
    if (this.genObj) {
      Object.keys(this.genObj).forEach(key => {
        // Only care about property fields, not the IRI or types
        if (key !== '@id' && key !== '@type') {
          const values: JSONLDId[]|JSONLDValue[] = this.genObj[key];
          const comp = this.formComponents.find(comp => comp.config.property === key);
          if (comp && comp.config.isValid) {
            // If the field supports multiple values and is not a checkbox, add FormGroups with FormControls for each value to FormArray
            if (comp.isMultivalued) {
              const array: FormArray = this.form.get([comp.config.property]) as FormArray;
              values.forEach((val, idx) => {
                const group: FormGroup = this._fb.group({
                  [comp.config.property + idx]: this._fb.control(val['@value'] || val['@id'])
                });
                array.push(group, { emitEvent: false });
              });
            } else { // If the field is a checkbox or does not have a maxCount greater than 1
              // If checkbox, add FormControls for each value to FormArray
              if (comp.config.fieldType === 'checkbox') {
                const array: FormArray = this.form.get([comp.config.property]) as FormArray;
                values.forEach(val => {
                  array.push(new FormControl(val['@value'] || val['@id']), { emitEvent: false });
                });
              } else {
                // If not checkbox, set value of FormControl
                // Assumption made there is only one value in the JSON-LD
                this.form.get([comp.config.property]).setValue(values[0]['@value'] || values[0]['@id'], { emitEvent: false });
              }
            }
          }
        }
      });
    }
    this.form.valueChanges.subscribe((newValues: { [key:string]: Option|Option[]|string }[]) => {
      const newValuesNormalized = Object.entries(newValues).reduce((accumulator, [key, value]) => {
        if (value.value) {
            accumulator[key] = value.value;
        } else if (Array.isArray(value)) {
            accumulator[key] = value.map(option => option.value);
        } else {
            accumulator[key] = value;
        }
        return accumulator;
      }, {});
      this.updateEvent.emit(newValuesNormalized);
    });
    this.form.statusChanges.subscribe(newStatus => {
      this.statusEvent.emit(newStatus);
    });
  }

  generateFocusNodeFromForm(): void {
    const jsonld = {};

    // Iterate through form fields (assuming you have direct access to controls)
    for (const field in this.form.controls) {
      const value = this.form.get([field]).value;
      if (value) {
        if (Array.isArray(value)) { // Multivalued field
            jsonld[field] = value.map(val => ({ '@id': val.value })); 
          } else { // Single value field
            jsonld[field] = [{ '@id': value.value }];
          }
      }
    }
    if (Object.keys(jsonld).length) {
        jsonld['@id'] = `https://mobi.solutions/ontologies/form#${v4()}`;
        jsonld['@type'] = [this.nodeShape['@id']];
        this.focusNode = [jsonld] as JSONLDObject[];
    }
  }

  addFormBlock(comp: FormComponent): void {
    const array: FormArray = this.form.get([comp.config.property]) as FormArray;
    const newIndex = array.controls.length;
    const group: FormGroup = this._fb.group({
      [comp.config.property + newIndex]: this._fb.control('')
    });
    array.push(group);
    this.form.markAsDirty(); // Enable the submit button
  }

  deleteFormBlock(index: number, comp: FormComponent): void {
    const array: FormArray = this.form.get([comp.config.property]) as FormArray;
    array.removeAt(index);
    // Reset form indexes
    const values: { [key: string]: string }[] = array.value;
    array.clear();
    values.forEach((val, idx) => {
      const group: FormGroup = this._fb.group({
        [comp.config.property + idx]: this._fb.control(val[`${comp.config.property}${idx < index ? idx : idx + 1}`])
      });
      array.push(group);
    });
    this.form.markAsDirty(); // Enable the submit button
  }
}
