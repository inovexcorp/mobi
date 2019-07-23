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
(function() {
    'use strict';

    policyEnforcementService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService'];

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
    function policyEnforcementService($http, $q, REST_PREFIX, utilService) {
        var self = this;
        var prefix = REST_PREFIX + 'pep';
        var util = utilService;

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
        self.evaluateRequest = function(jsonRequest) {
            var filteredRequest = _.pick(jsonRequest, ['resourceId', 'actionId', 'actionAttrs', 'resourceAttrs', 'subjectAttrs']);
            return $http.post(prefix, filteredRequest)
                .then(response => response.data, util.rejectError);
        }
    }

    angular.module('shared')
        .service('policyEnforcementService', policyEnforcementService);
})();