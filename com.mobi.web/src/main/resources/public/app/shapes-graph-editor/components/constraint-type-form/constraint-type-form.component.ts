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
import { Component, Input } from '@angular/core';
import { AbstractControl, UntypedFormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

import { ConstraintControl, ConstraintOption } from '../../models/constraint-control.interface';

/**
 * @class ConstraintTypeFormComponent
 * 
 * A component that renders Form Controls associated with a specific {@link ConstraintControl}. Includes support for
 * text, number, select, autocomplete, and chip inputs. Uses a {@link ShaclSingleSuggestionInputComponent} for the
 * autocomplete input type.
 * 
 * @param {FormGroup} formGroup The parent FormGroup that all the Form Controls are set on
 * @param {ConstraintOption} constraintOption The constraint option to display controls for
 */
@Component({
  selector: 'app-constraint-type-form',
  templateUrl: './constraint-type-form.component.html'
})
export class ConstraintTypeFormComponent {
  @Input() parentForm: UntypedFormGroup;
  @Input() constraintOption: ConstraintOption;
  
  public readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor() {}

  /**
   * Determines where the control with the provided name is required or not.
   * 
   * @param {string} controlName The name of a FormControl in the parent Form Group
   * @returns {boolean} True if it is required; false otherwise
   */
  isRequired(controlName: string): boolean {
    const ctrl = this.parentForm.controls[controlName];
    const validators = ctrl.validator && ctrl.validator({} as AbstractControl);
    return !!(validators && validators.required);
  }

  /**
   * Determines whether the required error message should be shown for the provided ConstraintControl.
   * 
   * @param {ConstraintControl} control The control to check
   * @returns {boolean} True whether to show the required error message; False otherwise
   */
  requiredMessage(control: ConstraintControl): boolean {
    return control.control.errors !== null && control.control.errors.required;
  }

  /**
   * Handles the addition of a chip to the chip input of the provided ConstraintControl. Assumes the control value
   * will be an array of the values. 
   * NOTE: The text input is not actually associated with the ConstraintControl FormControl.
   * 
   * @param {MatChipInputEvent} event The event from adding the chip
   * @param {ConstraintControl} control The parent ConstraintControl with type chip
   */
  addChip(event: MatChipInputEvent, control: ConstraintControl): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      if (!control.control.value) {
        control.control.setValue([value]);
      } else if (!control.control.value.includes(value)) {
        control.control.value.push(value);
      }
    }
    control.control.updateValueAndValidity();
    // Clear the input value
    event.chipInput.clear();
  }

  /**
   * Handles the removal of a chip from the chip input of the provided ConstraintControl. Assumes the control value
   * will be an array of the values. 
   * NOTE: The text input is not actually associated with the ConstraintControl FormControl.
   * 
   * @param {string} currValue The chip value to remove
   * @param {ConstraintControl} control The parent ConstraintControl with type chip
   */
  removeChip(currValue: string, control: ConstraintControl): void {
    const index: number = control.control.value.indexOf(currValue);

    if (index >= 0) {
      control.control.value.splice(index, 1);
    }
    control.control.updateValueAndValidity();
  }
}
