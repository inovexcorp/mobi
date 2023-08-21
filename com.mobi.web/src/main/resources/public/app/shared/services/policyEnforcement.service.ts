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
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { pick } from 'lodash';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { XACMLDecision } from '../models/XACMLDecision.interface';
import { XACMLRequest } from '../models/XACMLRequest.interface';
import { handleError } from '../utility';

/**
 * @class shared.PolicyEnforcementService
 *
 * A service that provides access to the Mobi policy enforcement REST endpoint.
 */
@Injectable()
export class PolicyEnforcementService {
    prefix = `${REST_PREFIX}pep`;
    permit = 'Permit';
    deny = 'Deny';
    indeterminate = 'Indeterminate';

    constructor(private http: HttpClient, private spinnerSrv: ProgressSpinnerService) {}

    /**
     * Calls the POST /mobirest/pep endpoint with the passed XACML parameters to be evaluated.
     * Example JSON object:
     * {
     *     "resourceId": "http://mobi.com/catalog-local",
     *     "actionId": "http://mobi.com/ontologies/policy#Create",
     *     "actionAttrs": {
     *         "http://www.w3.org/1999/02/22-rdf-syntax-ns#type":"http://mobi.com/ontologies/ontology-editor#OntologyRecord"
     *     }
     * }
     *
     * @param {XACMLRequest} [jsonRequest] An Object of ids and attributes to create a XACML request
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An Observable that resolves to a string of the decision of the request or is rejected with
     * an error message
     */
    evaluateRequest(jsonRequest: XACMLRequest, isTracked = false): Observable<string> {
        const filteredRequest = pick(jsonRequest, ['resourceId', 'actionId', 'actionAttrs', 'resourceAttrs', 'subjectAttrs']);
        return this._trackedRequest(this.http.post(this.prefix, filteredRequest, {responseType: 'text'}), isTracked)
            .pipe(catchError(handleError));
    }

    /**
     * Calls the POST /mobirest/pep/multiDecisionRequest endpoint with the passed XACML parameters to be evaluated.
     * Resource ID and Action ID must be passed as arrays of strings. May have multiple XACML response objects.
     * The response data is returned as an array of objects.
     * Example JSON object:
     * {
     *      "resourceId": ["https://mobi.com/records#111a111b-00ee-410a-832f-f67c5c10b33d"],
     *      "actionId": ["http://mobi.com/ontologies/policy#Delete"]
     * }
     *
     * @param {XACMLRequest} [jsonRequest] An Object of ids and attributes to create a XACML request
     * @param {boolean} isTracked Whether the request should be tracked by the {@link shared.ProgressSpinnerService}
     * @return {Observable} An Observable that resolves to an array of xacml responses of the request or is rejected with
     * an error message
     */
    evaluateMultiDecisionRequest(jsonRequest: XACMLRequest, isTracked = false): Observable<XACMLDecision[]> {
        const filteredRequest = pick(jsonRequest, ['resourceId', 'actionId', 'actionAttrs', 'resourceAttrs', 'subjectAttrs']);
        return this._trackedRequest(this.http.post<XACMLDecision[]>(`${this.prefix}/multiDecisionRequest`, filteredRequest), isTracked)
            .pipe(catchError(handleError));
    }

    private _trackedRequest<T>(request: Observable<T>, tracked: boolean): Observable<T> {
        if (tracked) {
            return request;
        } else {
            return this.spinnerSrv.track(request);
        }
    }
}
