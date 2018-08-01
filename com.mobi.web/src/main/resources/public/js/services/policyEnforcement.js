/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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

    angular
        /**
         * @ngdoc overview
         * @name policyEnforcement
         *
         * @description
         * The `policyEnforcement` module only provides the `policyEnforcementService` service which
         * provides access to the Mobi Policy Enforcement REST endpoint.
         */
        .module('policyEnforcement', [])
        /**
         * @ngdoc service
         * @name policyEnforcement.service:policyEnforcementService
         * @requires prefixes.service:prefixes
         * @requires util.service:utilService
         * @requires httpService.service:httpService
         *
         * @description
         * `policyEnforcementService` is a service that provides access to the Mobi policy enforcement REST
         * endpoint.
         */
        .service('policyEnforcementService', policyEnforcementService);

        policyEnforcementService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'prefixes'];

        function policyEnforcementService($http, $q, REST_PREFIX, utilService, prefixes) {
            var self = this;
            var prefix = REST_PREFIX + 'policy-enforcement';
            var util = utilService;

            /**
             * @ngdoc method
             * @name evaluateRequest
             * @methodOf policyEnforcement.service:policyEnforcementService
             *
             * @description
             * Calls the POST /mobirest/policy-enforcement endpoint with the passed XACML parameters to be evaluated.
             *
             * @param {Object} [subjectAttrs=''] An optional Object of attributes for a subject
             * @param {string} [resourceId=''] An optional IRI string for a resourceId
             * @param {Object} [resourceAttrs=''] An optional Object of attributes for a resource
             * @param {string} [actionId=''] An optional IRI string for an actionId
             * @param {Object} [actionAttrs=''] An optional Object of attributes for an action
             * @return {Promise} A Promise that resolves to a string of the decision of the request or is rejected with
             * an error message
             */
            self.evaluateRequest = function(subjectAttrs = undefined, resourceId = undefined, resourceAttrs = undefined, actionId = undefined, actionAttrs = undefined) {
                var request = {
                    "subjectAttr": subjectAttrs,
                    "resourceId": resourceId,
                    "resourceAttrs": resourceAttrs,
                    "actionId": actionId,
                    "actionAttrs": actionAttrs
                };
                return $http.post(prefix, request)
                    .then(response => response.data, util.rejectError);
            }
        }
})();