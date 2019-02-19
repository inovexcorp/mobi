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

    datasetStateService.$inject = ['datasetManagerService', 'utilService', 'prefixes', '$q'];

    function datasetStateService(datasetManagerService, utilService, prefixes, $q) {
        var self = this;
        var dm = datasetManagerService;
        var util = utilService;
        var cachedOntologyRecords = [];
        /**
         * @ngdoc property
         * @name paginationConfig
         * @propertyOf datasetState.service:datasetStateService
         * @type {Object}
         *
         * @description
         * `pageIndex` holds the configuration to be used when retrieving the results of a
         * Dataset Records query. These configurations are the limit, page index, search text,
         * and sort option. The limit and sortOption are not to be changed for now.
         */
        self.paginationConfig = {
            limit: 10,
            pageIndex: 0,
            searchText: '',
            sortOption: {
                field: prefixes.dcterms + 'title',
                asc: true
            }
        };
        /**
         * @ngdoc property
         * @name links
         * @propertyOf datasetState.service:datasetStateService
         * @type {Object}
         *
         * @description
         * `links` holds the URLs for the next and previous pages of results for the current paginated
         * results list.
         */
        self.links = {
            prev: '',
            next: ''
        };
        /**
         * @ngdoc property
         * @name totalSize
         * @propertyOf datasetState.service:datasetStateService
         * @type {number}
         *
         * @description
         * `totalSize` holds an integer for the total number of results for the current paginated
         * results list.
         */
        self.totalSize = 0;
        /**
         * @ngdoc property
         * @name results
         * @propertyOf datasetState.service:datasetStateService
         * @type {Object[]}
         *
         * @description
         * `results` holds an array of Objects representing the results for the current page of the
         * current paginated results list.
         */
        self.results = [];
        /**
         * @ngdoc property
         * @name openedDatasetId
         * @propertyOf datasetState.service:datasetStateService
         * @type {string}
         *
         * @description
         * `openedDatasetId` holds the id of the dataset which is currently open.
         */
        self.openedDatasetId = '';

        /**
         * @ngdoc method
         * @name reset
         * @methodOf datasetState.service:datasetStateService
         *
         * @description
         * Resets all state variables.
         */
        self.reset = function() {
            self.resetPagination();
        }
        /**
         * @ngdoc method
         * @name setResults
         * @methodOf datasetState.service:datasetStateService
         *
         * @description
         * Calls the appropriate {@link datasetManager.service:datasetManagerService datasetManagerService}
         * method to retrieve results of a Dataset Records query depending on whether or not a URL is passed
         * in. The passed URL is assumed to be from the `links` of a previous query.
         *
         * @param {string=''} url The URL to be used to retrieve Dataset Record results if desired
         */
        self.setResults = function(url = '') {
            var promise = url ? util.getResultsPage(url) : dm.getDatasetRecords(self.paginationConfig);
            promise.then(self.setPagination, util.createErrorToast);
        }
        /**
         * @ngdoc method
         * @name resetPagination
         * @methodOf datasetState.service:datasetStateService
         *
         * @description
         * Resets all the pagination related variables.
         */
        self.resetPagination = function() {
            self.paginationConfig.pageIndex = 0;
            self.links = {
                prev: '',
                next: ''
            };
            self.totalSize = 0;
            self.results = [];
        }
        /**
         * @ngdoc method
         * @name setPagination
         * @methodOf datasetState.service:datasetStateService
         *
         * @description
         * Sets the pagination state variables based on the information in the passed response from
         * an HTTP call.
         *
         * @param {Object} response A response from a paginated HTTP call
         */
        self.setPagination = function(response) {
            self.results = _.map(response.data, arr => dm.splitDatasetArray(arr));
            var headers = response.headers();
            self.totalSize = _.get(headers, 'x-total-count', 0);
            var links = util.parseLinks(_.get(headers, 'link', ''));
            self.links.prev = _.get(links, 'prev', '');
            self.links.next = _.get(links, 'next', '');
            self.openedDatasetId = '';
        }
    }

    angular
        .module('shared')
        /**
         * @ngdoc service
         * @name datasetState.service:datasetStateService
         * @requires datasetManager.service:datasetManagerService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `datasetStateService` is a service which contains various variables to hold the
         * state of the catalog page and utility functions to update those variables.
         */
        .service('datasetStateService', datasetStateService);
})();
