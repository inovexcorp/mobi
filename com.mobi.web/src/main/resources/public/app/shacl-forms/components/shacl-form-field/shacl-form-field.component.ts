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
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, merge } from 'rxjs';
import { debounceTime, map, mapTo, startWith } from 'rxjs/operators';

import { FieldType, SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { SHACL, XSD } from '../../../prefixes';
import { SHACLFormManagerService } from '../../services/shaclFormManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Option } from '../../models/option.class';
import { getPropertyId } from '../../../shared/utility';

/**
 * @class shacl-forms.SHACLFormFieldComponent
 * 
 * A component which will create an individual Angular form-field for the provided parent FormGroup depending on the
 * configuration provided in a {@link SHACLFormFieldConfig}. Supports `TextInput`, `TextareaInput`, `ToggleInput`, 
 * `RadioInput`, `CheckboxInput`, `AutocompleteInput`, and `DropdownInput` field types. Will apply the appropriate 
 * validators depending on the underlying PropertyShape definition for the configuration. Will also set a default value 
 * if provided as long as the form field does not already have a value set. Checkboxes are expected to be represented
 * in the FormGroup under the provided control name as a FormArray of individual FormControls with their values being
 * the individual checkbox values. All other input types are expected to be a single FormControl under the provided
 * control name. Will emit form value updates when setting default values.
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
  public readonly FieldType :  typeof FieldType = FieldType;

  @ViewChild(MatAutocompleteTrigger, { static: true }) autocompleteTrigger: MatAutocompleteTrigger;

  @Input() formFieldConfig: SHACLFormFieldConfig;
  @Input() parentFormGroup: FormGroup;
  @Input() controlName: string;
  @Input() focusNode: JSONLDObject[];

  @Output() calculateFocusNode = new EventEmitter<void>();

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
      this.label = this.formFieldConfig.label;
      if (this.formFieldConfig.fieldType === FieldType.CHECKBOX) {
        this._setupCheckbox();
      } else if ([FieldType.DROPDOWN, FieldType.AUTOCOMPLETE].includes(this.formFieldConfig.fieldType)) {
        this._setupDropdownOrAutocomplete();
      } else {
        this._setupRadioToggleOrTextual();
      }
    }
  }

  onOptionSelected(): void {
    this.sh.fieldUpdated.emit(this.formFieldConfig.property);
  }

  /**
   * Retrieves all valid options for an autocomplete associated with the provided SHACLFormFieldConfig. If there is a
   * focus node, looks for any other fields on the node that use the `sh:sparql` constraint and adds to the internal
   * tracker of fields that should be cleared when this field value is set.
   * 
   * @param {SHACLFormFieldConfig} formFieldConfig The configuration for the autocomplete field
   */
  getAutocompleteOptions(formFieldConfig: SHACLFormFieldConfig): void {
    this.calculateFocusNode.emit();
    this.sh.getAutocompleteOptions(formFieldConfig.collectAllReferencedNodes(), this.focusNode).subscribe((entities: Option[]) => {
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

  /**
   * Retrieves all properties on the provided JSON-LD object besides the IRI and types.
   * 
   * @param {JSONLDObject} jsonld A JSON-LD object
   * @returns {string[]} The array of property names from the JSON-LD object
   */
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

  /**
   * Sets the form field control value to a boolean value based on the control's current value or the optional provided
   * default value.
   * 
   * @param {string|undefined} defaultValue An optional default value for the boolean control
   */
  setFormValueToBoolean(defaultValue: string|undefined): void {
    this.fieldFormControl.setValue((this.fieldFormControl.value || defaultValue) === 'true', { emitEvent: false });
  }

  /**
   * Handles updates to a checkbox value in the underlying FormArray for this field.
   * 
   * @param {MatCheckboxChange} event The event containing details about what checkbox was changed
   */
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

  /**
   * Updates whether the checkbox control should be disabled based on the field's max count constraint.
   */
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

  /**
   * Sets up the field for a Checkbox with the appropriate max count handlers, representations in the `checkboxes`
   * array, default value set if applicable, and validators.
   */
  private _setupCheckbox(): void {
    // If the field is a checkbox, create the checkbox map and handle initialization of checked states
    const defaultValue = this.formFieldConfig.defaultValue;
    const validators = this.formFieldConfig.validators;
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
  }

  /**
   * Sets up the field for a Dropdown or Autocomplete with the appropriate validators, and options. If for a Dropdown
   * and there's only one option, preselects the first option. If Autocomplete, sets up an Observable to handle updates
   * to the options based on entered text or new options being fetched.
   */
  private _setupDropdownOrAutocomplete(): void {
    const validators = this.formFieldConfig.validators;
    this.options = this.formFieldConfig.values;
    this.fieldFormArray.setValidators(validators);
    this.fieldFormArray.updateValueAndValidity({ emitEvent: false });
    if (this.options.length === 1 && this.formFieldConfig.fieldType === FieldType.DROPDOWN) {
      this.fieldFormControl.setValue(this.options[0]);
    } else if (this.formFieldConfig.fieldType === FieldType.AUTOCOMPLETE) {
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
  }

  /**
   * Sets up the field as a Radio, Toggle, Text, or Textarea with the appropriate default value set if applicable and
   * validators set.
   */
  private _setupRadioToggleOrTextual(): void {
    const defaultValue = this.formFieldConfig.defaultValue;
    const validators = this.formFieldConfig.validators;
    if (this.formFieldConfig.datatype === `${XSD}boolean`) {
      this.setFormValueToBoolean(defaultValue);
    } else if (defaultValue && !this.fieldFormControl.value) {
      if (![FieldType.TEXT, FieldType.TEXTAREA, FieldType.TOGGLE].includes(this.formFieldConfig.fieldType)) {
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
      } else {
        this.fieldFormControl.setValue(defaultValue);
      }
    }
    this.fieldFormControl.setValidators(validators);
    this.fieldFormControl.updateValueAndValidity();
  }
}
