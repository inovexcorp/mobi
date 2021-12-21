/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { Inject, Pipe, PipeTransform } from '@angular/core';
import { cloneDeep, forOwn, includes, merge, replace } from 'lodash';
@Pipe({
    name: 'prefixation'
})
export class PrefixationPipe implements PipeTransform {

    constructor(@Inject('prefixes') private prefixes) {}

    public transform(iri: string, extraPrefixes={}): string {
        let result = cloneDeep(iri);
        if (typeof result === 'string') {
            forOwn(merge({}, this.prefixes, extraPrefixes), (namespace, prefix) => {
                if (includes(result, namespace)) {
                    result = replace(result, namespace, prefix + ':');
                    return;
                }
            });
        }
        return result;
    }
}