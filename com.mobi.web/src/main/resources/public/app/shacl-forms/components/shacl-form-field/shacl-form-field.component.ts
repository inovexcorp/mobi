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
import { Component, Input, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';

import { SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { SHACL, XSD } from '../../../prefixes';
import { Observable, Subject, merge } from 'rxjs';
import { debounceTime, map, mapTo, startWith } from 'rxjs/operators';
import { SHACLFormManagerService } from '../../services/shaclFormManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Option } from '../../models/option.class';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ChangeDetectorRef } from '@angular/core';
import { getPropertyId } from '../../../shared/utility';

// TODO: Look into complex setting support

/**
 * @class shacl-forms.SHACLFormFieldComponent
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
  @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;

  @Input() formFieldConfig: SHACLFormFieldConfig;
  @Input() parentFormGroup: FormGroup;
  @Input() controlName: string;
  @Input() focusNode: JSONLDObject[];

  @Output() calculateFocusNode = new EventEmitter<any>();

  disableCheckboxes = false;
  checkboxes: { value: Option, checked: boolean }[] = [];
  options: Option[];
  filteredOptions: Observable<Option[]>;
  label = '';
  focusSubject: Subject<number> = new Subject<number>();
  dependsOn: Set<string> = new Set<string>();

  constructor(public sh: SHACLFormManagerService, private ref: ChangeDetectorRef) {
    this.sh.fieldUpdated.subscribe((fieldName: string) => {
        if (this.dependsOn.has(fieldName)) {
            this.fieldFormControl.setValue(new Option('', ''));
            this.ngOnInit();
        }
      });
  }

  ngOnInit(): void {
    if (this.formFieldConfig.fieldType) {
      const defaultValue = this.formFieldConfig.defaultValue;
      const validators = this.formFieldConfig.validators;
      this.label = this.formFieldConfig.label;
      // If the field is a checkbox, create the checkbox map and handle initialization of checked states
      if (this.formFieldConfig.fieldType === 'checkbox') {
        this.checkboxes = this.formFieldConfig.values.map((value: Option) => ({ value: value, checked: false }));
        if (this.fieldFormArray.value && this.fieldFormArray.value.length) {
          this.checkboxes.forEach((checkbox: { value: Option, checked: boolean })  => checkbox.checked = this.fieldFormArray.value.map((option: Option) => option.value).includes(checkbox.value.value));
          this.handleCheckboxMaxCount();
        } else {
          if (defaultValue) {
            const checkbox = this.checkboxes.find(checkbox => checkbox.value.value === defaultValue);
            if (checkbox) {
              checkbox.checked = true;
            }
            this.fieldFormArray.push(new FormControl(new Option(defaultValue, checkbox.value.name)));
          }
        }
        this.fieldFormArray.setValidators(validators);
        this.fieldFormArray.updateValueAndValidity({ emitEvent: false });
      } else if (['dropdown', 'autocomplete'].includes(this.formFieldConfig.fieldType)) {
        this.options = this.formFieldConfig.values;
        this.fieldFormArray.setValidators(validators);
        this.fieldFormArray.updateValueAndValidity({ emitEvent: false });
        if (this.options.length === 1 && this.formFieldConfig.fieldType === 'dropdown') {
          this.fieldFormControl.setValue(this.options[0]);
        } else if (this.formFieldConfig.fieldType === 'autocomplete') {
            this.filteredOptions = merge(
                this.focusSubject.pipe(mapTo('')),
                this.fieldFormControl.valueChanges.pipe(debounceTime(200))
              ).pipe(
                startWith(''),
                map((value: string | Option) => {
                    value = typeof value === 'string' ? value : value.name;
                    const filteredOptions = this._filter(value || '');
                    this._checkValidity(value || '', filteredOptions.map(values => values.name));
                    return filteredOptions;
                  })
              );
        }
      } else {
        if (this.formFieldConfig.datatype === `${XSD}boolean`) {
          this.setFormValueToBoolean(defaultValue);
        } else if (defaultValue && !this.fieldFormControl.value) {
            if (this.formFieldConfig.values.length) {
                const value = this.formFieldConfig.values.filter(val => val.value === defaultValue);
                if (!value.length) {
                    console.log('Could not find a matching option for default value');
                } else {
                    this.fieldFormControl.setValue(value[0]);
                }
            } else {
                this.fieldFormControl.setValue(new Option(defaultValue, defaultValue));
            }
        }
        this.fieldFormControl.setValidators(validators);
        this.fieldFormControl.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  onOptionSelected(option: Option): void {
    this.sh.fieldUpdated.emit(this.formFieldConfig.property);
  }

  getAutocompleteOptions(formFieldConfig: SHACLFormFieldConfig): void {
      this.calculateFocusNode.emit();
      this.sh.getAutocompleteOptions(formFieldConfig.collectAllReferencedNodes(formFieldConfig.propertyShape, formFieldConfig.jsonld), this.focusNode).subscribe((entities: Option[]) => {
        this.options = entities;
        if (this.focusNode) {
            this.getFieldsFromJSONLD(this.focusNode[0]).forEach(field => {
                if ((field !== formFieldConfig.property) && getPropertyId(formFieldConfig.propertyShape, `${SHACL}sparql`)) {
                    this.dependsOn.add(field);
                }   
            });
        }
        this.focusSubject.next(Math.random());
        this.ref.markForCheck();
      });
  }

  getFieldsFromJSONLD(jsonld: JSONLDObject): string[] {
    const fields = [];
    Object.keys(jsonld).forEach(key => {
        if (key !== '@id' && key !== '@type') {
            fields.push(key);
        }
    });
    return fields;
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
    const checkbox = this.checkboxes.find(checkbox => checkbox.value.value === event.source.value);
    if (event.checked) {
      this.fieldFormArray.push(new FormControl(new Option(event.source.value, checkbox.value.name)));
      if (checkbox) {
        checkbox.checked = true;
      }
    } else {
      const i = this.fieldFormArray.controls.findIndex(x => x.value?.value === event.source.value);
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

  displayFn(option: {name: string, value: string}): string {
    return option && option.name ? option.name : '';
  }

  private _filter(value: string): Option[] {
    const filterValue = value.toLowerCase();
    return (this.options as Option[]).filter(option => option.name.toLowerCase().includes(filterValue));
  }

  private _checkValidity(value: string, filteredOptions: string[]): void {
    const isValid = filteredOptions.includes(value);
    if (!isValid) {
      this.fieldFormControl.setErrors({ 'invalidOption': true });
    } else {
      this.fieldFormControl.setErrors(null);
    }
  }
}
