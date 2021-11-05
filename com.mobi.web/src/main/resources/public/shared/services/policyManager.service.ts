/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { noop } from 'lodash';

import { REST_PREFIX } from '../../constants';
import { HelperService } from './helper.service';

/**
 * @class shared.PolicyManagerService
 *
 * A service that provides access to the Mobi policy REST endpoints and variables with common IRIs used in policies.
 */
@Injectable()
export class PolicyManagerService {
    prefix = REST_PREFIX + 'policies';

    // Common IRIs used in policies
    actionCreate = this.prefixes.policy + 'Create';
    actionRead = this.prefixes.policy + 'Read';
    actionUpdate = this.prefixes.policy + 'Update';
    actionDelete = this.prefixes.policy + 'Delete';
    actionModify = this.prefixes.catalog + 'Modify';
    subjectId = 'urn:oasis:names:tc:xacml:1.0:subject:subject-id';
    resourceId = 'urn:oasis:names:tc:xacml:1.0:resource:resource-id';
    actionId = 'urn:oasis:names:tc:xacml:1.0:action:action-id';
    subjectCategory = 'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject';
    resourceCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:resource';
    actionCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:action';
    stringEqual = 'urn:oasis:names:tc:xacml:1.0:function:string-equal';

    constructor(private http: HttpClient, private helper: HelperService, @Inject('utilService') private util, 
        @Inject('prefixes') private prefixes) {}

    /**
     * Calls the GET /mobirest/policies endpoint with the passed filter values for
     * http://mobi.com/ontologies/policy#relatedResource, http://mobi.com/ontologies/policy#relatedSubject, and
     * http://mobi.com/ontologies/policy#relatedAction and returns the list of matching Policies in JSON.
     *
     * @param {string} [relatedResource=''] An optional IRI string for a related Resource
     * @param {string} [relatedSubject=''] An optional IRI string for a related Subject
     * @param {string} [relatedAction=''] An optional IRI string for a related Action
     * @returns {Promise} A Promise that resolves to a JSON array of Policy JSON objects or is rejected with
     * an error message
     */
    getPolicies(relatedResource?: string, relatedSubject?: string, relatedAction?: string): Promise<any> {
        const config = {
            params: this.helper.createHttpParams({
                relatedResource,
                relatedSubject,
                relatedAction
            })
        };
        return this.http.get(this.prefix, config)
            .toPromise()
            .then((response: any) => response, this.util.rejectError);
    }

    /**
     * Calls the GET /mobirest/policies/{policyId} endpoint to get the Policy for the provided ID.
     *
     * @param {string} policyId The ID of a Policy to retrieve
     * @returns {Promise} A Promise that resolves with the matching Policy if found or is rejected with an
     * error message
     */
    getPolicy(policyId: string): Promise<any> {
        return this.http.get(this.prefix + '/' + encodeURIComponent(policyId))
            .toPromise()
            .then((response: any) => response, this.util.rejectError);
    }

    /**
     * Calls the PUT /mobirest/policies/{policyId} endpoint with the provided new Policy object and updates
     * the Policy with the matching ID.
     *
     * @param {Object} newPolicy A Policy JSON object to replace the original with
     * @returns {Promise} A Promise that resolves if the update was successful or is rejected with an error
     * message
     */
    updatePolicy(newPolicy: any): Promise<void> {
        return this.http.put(this.prefix + '/' + encodeURIComponent(newPolicy.PolicyId), newPolicy)
            .toPromise()
            .then(noop, this.util.rejectError);
    }
}