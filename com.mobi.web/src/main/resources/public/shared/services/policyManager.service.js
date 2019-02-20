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

    policyManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'prefixes'];

    function policyManagerService($http, $q, REST_PREFIX, utilService, prefixes) {
        var self = this;
        var prefix = REST_PREFIX + 'policies';
        var util = utilService;

        // Common IRIs used in policies

        self.actionCreate = prefixes.policy + 'Create';
        self.actionRead = prefixes.policy + 'Read';
        self.actionUpdate = prefixes.policy + 'Update';
        self.actionDelete = prefixes.policy + 'Delete';
        self.actionModify = prefixes.catalog + 'Modify';
        self.subjectId = 'urn:oasis:names:tc:xacml:1.0:subject:subject-id';
        self.resourceId = 'urn:oasis:names:tc:xacml:1.0:resource:resource-id';
        self.actionId = 'urn:oasis:names:tc:xacml:1.0:action:action-id';
        self.subjectCategory = 'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject';
        self.resourceCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:resource';
        self.actionCategory = 'urn:oasis:names:tc:xacml:3.0:attribute-category:action';
        self.stringEqual = 'urn:oasis:names:tc:xacml:1.0:function:string-equal';

        /**
         * @ngdoc method
         * @name getPolicies
         * @methodOf shared.service:policyManagerService
         *
         * @description
         * Calls the GET /mobirest/policies endpoint with the passed filter values for
         * http://mobi.com/ontologies/policy#relatedResource, http://mobi.com/ontologies/policy#relatedSubject, and
         * http://mobi.com/ontologies/policy#relatedAction and returns the list of matching Policies in JSON.
         *
         * @param {string} [relatedResource=''] An optional IRI string for a related Resource
         * @param {string} [relatedSubject=''] An optional IRI string for a related Subject
         * @param {string} [relatedAction=''] An optional IRI string for a related Action
         * @return {Promise} A Promise that resolves to a JSON array of Policy JSON objects or is rejected with
         * an error message
         */
        self.getPolicies = function(relatedResource = undefined, relatedSubject = undefined, relatedAction = undefined) {
            var config = {
                params: {
                    relatedResource,
                    relatedSubject,
                    relatedAction
                }
            };
            return $http.get(prefix, config)
                .then(response => response.data, util.rejectError);
        }

        /**
         * @ngdoc method
         * @name getPolicy
         * @methodOf shared.service:policyManagerService
         *
         * @description
         * Calls the GET /mobirest/policies/{policyId} endpoint to get the Policy for the provided ID.
         *
         * @param {string} policyId The ID of a Policy to retrieve
         * @return {Promise} A Promise that resolves with the matching Policy if found or is rejected with an
         * error message
         */
        self.getPolicy = function(policyId) {
            return $http.get(prefix + '/' + encodeURIComponent(policyId))
                .then(response => response.data, util.rejectError);
        }

        /**
         * @ngdoc method
         * @name updatePolicy
         * @methodOf shared.service:policyManagerService
         *
         * @description
         * Calls the PUT /mobirest/policies/{policyId} endpoint with the provided new Policy object and updates
         * the Policy with the matching ID.
         *
         * @param {Object} newPolicy A Policy JSON object to replace the original with
         * @return {Promise} A Promise that resolves if the update was successful or is rejected with an error
         * message
         */
        self.updatePolicy = function(newPolicy) {
            return $http.put(prefix + '/' + encodeURIComponent(newPolicy.PolicyId), newPolicy)
                .then(_.noop, util.rejectError);
        }
    }

    angular
        .module('shared')
        /**
         * @ngdoc service
         * @name shared.service:policyManagerService
         * @requires shared.service:prefixes
         * @requires shared.service:utilService
         * @requires shared.service:httpService
         *
         * @description
         * `policyManagerService` is a service that provides access to the Mobi policy REST
         * endpoints and variables with common IRIs used in policies.
         */
        .service('policyManagerService', policyManagerService);
})();
