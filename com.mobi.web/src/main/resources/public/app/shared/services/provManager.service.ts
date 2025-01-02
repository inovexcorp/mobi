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

import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ActivityPaginatedConfig } from '../models/activity-paginated-config';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { ActivityAction } from '../models/activityAction.interface';
import { handleError, paginatedConfigToHttpParams } from '../utility';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';

/**
 * @class shared.ProvManagerService
 *
 * A service that provides access to the Mobi Provenance REST endpoints and variables to hold information about the
 * different types of activities.
 */
@Injectable()
export class ProvManagerService {
    prefix = `${REST_PREFIX}provenance-data`;

    constructor(private http: HttpClient, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * `activityTypes` is an array of objects that represent the different subclasses of `prov:Activity`
     * that Mobi supports ordered such that subclasses are first. Each object contains the type IRI, the
     * associated active word, and associated predicate for linking to the affected `prov:Entity(s)`.
     * @type {ActivityAction[]}:
     */
    activityTypes: ActivityAction[] = [];

    initialize(): void {
        this.getActionWords().subscribe(result => {
            this.activityTypes = result;
        });
    }

    reset(): void {
        this.activityTypes = null;
    }

    /**
     * Makes a call to GET /mobirest/provenance-data to get a paginated list of `Activities` and their associated
     * `Entities`. Returns the paginated response for the query using the passed page index and limit and optional
     * entity IRI to filter on. The data of the response will be an object with the array of `activities` and the array
     * of associated `entities`, the "x-total-count" headers will contain the total number of `Activities` matching the
     * query, and the "link" header will contain the URLs for the next and previous page if present. Can be optionally
     * tracked elsewhere by providing `true` at the end of the arguments.
     *
     * @param {ActivityPaginatedConfig} paginatedConfig A configuration object for paginated requests on activities.
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An observable that either resolves with the response of the endpoint or is rejected with an
     * error message
     */
    getActivities(paginatedConfig: ActivityPaginatedConfig, isTracked = false): 
      Observable<HttpResponse<{activities: JSONLDObject[], entities: JSONLDObject[]}>> {
        let params = paginatedConfigToHttpParams(paginatedConfig);
        if (paginatedConfig.entity) {
            params = params.set('entity', paginatedConfig.entity);
        }
        if (paginatedConfig.agent) {
            params = params.set('agent', paginatedConfig.agent);
        }
        const request = this.http.get<{activities: JSONLDObject[], entities: JSONLDObject[]}>(this.prefix, 
            {params, observe: 'response'});
        return this.spinnerSvc.trackedRequest(request, isTracked)
            .pipe(catchError(handleError));
    }

    getActionWords(isTracked = false): Observable<ActivityAction[]> {
        return this.spinnerSvc.trackedRequest(this.http.get<ActivityAction[]>(`${this.prefix}/actions`), isTracked)
            .pipe(catchError(handleError));
    }
}
