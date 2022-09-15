/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { MATPROV, PROV } from '../../prefixes';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { UtilService } from './util.service';

/**
 * @class shared.ProvManagerService
 *
 * A service that provides access to the Mobi Provenance REST endpoints and variables to hold information about the
 * different types of activities.
 */
@Injectable()
export class ProvManagerService {
    prefix = REST_PREFIX + 'provenance-data';

    constructor(private http: HttpClient, private util: UtilService) {}

    /**
     * `activityTypes` is an array of objects that represent the different subclasses of `prov:Activity`
     * that Mobi supports ordered such that subclasses are first. Each object contains the type IRI, the
     * associated active word, and associated predicate for linking to the affected `prov:Entity(s)`.
     * @type {Object[]}
     */
    activityTypes = [
        {
            type: MATPROV + 'CreateActivity',
            word: 'created',
            pred: PROV + 'generated'
        },
        {
            type: MATPROV + 'UpdateActivity',
            word: 'updated',
            pred: PROV + 'used'
        },
        {
            type: MATPROV + 'UseActivity',
            word: 'used',
            pred: PROV + 'used'
        },
        {
            type: MATPROV + 'DeleteActivity',
            word: 'deleted',
            pred: PROV + 'invalidated'
        }
    ];

    /**
     * Makes a call to GET /mobirest/provenance-data to get a paginated list of `Activities` and their associated
     * `Entities`. Returns the paginated response for the query using the passed page index and limit. The
     * data of the response will be an object with the array of `Activities` and the array of associated
     * `Entities`, the "x-total-count" headers will contain the total number of `Activities` matching the
     * query, and the "link" header will contain the URLs for the next and previous page if present. Can
     * optionally be a cancel-able request by passing a request id.
     *
     * @param {PaginatedConfig} paginatedConfig A configuration object for paginated requests.
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getActivities(paginatedConfig: PaginatedConfig, isTracked = false): Observable<HttpResponse<{activities: any, entities: any}>> {
        const params = this.util.paginatedConfigToParams(paginatedConfig);
        return this.util.trackedRequest(this.http.get(this.prefix, {params: this.util.createHttpParams(params), observe: 'response'}), isTracked)
            .pipe(catchError(this.util.handleError));
    }
}