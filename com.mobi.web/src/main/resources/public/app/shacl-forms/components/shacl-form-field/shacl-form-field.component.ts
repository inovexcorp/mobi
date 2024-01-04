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
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { XSD } from '../../../prefixes';

// TODO: Look into complex setting support

/**
 * @class shared.SHACLFormFieldComponent
 * 
 * A component which will create an individual Angular form-field for the provided parent FormGroup depending on the
 * configuration provided in a {@link SHACLFormFieldConfig}. Supports `TextInput`, `ToggleInput`, `RadioInput`, and
 * `CheckboxInput` field types. Will apply the appropriate validators depending on the underlying PropertyShape
 * definition for the configuration. Will also set a default value if provided as long as the form field does not
 * already have a value set. Checkboxes are expected to be represented in the FormGroup under the provided control name
 * as a FormArray of individual FormControls with their values being the individual checkbox values. All other input
 * types are expected to be a single FormControl under the provided control name. Will emit form value updates when
 * setting default values.
 * 
 * @param {SHACLFormFieldConfig} formFieldConfig The SHACL backed configuration for a form field to render
 * @param {FormGroup} parentFormGroup The FormGroup that contains the field represented by the configuration. The field
 * should be under the property IRI that the underlying PropertyShape controls
 * @param {string} controlName The name of the control in the parent FormGroup for the provided configuration
 */
@Component({
  selector: 'app-shacl-form-field',
  templateUrl: './shacl-form-field.component.html',
  styleUrls: ['./shacl-form-field.component.scss']
})
export class SHACLFormFieldComponent implements OnInit {
  @Input() formFieldConfig: SHACLFormFieldConfig;
  @Input() parentFormGroup: FormGroup;
  @Input() controlName: string;

  disableCheckboxes = false;
  checkboxes: { value: string, checked: boolean }[] = [];

  constructor() { }

  ngOnInit(): void {
    if (this.formFieldConfig.fieldType) {
      const defaultValue = this.formFieldConfig.defaultValue;
      const validators = this.formFieldConfig.validators;
      // If the field is a checkbox, create the checkbox map and handle initialization of checked states
      if (this.formFieldConfig.fieldType === 'checkbox') {
        this.checkboxes = this.formFieldConfig.values.map(value => ({ value, checked: false }));
        if (this.fieldFormArray.value && this.fieldFormArray.value.length) {
          this.checkboxes.forEach(checkbox => checkbox.checked = this.fieldFormArray.value.includes(checkbox.value));
          this.handleCheckboxMaxCount();
        } else {
          if (defaultValue) {
            const checkbox = this.checkboxes.find(checkbox => checkbox.value === defaultValue);
            if (checkbox) {
              checkbox.checked = true;
            }
            this.fieldFormArray.push(new FormControl(defaultValue));
          }
        }
        this.fieldFormArray.setValidators(validators);
        this.fieldFormArray.updateValueAndValidity({ emitEvent: false });
      } else {
        if (this.formFieldConfig.datatype === `${XSD}boolean`) {
          this.setFormValueToBoolean(defaultValue);
        } else if (defaultValue && !this.fieldFormControl.value) {
          this.fieldFormControl.setValue(defaultValue);
        }
        this.fieldFormControl.setValidators(validators);
        this.fieldFormControl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  get fieldFormControl(): FormControl {
    return this.parentFormGroup.get([this.controlName]) as FormControl;
  }

  get fieldFormArray(): FormArray {
    return this.parentFormGroup.get([this.controlName]) as FormArray;
  }

  setFormValueToBoolean(defaultValue: string|undefined): void {
    this.fieldFormControl.setValue((this.fieldFormControl.value || defaultValue) === 'true', { emitEvent: false });
  }

  checkboxChange(event: MatCheckboxChange): void {   
    const checkbox = this.checkboxes.find(checkbox => checkbox.value === event.source.value);
    if (event.checked) {
      this.fieldFormArray.push(new FormControl(event.source.value));
      if (checkbox) {
        checkbox.checked = true;
      }
    } else {
      const i = this.fieldFormArray.controls.findIndex(x => x.value === event.source.value);
      this.fieldFormArray.removeAt(i);
      if (checkbox) {
        checkbox.checked = false;
      }
    }
    this.handleCheckboxMaxCount();
  }

  handleCheckboxMaxCount(): void {
    const maxNum = this.formFieldConfig.maxCount;
    this.disableCheckboxes = maxNum !== undefined && this.fieldFormControl.value.length >= maxNum;
  }
}
