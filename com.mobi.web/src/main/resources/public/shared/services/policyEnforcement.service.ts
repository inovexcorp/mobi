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
import { pick } from 'lodash';

policyEnforcementService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'httpService'];

/**
 * @ngdoc service
 * @name shared.service:policyEnforcementService
 * @requires shared.service:prefixes
 * @requires shared.service:utilService
 * @requires shared.service:httpService
 *
 * @description
 * `policyEnforcementService` is a service that provides access to the Mobi policy enforcement REST
 * endpoint.
 */
function policyEnforcementService($http, $q, REST_PREFIX, utilService, httpService) {
    const self = this;
    const prefix = REST_PREFIX + 'pep';
    const util = utilService;

    self.permit = 'Permit';
    self.deny = 'Deny';
    self.indeterminate = 'Indeterminate';

    /**
     * @ngdoc method
     * @name evaluateRequest
     * @methodOf shared.service:policyEnforcementService
     *
     * @description
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
     * @param {Object} [jsonRequest] An Object of ids and attributes to create a XACML request
     * @return {Promise} A Promise that resolves to a string of the decision of the request or is rejected with
     * an error message
     */
    self.evaluateRequest = function(jsonRequest, id = '') {
        const filteredRequest = pick(jsonRequest, ['resourceId', 'actionId', 'actionAttrs', 'resourceAttrs', 'subjectAttrs']);
        const promise = id ? httpService.post(prefix, filteredRequest, id) : $http.post(prefix, filteredRequest);
        return promise.then(response => response.data, util.rejectError);
    };

    /**
     * @ngdoc method
     * @name evaluateMultiDecisionRequest
     * @methodOf shared.service:policyEnforcementService
     *
     * @description
     * Calls the POST /mobirest/pep/multiDecisionRequest endpoint with the passed XACML parameters to be evaluated.
     * Resource ID and Action ID must be passed as arrays of strings. May have multiple XACML response objects.
     * The response data is returned as an array of objects.
     * Example JSON object:
     * {
     *      "resourceId": ["https://mobi.com/records#111a111b-00ee-410a-832f-f67c5c10b33d"],
     *      "actionId": ["http://mobi.com/ontologies/policy#Delete"]
     * }
     *
     * @param {Object} [jsonRequest] An Object of ids and attributes to create a XACML request
     * @return {Promise} A Promise that resolves to an array of xacml responses of the request or is rejected with
     * an error message
     */
    self.evaluateMultiDecisionRequest = function(jsonRequest, id = '') {
        const filteredRequest = pick(jsonRequest, ['resourceId', 'actionId', 'actionAttrs', 'resourceAttrs', 'subjectAttrs']);
        const promise = id ? httpService.post(prefix + '/multiDecisionRequest', filteredRequest, id) : $http.post(prefix + '/multiDecisionRequest', filteredRequest);
        return promise.then(response => response.data, util.rejectError);
    };
}

export default policyEnforcementService;
