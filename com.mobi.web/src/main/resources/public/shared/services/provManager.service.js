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

    provManagerService.$inject = ['$http', '$q', 'REST_PREFIX', 'utilService', 'prefixes', 'httpService'];

    function provManagerService($http, $q, REST_PREFIX, utilService, prefixes, httpService) {
        var self = this,
            util = utilService,
            prefix = REST_PREFIX + 'provenance-data';

        /**
         * @ngdoc property
         * @name activityTypes
         * @propertyOf shared.service:provManagerService
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
         * @methodOf shared.service:provManagerService
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

    angular
        .module('shared')
        /**
         * @ngdoc service
         * @name shared.service:provManagerService
         * @requires $http
         * @requires $q
         * @requires shared.service:utilService
         * @requires shared.service:prefixes
         * @requires shared.service:httpService
         *
         * @description
         * `provManagerService` is a service that provides access to the Mobi Provenance REST endpoints and variables
         * to hold information about the different types of activities.
         */
        .service('provManagerService', provManagerService);
})();
