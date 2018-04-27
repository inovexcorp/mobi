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
         * @name mergeRequestManager
         *
         * @description
         * The `mergeRequestManager` module only provides the `mergeRequestManagerService` service which
         * provides access to the Mobi merge-requests REST endpoints.
         */
        .module('mergeRequestManager', [])
        /**
         * @ngdoc service
         * @name mergeRequestManager.service:mergeRequestManagerService
         *
         * @description
         * `mergeRequestManagerService` is a service that provides access to the Mobi merge-requests REST
         * endpoints.
         */
        .service('mergeRequestManagerService', mergeRequestManagerService);

        mergeRequestManagerService.$inject = ['$http', '$q', 'utilService', 'REST_PREFIX'];

        function mergeRequestManagerService($http, $q, utilService, REST_PREFIX) {
            var self = this,
                prefix = REST_PREFIX + 'merge-requests';
            var util = utilService;

            /**
             * @ngdoc method
             * @name getRequests
             * @methodOf mergeRequestManager.service:mergeRequestManagerService
             *
             * @description
             * Calls the GET /mobirest/merge-requests endpoint with the provided object of query parameters
             * which retrieves a list of MergeRequests.
             *
             * @param {Object} params An object with all the query parameter settings for the REST call
             * @param {boolean} params.accepted Whether the list should be accepted MergeRequests or open ones
             * @param {string} params.sort A property to sort the results by
             * @param {boolean} params.ascending Whether the list should be sorted ascending or descending
             * @returns {Promise} A promise that resolves with the list of MergeRequests or rejects with an
             * error message.
             */
            self.getRequests = function(params) {
                var config = {params};
                return $http.get(prefix, config)
                    .then(response => response.data, util.rejectError);
            }
        }
})();
