(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name provManager
         *
         * @description
         * The `provManager` module only provides the `provManagerService` service which provides access to the
         * Mobi Provenance REST endpoints.
         */
        .module('provManager', [])
        /**
         * @ngdoc service
         * @name provManager.service:provManagerService
         * @requires $http
         * @requires $q
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         * @requires httpService.service:httpService
         *
         * @description
         * `provManagerService` is a service that provides access to the Mobi Provenance REST endpoints and variables
         * to hold information about the different types of activities.
         */
        .service('provManagerService', provManagerService);

        provManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'prefixes', 'httpService'];

        function provManagerService($http, $q, REST_PREFIX, utilService, prefixes, httpService) {
            var self = this,
                util = utilService,
                prefix = REST_PREFIX + 'provenance-data';

            /**
             * @ngdoc property
             * @name activityTypes
             * @propertyOf provManager.service:provManagerService
             * @type {Object[]}
             *
             * @description
             * `activityTypes` is an array of objects that represent the different subclasses of `prov:Activity`
             * that Mobi supports ordered such that subclasses are first. Each object contains the type IRI, the
             * associated active word, and associated predicate for linking to the affected `prov:Entity(s)`.
             */
            self.activityTypes = [
                {
                    type: prefixes.matprov + 'CreateActivity',
                    word: 'created',
                    pred: prefixes.prov + 'generated'
                },
                {
                    type: prefixes.matprov + 'UpdateActivity',
                    word: 'updated',
                    pred: prefixes.prov + 'used'
                },
                {
                    type: prefixes.matprov + 'UseActivity',
                    word: 'used',
                    pred: prefixes.prov + 'used'
                },
                {
                    type: prefixes.matprov + 'DeleteActivity',
                    word: 'deleted',
                    pred: prefixes.prov + 'invalidated'
                }
            ];

            /**
             * @ngdoc method
             * @name getActivities
             * @methodOf provManager.service:provManagerService
             *
             * @description
             * Makes a call to GET /mobirest/provenance-data to get a paginated list of `Activities` and their associated
             * `Entities`. Returns the paginated response for the query using the passed page index and limit. The
             * data of the response will be an object with the array of `Activities` and the array of associated
             * `Entities`, the "x-total-count" headers will contain the total number of `Activities` matching the
             * query, and the "link" header will contain the URLs for the next and previous page if present. Can
             * optionally be a cancel-able request by passing a request id.
             *
             * @param {Object} paginatedConfig A configuration object for paginated requests
             * @param {number} paginatedConfig.limit The number of results per page
             * @param {number} paginatedConfig.pageIndex The index of the page of results to retrieve
             * @param {string} [id=''] The identifier for this request
             * @return {Promise} A promise that either resolves with the response of the endpoint or is rejected with an
             * error message
             */
            self.getActivities = function(paginatedConfig, id = '') {
                var config = { params: util.paginatedConfigToParams(paginatedConfig) };
                var promise = id ? httpService.get(prefix, config, id) : $http.get(prefix, config);
                return promise.then($q.when, util.rejectError);
            }
        }
})();
