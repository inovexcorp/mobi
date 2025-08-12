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
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, forwardRef } from '@angular/core';
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

import { Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  switchMap,
  takeUntil,
  startWith,
  filter,
  catchError,
  finalize,
  map
} from 'rxjs/operators';

import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { REGEX } from '../../../constants';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';

/**
 * @class ShaclTargetClassInputComponent
 * @requires ShapesGraphStateService
 * @requires ToastService
 *
 * A custom Angular form control component for inputting a SHACL Target Class IRI.
 * Has an autocomplete function that queries a SPARQL endpoint for available owl:Class
 * instances within a specific versioned RDF record, providing users with relevant suggestions
 * as they type.
 *
 * It integrates with Angular's Reactive Forms by implementing ControlValueAccessor
 * and Validator. It uses an internal FormControl to manage its own state
 * and validation, reporting the results to the parent form.
 *
 * @param {string} label The label for the form field.
 */
@Component({
  selector: 'app-shacl-target-class-input',
  templateUrl: './shacl-target-class-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShaclTargetClassInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ShaclTargetClassInputComponent),
      multi: true
    }
  ]
})
export class ShaclTargetClassInputComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  @Input() label: string;

  @ViewChild('targetClassSpinner', { static: true }) targetClassSpinner: ElementRef;

  classInputControl = new FormControl('', [Validators.required, Validators.pattern(REGEX.IRI)]);
  suggestions$: Observable<GroupedSuggestion[]> = of([]);

  private _destroySub$ = new Subject<void>();

  constructor(
    public stateService: ShapesGraphStateService,
    private _toastService: ToastService,
    private _spinner: ProgressSpinnerService
  ) {}

  ngOnInit(): void {
    this.suggestions$ = this.classInputControl.valueChanges
      .pipe(
        takeUntil(this._destroySub$),
        startWith(''),
        // When a user selects an option from dropdown, a ValueOption object is emitted
        map(value => typeof value === 'string' ? value : ''),
        debounceTime(300),
        switchMap(searchText => this._getSuggestions(searchText))
      );
    this.classInputControl.valueChanges.pipe(takeUntil(this._destroySub$)).subscribe((value: string) => {
      this.onChange(value);
    });
  }

  /**
   * Cleans up all subscriptions to avoid memory leaks.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  /** Callback to propagate value changes up to the parent form. */
  onChange: (value: string) => void = () => {};

  /** Callback to propagate the touched state up to the parent form. */
  onTouched: () => void = () => {};

  onInputFocus(): void {
    this.classInputControl.setValue(this.classInputControl.value);
  }

  /**
   * Registers a callback function to be called when the control's value changes in the UI.
   * @param fn The callback function to register.
   */
  registerOnChange(fn: (value: string) => void): void {
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
   * Writes value from parent form into classInputControl.
   * Triggered when the parent form is initialized or when parentForm.patchValue() is called.
   *
   * @param value The new value from the parent form control.
   */
  writeValue(value: string): void {
    this.classInputControl.setValue(value, { emitEvent: false });
  }

  /**
   * Syncs the disabled state from the parent form to this component's internal control.
   * @param isDisabled The new disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.classInputControl.disable({ emitEvent: false });
    } else {
      this.classInputControl.enable({ emitEvent: false });
    }
  }

  /**
   * This method called by the parent form.
   * @param _control The parent FormControl that this component is bound to.
   * @returns A ValidationErrors object if invalid, or null if valid.
   */
  validate(_control: AbstractControl): ValidationErrors | null {
    return this.classInputControl.errors;
  }

  /**
   * Processes input search text to retrieve filtered values for the autocomplete. Does not make a call if the input
   * control is disabled.
   * 
   * @param {string} searchText The search string to filter suggestions.
   * @returns {Observable<GroupedSuggestion[]>} An observable of grouped suggestions.
   */
  private _getSuggestions(searchText: string): Observable<GroupedSuggestion[]> {
    // If disabled, don't make a call
    if (this.classInputControl.disabled) {
      return of([]);
    }
    this._spinner.startLoadingForComponent(this.targetClassSpinner, 15);
    return this.stateService.getClassOptions(searchText, true).pipe(
      catchError(() => {
        this._toastService.createErrorToast('Could not load suggestions. Please try typing again.');
        return of([]);
      }),
      finalize(() => {
        this._spinner.finishLoadingForComponent(this.targetClassSpinner);
      })
    );
  }
}
