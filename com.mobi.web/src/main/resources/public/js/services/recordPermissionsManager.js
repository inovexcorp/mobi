/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
         * @name recordPermissionsManager
         *
         * @description
         * The `recordPermissionsManager` module only provides the `recordPermissionsManagerService` service which
         * provides access to the Mobi policy REST endpoints and variables with common IRIs
         * used in policies.
         */
            .module('recordPermissionsManager', [])
            /**
             * @ngdoc service
             * @name recordPermissionsManager.service:recordPermissionsManagerService
             * @requires httpService.service:httpService
             *
             * @description
             * `recordPermissionsManagerService` is a service that provides access to the Mobi policy REST
             * endpoints and variables with common IRIs used in policies.
             */
            .service('recordPermissionsManagerService', recordPermissionsManagerService);

        recordPermissionsManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService'];

        function recordPermissionsManagerService($http, $q, REST_PREFIX, utilService) {
            var self = this;
            var prefix = REST_PREFIX + 'record-permissions';
            var util = utilService;

            /**
             * @ngdoc method
             * @name getRecordPolicy
             * @methodOf recordPermissionsManager.service:recordPermissionsManagerService
             *
             * @description
             * Calls the GET /mobirest/record-permissions/{policyId} endpoint to get the Record Policy JSON
             * representation of users who are permitted to perform each action (read, delete, update, modify,
             * modifyMaster)  for the provided ID.
             *
             * @param {string} policyId The ID of a Record Policy JSON to retrieve
             * @return {Promise} A Promise that resolves with the matching Record Policy JSON if found or is rejected
             * with an error message
             */
            self.getRecordPolicy = function(policyId) {
                return $http.get(prefix + '/' + encodeURIComponent(policyId))
                    .then(response => response.data, util.rejectError);
            }

            /**
             * @ngdoc method
             * @name updateRecordPolicy
             * @methodOf recordPermissionsManager.service:recordPermissionsManagerService
             *
             * @description
             * Calls the PUT /mobirest/record-permissions/{policyId} endpoint with the provided new Policy object and updates
             * the Policy with the matching ID.
             *
             * @param {Object} newPolicy A Policy JSON object to replace the original with
             * @return {Promise} A Promise that resolves if the update was successful or is rejected with an error
             * message
             */
            self.updateRecordPolicy = function(newPolicy) {
                return $http.put(prefix + '/' + encodeURIComponent(newPolicy.PolicyId), newPolicy)
                    .then(_.noop, util.rejectError);
            }
        }
})();
