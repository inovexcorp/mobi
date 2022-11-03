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
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { REST_PREFIX } from '../../constants';
import { CATALOG, POLICY } from '../../prefixes';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UtilService } from './util.service';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';

/**
 * @class shared.PolicyManagerService
 *
 * A service that provides access to the Mobi policy REST endpoints and variables with common IRIs used in policies.
 */
@Injectable()
export class PolicyManagerService {
    prefix = REST_PREFIX + 'policies';

    // Common IRIs used in policies
    actionCreate = POLICY + 'Create';
    actionRead = POLICY + 'Read';
    actionUpdate = POLICY + 'Update';
    actionDelete = POLICY + 'Delete';
    actionModify = CATALOG + 'Modify';
    subjectId = 'urn:oasis:names:tc:xacml:1.0:subject:subject-id';
    resourceId = 'urn:oasis:names:tc:xacml:1.0:resource:resource-id';
    actionId = 'urn:oasis:names:tc:xacml:1.0:action:action-id';
    subjectCategory = 'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject';
    resourceCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:resource';
    actionCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:action';
    stringEqual = 'urn:oasis:names:tc:xacml:1.0:function:string-equal';

    constructor(private http: HttpClient, private util: UtilService, private spinnerSvc: ProgressSpinnerService) {}

    /**
     * Calls the GET /mobirest/policies endpoint with the passed filter values for
     * http://mobi.com/ontologies/policy#relatedResource, http://mobi.com/ontologies/policy#relatedSubject,
     * http://mobi.com/ontologies/policy#relatedAction, and `systemOnly` and returns the list of matching Policies in
     * JSON-ified XML.
     *
     * @param {string} [relatedResource=''] An optional IRI string for a related Resource
     * @param {string} [relatedSubject=''] An optional IRI string for a related Subject
     * @param {string} [relatedAction=''] An optional IRI string for a related Action
     * @param {boolean} [onlySystem=false] An optional boolean which will only retrieve system policies if tru
     * @returns {Observable} An Observable that resolves to a JSON array of Policy JSON objects or is rejected with
     * an error message
     */
    getPolicies(relatedResource?: string, relatedSubject?: string, relatedAction?: string, systemOnly = false): Observable<any[]> {
        const config = {
            params: this.util.createHttpParams({
                relatedResource,
                relatedSubject,
                relatedAction,
                systemOnly
            })
        };
        return this.spinnerSvc.track(this.http.get(this.prefix, config))
            .pipe(catchError(this.util.handleError));
    }

    /**
     * Calls the GET /mobirest/policies/{policyId} endpoint to get the Policy for the provided ID.
     *
     * @param {string} policyId The ID of a Policy to retrieve
     * @returns {Observable} An Observable that resolves with the matching Policy if found or is rejected with an
     * error message
     */
    getPolicy(policyId: string): Observable<any> {
        return this.spinnerSvc.track(this.http.get(this.prefix + '/' + encodeURIComponent(policyId)))
            .pipe(catchError(this.util.handleError));
    }

    /**
     * Calls the PUT /mobirest/policies/{policyId} endpoint with the provided new Policy object and updates
     * the Policy with the matching ID.
     *
     * @param {Object} newPolicy A Policy JSON object to replace the original with
     * @returns {Observable} An Observable that resolves if the update was successful or is rejected with an error
     * message
     */
    updatePolicy(newPolicy: any): Observable<null> {
        return this.spinnerSvc.track(this.http.put(this.prefix + '/' + encodeURIComponent(newPolicy.PolicyId), newPolicy, {responseType: 'text'}))
            .pipe(catchError(this.util.handleError));
    }
}
