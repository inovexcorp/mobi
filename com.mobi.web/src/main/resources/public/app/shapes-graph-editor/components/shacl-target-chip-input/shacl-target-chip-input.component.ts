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
import {
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
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
import { ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, filter, finalize, map, switchMap, takeUntil } from 'rxjs/operators';

import { GroupedSuggestion } from '../../models/grouped-suggestion';
import { REGEX } from '../../../constants';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ValueOption } from '../../models/value-option.interface';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';

/**
 * @class ShaclTargetChipInputComponent
 * @requires ShapesGraphStateService
 * @requires ToastService
 *
 * A custom form control component for inputting a list of SHACL target IRIs.
 *
 * It uses Angular Material Chips to display the selected IRIs and provides
 * an autocomplete dropdown with suggestions fetched from the shapes graph.
 *
 * It integrates with Angular's Reactive Forms by implementing ControlValueAccessor.
 * It uses an internal FormControl to manage its own state.
 *
 * @param {string} label The label for the form field.
 * @param {string} targetType The type of target to query for.
 */
@Component({
  selector: 'app-shacl-target-chip-input',
  templateUrl: './shacl-target-chip-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShaclTargetChipInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ShaclTargetChipInputComponent),
      multi: true
    }
  ]
})
export class ShaclTargetChipInputComponent implements ControlValueAccessor, Validator, OnInit, OnChanges, OnDestroy {
  @Input() label: string;
  @Input() targetType: string;

  @ViewChild('chipInput') chipInput: ElementRef<HTMLInputElement>;
  @ViewChild('targetChipSpinner', { static: true }) targetChipSpinner: ElementRef;

  readonly separatorKeysCodes: number[] = [ENTER];

  chipValues: ValueOption[] = [];
  suggestions$: Observable<GroupedSuggestion[]> = of([]);
  // suggestions: GroupedSuggestion[] = [];
  inputControl = new FormControl<string | ValueOption | null>('', Validators.pattern(REGEX.IRI));
  isDisabled = false;
  private _destroySub$ = new Subject<void>();
  private _suggestionsSubscription: Subscription;

  constructor(
    public stateService: ShapesGraphStateService,
    private _toastService: ToastService,
    private _spinner: ProgressSpinnerService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.targetType && !changes.targetType.firstChange) {
      this._setupSuggestionsSubscription();
      this.chipInput.nativeElement.value = '';
    }
  }

  ngOnInit(): void {
    this._setupSuggestionsSubscription();
  }

  private _setupSuggestionsSubscription(): void {
    if (this._suggestionsSubscription) {
      this._suggestionsSubscription.unsubscribe();
    }
    this.suggestions$ = this.inputControl.valueChanges
    // this._suggestionsSubscription = this.inputControl.valueChanges
      .pipe(
        takeUntil(this._destroySub$),
        map(value => typeof value === 'string' ? value : ''),
        debounceTime(300),
        switchMap((searchText: string) => this._getSuggestions(searchText)),
      );
      this._suggestionsSubscription = this.suggestions$.subscribe();
  }

  /**
   * Cleans up all subscriptions to avoid memory leaks.
   */
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  /** Callback to propagate value changes up to the parent form. */
  onChange: (value: string[]) => void = () => { };

  /** Callback to propagate the touched state up to the parent form. */
  onTouched: () => void = () => { };

  onInputFocus(): void {
    this.inputControl.setValue(this.inputControl.value);
  }

  /**
   * Registers a callback function to be called when the control's value changes in the UI.
   * @param fn The callback function to register.
   */
  registerOnChange(fn: (value: string[]) => void): void {
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
   * @param values The new values from the parent form control.
   */
  writeValue(values: string[] | null): void {
    if (values) {
      this.chipValues = values.map((iri: string) => ({
        label: this.stateService.getEntityName(iri),
        value: iri
      }));
    } else {
      this.chipValues = [];
    }
    if (this.chipInput) {
      this.chipInput.nativeElement.value = '';
    }
    this.inputControl.setValue(null, { emitEvent: false });
  }

  /**
   * Validates that the chip list is not empty.
   * This method is called by Angular's forms module.
   * @param _control The form control instance. Not used directly, but required by the interface.
   * @returns A ValidationErrors object if the list is empty, otherwise null.
   */
  validate(_control: AbstractControl): ValidationErrors | null {
    if (this.chipValues.length > 0) {
      return null;
    }
    return { required: true };
  }

  /**
   * Adds a chip when an autocomplete option is selected.
   * Event to use for post-selection logic.
   * @param event The selection event from the MatAutocomplete.
   */
  addChipFromSelection(event: MatAutocompleteSelectedEvent): void {
    const suggestion: ValueOption = event.option.value;
    if (suggestion && !this.chipValues.some((c: ValueOption) => c.value === suggestion.value)) {
      this.chipValues = [...this.chipValues, suggestion];
      this._propagateChanges();
    }
    // Clear the physical input element and reset the form control
    this.chipInput.nativeElement.value = '';
    this.inputControl.setValue(null, { emitEvent: false });
  }

  /**
   * Handles the chip input submission event. Currently clears the input.
   * @param event - The chip input event.
   */
  addChipFromInput(event: MatChipInputEvent): void {
    if (this.inputControl.valid && this.inputControl.value) {
      const value = (this.inputControl.value as string)?.trim();
      if (value && !this.chipValues.some((c) => c.value === value)) {
        const newChip = {
          label: this.stateService.getEntityName(value),
          value: value
        };
        this.chipValues = [...this.chipValues, newChip];
        this._propagateChanges();
      }
    }
    // Clear the input value regardless of whether it was added
    if (event.input) {
      event.input.value = '';
    }
    this.inputControl.setValue(null, { emitEvent: false });
  }

  /**
   * Removes a chip from the list by its index.
   * @param index - The index of the chip to remove.
   */
  removeChip(index: number): void {
    if (index >= 0) {
      this.chipValues = this.chipValues.filter((_, i) => i !== index);
      this._propagateChanges();
    }
  }

  /**
   * Propagate the component's internal state back to the parent reactive form.
   */
  private _propagateChanges(): void {
    this.onChange(this.chipValues.map(chip => chip.value));
    this.onTouched(); // Triggers validation messages and styling
  }

  /**
   * Syncs the disabled state from the parent form to this component's internal control.
   * @param isDisabled The new disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    if (isDisabled) {
      this.inputControl.setValue(null, { emitEvent: false });
      if (this.chipInput) {
        this.chipInput.nativeElement.value = '';
      }
      this.inputControl.disable({ emitEvent: false });
    } else {
      this.inputControl.enable({ emitEvent: false });
    }
  }

  displayFn: () => string = () => ''; // Clear input after selection

  /**
   * TrackBy function for groups in the suggestions list.
   *
   * @param _index The index of the current group in the iteration.
   * @param group The current group object containing label and suggestions.
   * @returns The unique label of the group.
   */
  trackByGroupLabel(_index: number, group: GroupedSuggestion): string {
    return group.label;
  }

  /**
   * TrackBy function for individual suggestions within a group.
   *
   * @param _index The index of the current suggestion in the iteration.
   * @param suggestion The current suggestion object containing label and value.
   * @returns The unique IRI of the suggestion.
   */
  trackBySuggestionValue(_index: number, suggestion: ValueOption): string {
    return suggestion.value;
  }

  /**
   * Processes input search text to retrieve filtered values for the autocomplete. Filters out already selected chips.
   * Does not make a call if the input control is disabled.
   * 
   * @param {string} searchText The search string to filter suggestions.
   * @returns {Observable<GroupedSuggestion[]>} An observable of grouped suggestions.
   */
  private _getSuggestions(searchText: string): Observable<GroupedSuggestion[]> {
    // If disabled, don't make a call
    if (this.inputControl.disabled) {
      return of([]);
    }
    this._spinner.startLoadingForComponent(this.targetChipSpinner, 15);
    return this.stateService.getPropertiesOptions(searchText, this.targetType, true).pipe(
      catchError(() => {
        this._toastService.createErrorToast('Could not load suggestions. Please try typing again.');
        return of([]);
      }),
      // Remove already selected chips from suggestions
      map((suggestions: GroupedSuggestion[]) => {
        const selectedValues = this.chipValues.map(chip => chip.value);
        if (selectedValues.length > 0) {
          suggestions.forEach(group => {
            group.suggestions = group.suggestions.filter(suggestion => !selectedValues.includes(suggestion.value));
          });
        }
        return suggestions;
      }),
      finalize(() => {
        this._spinner.finishLoadingForComponent(this.targetChipSpinner);
      })
    );
  }
}
