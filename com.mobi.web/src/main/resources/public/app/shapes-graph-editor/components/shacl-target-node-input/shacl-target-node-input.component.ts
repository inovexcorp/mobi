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
import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { getBeautifulIRI } from '../../../shared/utility';
import { propertyRegex } from '../../../shared/validators/property-regex.validator';
import { REGEX } from '../../../constants';
import { ValueOption } from '../../models/value-option.interface';

/**
 * @class ShaclTargetNodeInputComponent
 *
 * A custom form control for inputting a SHACL Node Target IRI.
 *
 * It integrates with Angular's Reactive Forms by implementing ControlValueAccessor.
 * It uses an internal FormControl to manage its own state.
 *
 * @param {string} label The label for the form field.
 */
@Component({
  selector: 'app-shacl-target-node-input',
  templateUrl: './shacl-target-node-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShaclTargetNodeInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ShaclTargetNodeInputComponent),
      multi: true
    }
  ]
})
export class ShaclTargetNodeInputComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  @Input() label: string;

  private destroy$ = new Subject<void>();

  nodeInputControl = new FormControl('', [Validators.required, propertyRegex(REGEX.IRI, 'value')]);

  constructor() {}

  ngOnInit(): void {
    // Subscribe to value changes and propagate them as objects
    this.nodeInputControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.onChange({
          value: value || '', 
          label: value ? getBeautifulIRI(value) : ''
        });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Callback to propagate value changes up to the parent form. */
  onChange: (value: ValueOption) => void = () => {};

  /** Callback to propagate the touched state up to the parent form. */
  onTouched: () => void = () => {};

  /**
   * Writes value from parent form into nodeInputControl.
   * Triggered when the parent form is initialized or when parentForm.patchValue() is called.
   *
   * @param {string|ValueOption} value The new value from the parent form control.
   */
  writeValue(value: string | ValueOption): void {
    let stringValue = '';
    
    if (typeof value === 'string') {
      stringValue = value;
    } else if (value && typeof value === 'object' && 'value' in value) {
      stringValue = value.value;
    }
    
    this.nodeInputControl.setValue(stringValue, { emitEvent: false });
  }

  /**
   * Registers a callback function to be called when the control's value changes in the UI.
   * @param fn The callback function to register.
   */
  registerOnChange(fn: (value: ValueOption) => void): void {
    this.onChange = fn;
  }

  /**
   * Registers a callback function that should be called when the control receives a touch event.
   * @param fn - The callback function to register.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Syncs the disabled state from the parent form to this component's internal control.
   * @param isDisabled The new disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.nodeInputControl.disable({ emitEvent: false });
    } else {
      this.nodeInputControl.enable({ emitEvent: false });
    }
  }

  /**
   * This method called by the parent form.
   * @param _control The parent FormControl that this component is bound to.
   * @returns A ValidationErrors object if invalid, or null if valid.
   */
  validate(_control: AbstractControl): ValidationErrors | null {
    return this.nodeInputControl.errors;
  }
}
