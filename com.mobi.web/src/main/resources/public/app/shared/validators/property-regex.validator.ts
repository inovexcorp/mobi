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
import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validator that checks if a nested property on an object matches the provided Regex Expression. If the control value
 * is a string, it checks the string directly.
 * 
 * @param control The FormControl to apply this validator to
 */
export function propertyRegex(regex: RegExp, property: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }
    const val = typeof control.value === 'string' ? control.value : control.value?.[property];
    if (!regex.test(val)) {
      return {
        pattern: {
          requiredPattern: regex.source,
          actualValue: val
        }
      };
    }
    return null;
  };
}
