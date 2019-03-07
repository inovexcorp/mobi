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

    recordPermissionsManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService'];

    /**
     * @ngdoc service
     * @name shared.service:recordPermissionsManagerService
     * @requires shared.service:httpService
     *
     * @description
     * `recordPermissionsManagerService` is a service that provides access to the Mobi policy REST
     * endpoints and variables with common IRIs used in policies.
     */
    function recordPermissionsManagerService($http, $q, REST_PREFIX, utilService) {
        var self = this;
        var prefix = REST_PREFIX + 'record-permissions';
        var util = utilService;

        /**
         * @ngdoc method
         * @name getRecordPolicy
         * @methodOf shared.service:recordPermissionsManagerService
         *
         * @description
         * Calls the GET /mobirest/record-permissions/{recordId} endpoint to get the Record Policy JSON
         * representation of users who are permitted to perform each action (read, delete, update, modify,
         * modifyMaster)  for the provided ID.
         *
         * @param {string} recordId The ID of a Record whose Record Policy JSON to retrieve
         * @return {Promise} A Promise that resolves with the matching Record Policy JSON if found or is rejected
         * with an error message
         */
        self.getRecordPolicy = function(recordId) {
            return $http.get(prefix + '/' + encodeURIComponent(recordId))
                .then(response => response.data, util.rejectError);
        }

        /**
         * @ngdoc method
         * @name updateRecordPolicy
         * @methodOf shared.service:recordPermissionsManagerService
         *
         * @description
         * Calls the PUT /mobirest/record-permissions/{recordId} endpoint with the provided new Policy object and updates
         * the Policy with the associated recordId.
         *
         * @param {string} recordId The ID of a Record whose Record Policy JSON to update
         * @param {Object} newPolicy A Policy JSON object to replace the original with
         * @return {Promise} A Promise that resolves if the update was successful or is rejected with an error
         * message
         */
        self.updateRecordPolicy = function(recordId, newPolicy) {
            return $http.put(prefix + '/' + encodeURIComponent(recordId), newPolicy)
                .then(_.noop, util.rejectError);
        }
    }

    angular.module('shared')
        .service('recordPermissionsManagerService', recordPermissionsManagerService);
})();
