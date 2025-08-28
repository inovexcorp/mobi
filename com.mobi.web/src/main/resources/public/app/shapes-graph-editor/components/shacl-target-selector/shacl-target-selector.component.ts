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
import { Component, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';

import { 
  IMPLICIT_REFERENCE,
  TARGET_CLASS,
  TARGET_NODE,
  TARGET_OBJECTS_OF,
  TARGET_SUBJECTS_OF
} from '../../models/constants';

/**
 * Represents a single selectable SHACL target type option and its UI metadata.
 *
 * @property {string} iri Unique IRI identifying the target type.
 * @property {string} label Label for the radio button option.
 * @property {string} description A detailed description of the target's behavior for tooltip
 * @property {string} valueLabel Label for the associated value input field.
 * @property {boolean} [isUserSelection] Optional. True if the selection was a direct user action.
 */
export interface TargetOption {
  iri: string;
  label: string;
  description: string;
  valueLabel: string;
  isUserSelection?: boolean;
}

/**
 * @class ShaclTargetSelectorComponent
 *
 * A reusable, self-contained custom form control for selecting a SHACL target type.
 * It renders a list of predefined SHACL targets as a group of Material radio buttons.
 *
 * It integrates with Angular's Reactive Forms by implementing ControlValueAccessor
 * and Validator. It uses an internal FormControl to manage its own state
 * and validation, reporting the results to the parent form.
 *
 * In addition to standard form control behavior, it emits a selectionChange event
 * with a detailed TargetOption object, providing richer metadata about the
 * selected option beyond its simple value.
 */
@Component({
  selector: 'app-shacl-target-selector',
  templateUrl: './shacl-target-selector.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ShaclTargetSelectorComponent),
      multi: true
    }
  ]
})
export class ShaclTargetSelectorComponent implements ControlValueAccessor {
  @Output() selectionChange = new EventEmitter<TargetOption>();

  readonly targetOptions: TargetOption[] = [
    {
      iri: TARGET_NODE,
      label: 'Specific Instance',
      description: 'Applies the shape to a specific node IRI',
      valueLabel: 'Type a Node IRI'
    },
    {
      iri: TARGET_CLASS,
      label: 'Types of Instance',
      description: 'Applies the shape to all nodes of the given type.',
      valueLabel: 'Select a Type'
    },
    {
      iri: TARGET_OBJECTS_OF,
      label: 'Object of',
      description: 'Applies the shape to all nodes that appear as the value of the given property.',
      valueLabel: 'Select a Property'
    },
    {
      iri: TARGET_SUBJECTS_OF,
      label: 'Subject of',
      description: 'Applies the shape to all nodes that have the given predicate set.',
      valueLabel: 'Select a Property'
    },
    {
      iri: IMPLICIT_REFERENCE,
      label: 'Implicit',
      description: 'Applies the shape to all nodes defined as a type of the Node Shape\'s IRI.',
      valueLabel: ''
    }
  ];

  value: string | null = null;
  isDisabled = false;
  
  constructor() { }
  
  /** Callback to propagate value changes up to the parent form. */
  onChange: (value: string) => void = () => { };

  /** Callback to propagate the touched state up to the parent form. */
  onTouched: () => void = () => { };

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
   * Writes a value from the parent form into this component's internal control.
   * Triggered when the parent form is initialized or when parentForm.patchValue() is called.
   * It synchronizes the child component's view with the parent's model.
   *
   * @param value The new value from the parent form control.
   */
  writeValue(value: string): void {
    this.value = value;
    this._findAndEmitSelection(value, false);
  }

  /**
   * Syncs the disabled state from the parent form to this component's internal control.
   * @param isDisabled The new disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  /**
   * Handles the change event when a user selects a new radio button.
   * @param event MatRadioChange event emitted by the <mat-radio-group>.
   */
  onRadioChange(event: MatRadioChange): void {
    const newValueIri: string = event.value;
    this.value = newValueIri;
    this.onChange(newValueIri); // Updates the parent form's value
    this.onTouched(); // Marks the control as touched (use for validation display logic)
    this._findAndEmitSelection(newValueIri, true); // Emits a custom event
  }

  /**
   * Finds the TargetOption corresponding to the given IRI and emits it.
   * Centralizes logic used by writeValue and onRadioChange.
   * @param iri The IRI of the target to find and emit.
   * @param userInitiated Flag indicating if the change came from direct user interaction.
   */
  private _findAndEmitSelection(iri: string | null, userInitiated: boolean): void {
    if (!iri) {
      return;
    }
    const selectedOption = this.targetOptions.find(opt => opt.iri === iri);
    if (selectedOption) {
      this.selectionChange.emit({...selectedOption, isUserSelection: userInitiated});
    }
  }
}
