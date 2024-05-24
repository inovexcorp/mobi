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

import { HttpClient } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { REST_PREFIX } from '../../constants';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { Option } from '../models/option.class';

/**
 * @class shacl-forms.SHACLFormManagerService
 *
 * A service that provides access to the Mobi Web Forms REST endpoints.
 */
@Injectable()
export class SHACLFormManagerService {
    prefix = `${REST_PREFIX}web-forms`;

    // TODO: At some point change this to indicate what form the field was changed in. Otherwise a field changed in a different form could wipe a field another form on the same page. No use cases for this right now though
    fieldUpdated = new EventEmitter<string>();

    constructor(private http: HttpClient) {}

    /**
     * Calls the POST /mobirest/web-forms/options endpoint with the passed property shape and focus node and
     * retrieves the autocomplete options that should be displayed for the associated web form . Returns an Observable 
     * with an array of options that should be displayed
     * 
     * @param {JSONLDObject[]} propertyShape JSON-LD representation of the property shape required for fetching
     * autocomplete options.
     * @param {JSONLDObject[]} focusNode JSON-LD representation of the focus node used to determine autocomplete options
     * 
     * @returns {Observable<string>} An Observable that resolves to a list of options that should be displayed as part * of the autocomplete dropdown
     */
    getAutocompleteOptions(propertyShape: JSONLDObject[], focusNode: JSONLDObject[] = undefined): Observable<Option[]> {
        const fd = new FormData();
        fd.append('propertyShape', JSON.stringify(propertyShape));
        if (focusNode) {
            fd.append('focusNode', JSON.stringify(focusNode));
        }
        return this.http.post<Option[]>(`${this.prefix}/options`, fd);
    }
}