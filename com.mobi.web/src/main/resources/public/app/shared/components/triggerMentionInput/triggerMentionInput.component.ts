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
import { ControlValueAccessor, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Interface for suggestion options displayed in the dropdown
 */
export interface TriggerMentionOption {
  displayText: string;      // Display text in dropdown (e.g., "Concept")
  insertValue: string;      // Value to insert (e.g., "0" or "UUID")
  category?: string;        // Optional grouping category
  metadata?: {              // Additional metadata
    preview?: string;       // Preview value from data
    [key: string]: any;
  };
}

/**
 * Configuration for trigger behavior
 */
export interface TriggerConfig {
  trigger: string;          // Trigger characters (e.g., "${")
  closingChar: string;      // Closing character (e.g., "}")
}

/**
 * Parsed pattern information from template
 */
export interface ParsedPattern {
  fullMatch: string;        // Full match including delimiters (e.g., "${0}")
  innerValue: string;       // Inner value (e.g., "0")
  startIndex: number;       // Start position in string
  endIndex: number;         // End position in string
  isValid: boolean;         // Whether the pattern is valid
  resolvedName?: string;    // Resolved display name
  resolvedValue?: string;   // Resolved preview value
}

/**
 * Result from pattern validation
 */
export interface PatternValidationResult {
  isValid: boolean;
  resolvedName?: string;
  resolvedValue?: string;
}

/**
 * @class TriggerMentionInputComponent
 *
 * A reusable Angular Material form control that provides trigger-based dropdown suggestions.
 * When users type a configured trigger sequence (e.g., "${"), a dropdown appears with suggestions.
 * Selected suggestions are inserted into the text with appropriate formatting. Patterns are styled to stand out from
 * regular text, and invalid pattern references are highlighted as errors.
 *
 * Implements ControlValueAccessor for form integration and Validator for custom validation.
 * Uses a dual-layer approach (styled overlay + transparent input) to display styled patterns
 * within the text field.
 */
@Component({
  selector: 'app-trigger-mention-input',
  templateUrl: './triggerMentionInput.component.html',
  styleUrls: ['./triggerMentionInput.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TriggerMentionInputComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => TriggerMentionInputComponent),
      multi: true
    }
  ]
})
export class TriggerMentionInputComponent implements ControlValueAccessor, Validator, OnInit, OnDestroy {
  /**
   * Configuration for the trigger behavior
   */
  @Input() triggerConfig: TriggerConfig = { trigger: '${', closingChar: '}' };

  /**
   * List of suggestions to display in dropdown
   */
  @Input() suggestions: TriggerMentionOption[] = [];

  /**
   * Placeholder text for the input
   */
  @Input() placeholder = '';

  /**
   * Label for the form field
   */
  @Input() label = '';

  /**
   * Hint text displayed below the field
   */
  @Input() hint = '';

  /**
   * Whether the field is required
   */
  @Input() required = false;

  /**
   * Function to validate pattern inner values
   * Returns validation result with optional resolved name/value
   */
  @Input() patternValidator: (innerValue: string) => PatternValidationResult = () => ({ isValid: true });

  /**
   * Function to validate the resolved/filled template
   * Used for custom validation like IRI validation
   */
  @Input() resolveValidator: (value: string) => ValidationErrors | null = () => null;

  @ViewChild('inputElement') inputElement: ElementRef<HTMLInputElement>;
  @ViewChild('autoTrigger', { read: MatAutocompleteTrigger }) autoTrigger: MatAutocompleteTrigger;

  inputControl = new FormControl('');
  styledValue = '';
  filteredSuggestions: TriggerMentionOption[] = [];
  highlightedIndex = 0;

  private _triggerStartPosition = -1;
  private _destroySub$ = new Subject<void>();
  private _isPanelOpen = false;
  private _valueBeforeAutocomplete = '';
  private _cursorPosBeforeAutocomplete = 0;

  constructor() {}

  ngOnInit(): void {
    this.inputControl.valueChanges
      .pipe(takeUntil(this._destroySub$))
      .subscribe(value => {
        // Skip processing if value is not a string
        // mat-autocomplete temporarily sets value to the selected option object
        // before our onAutocompleteSelected handler can restore the correct string value
        if (typeof value !== 'string') {
          return;
        }
        this._updateStyledValue(value);
        this.onChange(value);
        // Run validation and sync errors to inputControl
        this._runValidation();
      }, error => console.error('Form value error:', error));
  }

  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  /** ControlValueAccessor callbacks */
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Display function for mat-autocomplete.
   * Returns empty string because we handle value insertion manually in selectOption().
   * This prevents mat-autocomplete from replacing the input value with the selected option.
   * 
   * @param {TriggerMentionOption | string} option The selected option
   * @returns {string} The option if a string; otherwise an empty string to prevent mat-autocomplete from changing the 
   *    input value
   */
  displayFn(option: TriggerMentionOption | string): string {
    // Always return empty string - we don't want mat-autocomplete to set any value
    // Our selectOption() handles the insertion manually
    return typeof option === 'string' ? option : '';
  }

  /**
   * Writes value from parent form into classInputControl.
   * Triggered when the parent form is initialized or when parentForm.patchValue() is called.
   * Updates the styled overlay value and runs validation.
   * 
   * @param {string} value The new value from the parent form control
   */
  writeValue(value: string): void {
    this.inputControl.setValue(value || '', { emitEvent: false });
    this._updateStyledValue(value || '');
    // Run validation on initial value
    this._runValidation();
  }

  /**
   * Syncs the disabled state from the parent form to this component's internal control.
   * 
   * @param {boolean} isDisabled The new disabled state
   */
  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.inputControl.disable({ emitEvent: false });
    } else {
      this.inputControl.enable({ emitEvent: false });
    }
  }

  /**
   * Validator implementation - return inputControl.errors for proper Material integration.
   *
   * @returns {ValidationErrors | null} The current errors on the inputControl
   */
  validate(): ValidationErrors | null {
    return this.inputControl.errors;
  }

  /**
   * Handle input events to detect trigger sequences
   * 
   * @param {Event} event The input event
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const cursorPos = input.selectionStart || 0;

    // Save value and cursor position before potential autocomplete selection
    this._valueBeforeAutocomplete = value;
    this._cursorPosBeforeAutocomplete = cursorPos;

    this._checkForTrigger(value, cursorPos);
  }

  /**
   * Handle keydown events for dropdown navigation and special behaviors. Updates highlightedIndex for arrow key
   * navigation. Selects option on Enter. Closes dropdown on Escape or Tab. Handles backspace to delete entire patterns.
   * 
   * @param {KeyboardEvent} event The keyboard event
   */
  onKeydown(event: KeyboardEvent): void {
    // Handle dropdown navigation when dropdown is visible
    if (this._isPanelOpen && this.filteredSuggestions.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.highlightedIndex = (this.highlightedIndex + 1) % this.filteredSuggestions.length;
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.highlightedIndex = (this.highlightedIndex - 1 + this.filteredSuggestions.length) % this.filteredSuggestions.length;
          break;
        case 'Enter':
          event.preventDefault();
          if (this.filteredSuggestions[this.highlightedIndex]) {
            this.selectOption(this.filteredSuggestions[this.highlightedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          this._closeAutocomplete();
          break;
        case 'Tab':
          this._closeAutocomplete();
          break;
      }
      return;
    }

    // Handle backspace to delete entire patterns
    if (event.key === 'Backspace') {
      this._handleBackspace(event);
    }
  }

  /**
   * Handle blur event - close dropdown and mark as touched
   */
  onBlur(): void {
    // Small delay to allow click on dropdown option to register
    setTimeout(() => {
      this._closeAutocomplete();
      this.onTouched();
      // Mark input as touched to trigger validation display
      this.inputControl.markAsTouched();
    }, 200);
  }

  /**
   * Handle focus event - check for trigger at cursor position
   */
  onFocus(): void {
    const value = this.inputControl.value;
    // Only check for trigger if value is a string (mat-autocomplete can set objects)
    if (typeof value === 'string') {
      const cursorPos = this.inputElement?.nativeElement?.selectionStart || 0;
      this._checkForTrigger(value, cursorPos);
    }
  }

  /**
   * Handle mat-autocomplete option selection. Restores the input value after mat-autocomplete
   * modifies it, then calls selectOption() with the saved cursor position.
   *
   * @param {MatAutocompleteSelectedEvent} event The selection event
   */
  onAutocompleteSelected(event: MatAutocompleteSelectedEvent): void {
    const option = event.option.value as TriggerMentionOption;

    // Restore the value that was in the input BEFORE autocomplete selection
    // mat-autocomplete may have replaced the input value with the selected option
    this.inputControl.setValue(this._valueBeforeAutocomplete, { emitEvent: false });

    // Pass the saved cursor position directly - don't rely on DOM state after setValue
    this.selectOption(option, this._cursorPosBeforeAutocomplete);
  }

  /**
   * Handle autocomplete panel opened
   */
  onPanelOpened(): void {
    this._isPanelOpen = true;
  }

  /**
   * Handle autocomplete panel closed
   */
  onPanelClosed(): void {
    this._isPanelOpen = false;
  }

  /**
   * Select an option from the dropdown.
   *
   * @param {TriggerMentionOption} option The selected option
   * @param {number} cursorPos Optional cursor position to use instead of reading from DOM
   */
  selectOption(option: TriggerMentionOption, cursorPos?: number): void {
    if (!option) {
      return;
    }

    const value = this.inputControl.value || '';
    // Use provided cursor position, or fall back to DOM selectionStart, or value length
    const effectiveCursorPos = cursorPos ?? this.inputElement?.nativeElement?.selectionStart ?? value.length;

    // Find where to insert - from trigger start to current cursor
    const beforeTrigger = value.substring(0, this._triggerStartPosition);
    const afterCursor = value.substring(effectiveCursorPos);

    // Build the complete pattern
    const insertText = `${this.triggerConfig.trigger}${option.insertValue}${this.triggerConfig.closingChar}`;
    const newValue = beforeTrigger + insertText + afterCursor;

    this.inputControl.setValue(newValue);

    // Position cursor after inserted pattern
    const newCursorPos = beforeTrigger.length + insertText.length;
    setTimeout(() => {
      if (this.inputElement?.nativeElement) {
        this.inputElement.nativeElement.setSelectionRange(newCursorPos, newCursorPos);
        this.inputElement.nativeElement.focus();
      }
    });

    this._closeAutocomplete();
  }

  /**
   * Parse all patterns from the value string.
   * 
   * @param {string} value The input value to parse
   * @returns {ParsedPattern[]} List of parsed patterns
   */
  parsePatterns(value: string): ParsedPattern[] {
    const patterns: ParsedPattern[] = [];
    const escapedClosingChar = this._escapeRegex(this.triggerConfig.closingChar);
    const regex = new RegExp(
      this._escapeRegex(this.triggerConfig.trigger) + '([^' + escapedClosingChar + ']*)' + escapedClosingChar,
      'g'
    );

    let match;
    while ((match = regex.exec(value)) !== null) {
      const innerValue = match[1];
      const validationResult = this.patternValidator(innerValue);

      patterns.push({
        fullMatch: match[0],
        innerValue,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        isValid: validationResult.isValid,
        resolvedName: validationResult.resolvedName,
        resolvedValue: validationResult.resolvedValue
      });
    }

    return patterns;
  }

  /**
   * Run validation and set errors on inputControl
   * This ensures Angular Material shows validation state properly
   */
  private _runValidation(): void {
    const rawValue = this.inputControl.value;
    // Ensure value is a string (mat-autocomplete can temporarily set objects)
    const value = typeof rawValue === 'string' ? rawValue : '';
    let errors: ValidationErrors | null = null;

    // Required check
    if (this.required && !value) {
      errors = { ...errors, required: true };
    }

    // Only run other validations if there's a value
    if (value) {
      // Check for unclosed patterns
      const unclosedPattern = this._findUnclosedPattern(value);
      if (unclosedPattern) {
        errors = { ...errors, unclosedPattern: true };
      }

      // Check for invalid patterns
      const patterns = this.parsePatterns(value);
      const invalidPatterns = patterns.filter(p => !p.isValid);
      if (invalidPatterns.length > 0) {
        errors = {
          ...errors,
          invalidPattern: {
            patterns: invalidPatterns.map(p => p.innerValue)
          }
        };
      }

      // Run custom resolve validator if provided
      if (this.resolveValidator) {
        const resolveError = this.resolveValidator(value);
        if (resolveError) {
          errors = { ...errors, ...resolveError };
        }
      }
    }

    // Set errors on inputControl so mat-form-field shows proper validation state
    this.inputControl.setErrors(errors);
  }

  /**
   * Open the autocomplete panel
   */
  private _openAutocomplete(): void {
    if (this.filteredSuggestions.length > 0 && this.autoTrigger) {
      this.autoTrigger.openPanel();
    }
  }

  /**
   * Close the autocomplete panel
   */
  private _closeAutocomplete(): void {
    if (this.autoTrigger) {
      this.autoTrigger.closePanel();
    }
    this._triggerStartPosition = -1;
  }

  /**
   * Check for trigger sequence at cursor position
   * 
   * @param {string} value The current input value
   * @param {number} cursorPos The current cursor position
   */
  private _checkForTrigger(value: string, cursorPos: number): void {
    const textBeforeCursor = value.substring(0, cursorPos);
    const triggerIndex = textBeforeCursor.lastIndexOf(this.triggerConfig.trigger);

    // No trigger found before cursor
    if (triggerIndex === -1) {
      this._closeAutocomplete();
      return;
    }

    // Check if we're inside a completed pattern
    const afterTrigger = value.substring(triggerIndex);
    const closingIndex = afterTrigger.indexOf(this.triggerConfig.closingChar);

    // Show dropdown if: no closing char found, OR cursor is before closing char
    if (closingIndex === -1 || triggerIndex + closingIndex >= cursorPos) {
      this._triggerStartPosition = triggerIndex;
      const filterText = textBeforeCursor.substring(triggerIndex + this.triggerConfig.trigger.length);
      this._filterSuggestions(filterText);
      this.highlightedIndex = 0;
      this._openAutocomplete();
    } else {
      this._closeAutocomplete();
    }
  }

  /**
   * Filter suggestions based on typed text. Sets `filteredSuggestions`.
   * 
   * @param {string} filterText The text to filter suggestions by
   */
  private _filterSuggestions(filterText: string): void {
    const lowerFilter = filterText.toLowerCase().trim();

    if (!lowerFilter) {
      this.filteredSuggestions = [...this.suggestions];
    } else {
      this.filteredSuggestions = this.suggestions.filter(option =>
        option.displayText.toLowerCase().includes(lowerFilter) ||
        option.insertValue.toLowerCase().includes(lowerFilter)
      );
    }
  }

  /**
   * Handle backspace - delete entire pattern if at pattern end.
   * 
   * @param {KeyboardEvent} event The backspace keyboard event
   */
  private _handleBackspace(event: KeyboardEvent): void {
    const input = this.inputElement?.nativeElement;
    if (!input) {
      return;
    }

    const cursorPos = input.selectionStart || 0;
    const value = this.inputControl.value || '';

    // Check if cursor is right after a complete pattern
    const textBeforeCursor = value.substring(0, cursorPos);
    const escapedClosingChar = this._escapeRegex(this.triggerConfig.closingChar);
    const patternRegex = new RegExp(
      this._escapeRegex(this.triggerConfig.trigger) + '[^' + escapedClosingChar + ']*' + escapedClosingChar + '$'
    );
    const match = textBeforeCursor.match(patternRegex);

    if (match) {
      event.preventDefault();
      const patternStart = cursorPos - match[0].length;
      const newValue = value.substring(0, patternStart) + value.substring(cursorPos);
      this.inputControl.setValue(newValue);

      setTimeout(() => {
        input.setSelectionRange(patternStart, patternStart);
      });
    }
  }

  /**
   * Update the styled value for the overlay display
   * 
   * @param {string} value The current input value
   */
  private _updateStyledValue(value: string): void {
    const patterns = this.parsePatterns(value);

    let result = '';
    let lastIndex = 0;

    for (const pattern of patterns) {
      // Add text before pattern (escaped)
      result += this._escapeHtml(value.substring(lastIndex, pattern.startIndex));

      // Determine display text - use resolved name if available
      const displayText = pattern.resolvedName
        ? `${this.triggerConfig.trigger}${pattern.resolvedName}${this.triggerConfig.closingChar}`
        : pattern.fullMatch;

      // Add styled pattern
      const cssClass = pattern.isValid ? 'pattern-valid' : 'pattern-invalid';
      const title = pattern.resolvedValue || (pattern.isValid ? '' : 'Invalid reference');
      result += `<span class="${cssClass}" title="${this._escapeHtml(title)}">${this._escapeHtml(displayText)}</span>`;

      lastIndex = pattern.endIndex;
    }

    // Add remaining text after last pattern
    result += this._escapeHtml(value.substring(lastIndex));

    this.styledValue = result;
  }

  /**
   * Find unclosed pattern in value.
   * 
   * @param {string} value The input value
   * @returns {string | null} The unclosed pattern string if found; otherwise null
   */
  private _findUnclosedPattern(value: string): string | null {
    const triggerIndex = value.lastIndexOf(this.triggerConfig.trigger);
    if (triggerIndex === -1) {
      return null;
    }

    const afterTrigger = value.substring(triggerIndex + this.triggerConfig.trigger.length);
    if (afterTrigger.indexOf(this.triggerConfig.closingChar) === -1) {
      return value.substring(triggerIndex);
    }

    return null;
  }

  /**
   * Escape special characters for use in RegExp.
   * 
   * @param {string} str The string to escape
   * @returns {string} The escaped string
   */
  private _escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Escape HTML special characters.
   * 
   * @param {string} str The string to escape
   * @returns {string} The escaped string
   */
  private _escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
