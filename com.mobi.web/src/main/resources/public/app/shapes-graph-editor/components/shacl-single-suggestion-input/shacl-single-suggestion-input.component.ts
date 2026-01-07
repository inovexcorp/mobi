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
import { Component, ElementRef, forwardRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, ControlValueAccessor, Validator, ValidationErrors, FormControl, Validators } from '@angular/forms';

import { Observable, of, Subject } from 'rxjs';
import { cloneDeep, some } from 'lodash';

import { takeUntil, startWith, map, debounceTime, switchMap, catchError, finalize, tap } from 'rxjs/operators';
import { REGEX } from '../../../constants';
import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { PropertyType, ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ValueOption } from '../../models/value-option.interface';
import { OWL } from '../../../prefixes';
import { propertyRegex } from '../../../shared/validators/property-regex.validator';

/**
 * @class ShaclSingleSuggestionInputComponent
 * @requires ShapesGraphStateService
 * @requires ToastService
 * @requires ProgressSpinnerService
 * 
 * A custom Angular form control component for selecting an OWL class or property from the imports closure of the
 * {@link ShapesGraphStateService.listItem currently selected shapes graph}. Has an autocomplete that either pulls
 * owl:Class IRIs or a list of properties filtered by the provided `propertyTypes`, providing users with relevant
 * suggestions as they type. Also supports entering custom IRIs that are not in the list.
 *
 * It integrates with Angular's Reactive Forms by implementing ControlValueAccessor and Validator. It uses an internal
 * FormControl to manage its own state and validation, reporting the results to the parent form.
 *
 * @param {string} label The label for the form field.
 * @param {boolean} pullClasses Whether to pull owl:Class IRIs or properties. Defaults to true.
 * @param {PropertyType[]} propertyTypes The types of properties to filter by when pulling properties. Defaults to all
 * property types.
 */
@Component({
  selector: 'app-shacl-single-suggestion-input',
  templateUrl: './shacl-single-suggestion-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShaclSingleSuggestionInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ShaclSingleSuggestionInputComponent),
      multi: true
    }
  ]
})
export class ShaclSingleSuggestionInputComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  @Input() label: string;
  @Input() pullClasses = true;
  @Input() propertyTypes: PropertyType[] = [];

  @ViewChild('autocompleteSpinner', { static: true }) autocompleteSpinner: ElementRef;

  // Option that is only shown if the entered value is a valid IRI but not in the list of suggestions.
  customSuggestion: ValueOption = {
    value: '',
    label: '',
    type: `${OWL}ObjectProperty` // Default type for properties so all options are considered
  };
  inputControl = new FormControl('', [Validators.required, propertyRegex(REGEX.IRI, 'value')]);
  suggestions$: Observable<GroupedSuggestion[]> = of([]);
  noMatches = true;
  selectedOption: ValueOption | null = null;

  private _destroySub$ = new Subject<void>();

  constructor(
    public state: ShapesGraphStateService,
    private _toast: ToastService,
    private _spinner: ProgressSpinnerService
  ) {}

  ngOnInit(): void {
    this.customSuggestion.type = this.pullClasses ? `${OWL}Class` : `${OWL}ObjectProperty`;
    this.suggestions$ = this.inputControl.valueChanges
      .pipe(
        takeUntil(this._destroySub$),
        startWith<string | ValueOption>(''),
        debounceTime(300),
        map(value => typeof value === 'string' ? value : value ? value.value : ''),
        switchMap(searchText => this._getSuggestions(searchText))
      );
    this.inputControl.valueChanges.pipe(takeUntil(this._destroySub$)).subscribe((value: string | ValueOption) => {
      // Updates the custom suggestion based on the input value
      if (typeof value === 'string') {
        this.customSuggestion.value = value;
        this.customSuggestion.label = this.state.getEntityName(value);
      }
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
  onChange: (value: ValueOption) => void = () => {};

  /** Callback to propagate the touched state up to the parent form. */
  onTouched: () => void = () => {};

  /**
   * When the input field is focused, it effectively refreshes the input value to ensure the latest suggestions are
   * shown since they are not fetched if the field is disabled.
   */
  onInputFocus(): void {
    this.inputControl.setValue(this.inputControl.value);
  }

  /**
   * If focus leaves the input, it resets the input value to the selected option so that invalid values are not
   * displayed.
   */
  onBlur(): void {
    this.inputControl.setValue(this.selectedOption?.value || '');
    this.onTouched();
  }

  /**
   * Updates the input control's value when an option is selected from the autocomplete dropdown and emits the
   * ValueOption to the parent form.
   * 
   * @param {ValueOption} option The selected option from the autocomplete dropdown.
   */
  onOptionSelected(option: ValueOption): void {
    this.inputControl.setValue(option.value, { emitEvent: false });
    this.selectedOption = cloneDeep(option);
    this.onChange(option);
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
   * Writes value from parent form into inputControl.
   * Triggered when the parent form is initialized or when parentForm.patchValue() is called.
   *
   * @param value The new value from the parent form control.
   */
  writeValue(value: string | ValueOption): void {
    if (value) {
      if (typeof value === 'string') { // If a string is provided, treat it as a custom value
        this.customSuggestion.value = value;
        this.customSuggestion.label = this.state.getEntityName(value);
        this.selectedOption = this.customSuggestion;
      } else if (typeof value === 'object') {
        this.selectedOption = value;
      }
    }
    this.inputControl.setValue(this.selectedOption?.value, { emitEvent: false });
  }

  /**
   * Syncs the disabled state from the parent form to this component's internal control.
   * @param isDisabled The new disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.inputControl.disable({ emitEvent: false });
    } else {
      this.inputControl.enable({ emitEvent: false });
    }
  }

  /**
   * This method called by the parent form.
   * @param _control The parent FormControl that this component is bound to.
   * @returns A ValidationErrors object if invalid, or null if valid.
   */
  validate(): ValidationErrors | null {
    return this.inputControl.errors;
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
    if (this.inputControl.disabled) {
      return of([]);
    }
    this._spinner.startLoadingForComponent(this.autocompleteSpinner, 15);
    // Pulls the correct suggestions based on component configuration
    const ob = this.pullClasses 
      ? this.state.getClassOptions(searchText, true) 
      : this.state.getPropertyOptions(searchText, this.propertyTypes, true);
    return ob.pipe(
      catchError(() => {
        this._toast.createErrorToast('Could not load suggestions. Please try typing again.');
        return of([]);
      }),
      tap(suggestions => {
        // Determines if the custom suggestion should be shown based on whether the input value is in the suggestions
        this.noMatches = !some(suggestions, group => 
          some(group.suggestions, suggestion => suggestion.value === this.inputControl.value));
      }),
      finalize(() => {
        this._spinner.finishLoadingForComponent(this.autocompleteSpinner);
      })
    );
  }
}
