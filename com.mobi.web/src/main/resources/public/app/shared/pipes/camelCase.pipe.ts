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
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'camelCase'
})
export class CamelCasePipe implements PipeTransform {
    public transform(value: string, type?: string): string {
        let result = '';

        if (value && typeof value !== 'object') {
            let capitalize = false,
                whitespace = /\s/,
                alphaNumeric = /[a-zA-Z0-9]/,
                i = 0;

            while (i < value.length) {
                if (value[i].match(whitespace) !== null) {
                    capitalize = true;
                } else if (value[i].match(alphaNumeric) === null) {
                    // do nothing with non letters
                } else if( capitalize || (i === 0 && type === 'class')) {
                    result += value[i].toUpperCase();
                    capitalize = false;
                } else if (i === 0 && type !== 'class') {
                    result += value[0].toLowerCase();
                } else {
                    result += value[i];
                }
                i++;
            }
        }
        return result;
    }
}
