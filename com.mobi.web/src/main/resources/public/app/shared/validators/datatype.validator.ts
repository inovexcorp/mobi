/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { validateTerm } from 'rdf-validate-datatype';
import rdf from '@rdfjs/data-model';

import { XSD } from '../../prefixes';
import { REGEX } from '../../constants';

/**
 * Validator for XSD datatypes on string that accepts empty or null values.
 * 
 * @param control The FormControl to apply this validator to
 */

const regex = new RegExp(REGEX.IRI);
export function datatype(datatypeFn: (() => string)): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const datatype = datatypeFn();
        if (!datatype || control.value === '' || !control.value) {
            return null;
        }
        if (datatype === `${XSD}anyURI`) {
            return regex.test(control.value) ? null : {'datatype': true};
        }
        const lit = rdf.literal(control.value, datatype);
        return !validateTerm(lit) ? {'datatype': true} : null;
    };
}
