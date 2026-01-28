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
import { Component, forwardRef, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator, Validators } from '@angular/forms';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { LogLevelOption } from '../log-level-manager/log-level-manager.component';

/**
 * @class LogLevelSelectComponent
 * 
 * A reusable component that provides a select dropdown for choosing log levels. Implements ControlValueAccessor
 * to integrate with Angular forms.
 * 
 * @param {LogLevelOption[]} availableLevels An array of available log level options to choose from.
 */
@Component({
  selector: 'app-log-level-select',
  templateUrl: './log-level-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LogLevelSelectComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => LogLevelSelectComponent),
      multi: true
    }
  ],
  styleUrls: ['./log-level-select.component.scss']
})
export class LogLevelSelectComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {

  @Input() availableLevels: LogLevelOption[] = [];
  @Input() required = false; // Make validation optional

  @HostBinding('class.w-100') @Input() fullWidth = false;

  control = new FormControl<LogLevelOption>(undefined, Validators.required);

  private destroy$ = new Subject<void>();

  constructor() {}

  /**
   * On component initialization, subscribes to value changes of the internal control to propagate changes to the 
   * parent form.
   */
  ngOnInit(): void {
    this.control.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.onChange(value);
        this.onTouched(); // Marks the control as touched (use for validation display logic)
      });
  }

  /**
   * On component destruction, completes the destroy$ subject to clean up subscriptions.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Callback to propagate value changes up to the parent form. */
  onChange: (value: LogLevelOption) => void = () => {};

  /** Callback to propagate the touched state up to the parent form. */
  onTouched: () => void = () => {};

  /**
   * Writes a value from the parent form into this component's internal control.
   * Triggered when the parent form is initialized or when parentForm.patchValue() is called.
   * It synchronizes the child component's view with the parent's model.
   * 
   * @param {LogLevelOption} value The new value from the parent form control
   */
  writeValue(value: LogLevelOption): void {
    this.control.setValue(value, { emitEvent: false });
  }

  /**
   * Registers a callback function to be called when the control's value changes in the UI.
   * @param fn The callback function to register.
   */
  registerOnChange(fn: (value: LogLevelOption) => void): void {
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
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  /**
   * Ensures the validation will only run if the 'required' input is set to true. Avoids scenarios where this is
   * not being used with reactive forms.
   * 
   * @returns {ValidationErrors | null} Validation errors if any, otherwise null
   */
  validate(): ValidationErrors | null {
    if (this.required && !this.control.value) {
      return { required: true };
    }
    return null;
  }
}
