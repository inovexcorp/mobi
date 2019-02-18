(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name recordPermissionsManager
         *
         * @description
         * The `recordPermissionsManager` module only provides the `recordPermissionsManagerService` service which
         * provides access to the Mobi record-permissions REST endpoints to get and update record permissions.
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
             * @methodOf recordPermissionsManager.service:recordPermissionsManagerService
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
})();
