/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { SplitIRI } from '../models/splitIRI.interface';

@Pipe({
    name: 'splitIRI'
})
export class SplitIRIPipe implements PipeTransform {
    public transform(iri: string): SplitIRI {
        return splitIRI(iri);
    }
}

export function splitIRI(iri: string): SplitIRI {
    if (iri && typeof iri !== 'object') {
        const hash = iri.indexOf('#');
        const slash = iri.lastIndexOf('/');
        const colon = iri.lastIndexOf(':');
        const index = Math.max(hash, slash, colon);

        return {
            begin: iri.substring(0, index),
            then: iri[index],
            end: iri.substring(index + 1)
        } as SplitIRI;
    } else {
        return {
            begin: '',
            then: '',
            end: ''
        } as SplitIRI;
    }
}
