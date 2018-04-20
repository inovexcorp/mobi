(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name mergeRequestManager
         *
         * @description
         */
        .module('mergeRequestManager', [])
        /**
         * @ngdoc service
         * @name mergeRequestManager.service:mergeRequestManagerService
         *
         * @description
         */
        .service('mergeRequestManagerService', mergeRequestManagerService);

        mergeRequestManagerService.$inject = ['$http', '$q', 'utilService', 'REST_PREFIX'];

        function mergeRequestManagerService($http, $q, utilService, REST_PREFIX) {
            var self = this,
                prefix = REST_PREFIX + 'merge-requests';

            self.getRequests = function(params) {
                var config = {params};
                return $http.get(prefix, config)
                    .then(response => response.data, util.rejectError);
            }
        }
})();
