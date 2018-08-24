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
         * @name catalogState
         *
         * @description
         * The `catalogState` module only provides the `catalogStateService` service which contains
         * various variables to hold the state of the catalog page and utility functions to update
         * those variables.
         */
        .module('catalogState', [])
        /**
         * @ngdoc service
         * @name catalogState.service:catalogStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         *
         * @description
         * `catalogStateService` is a service which contains various variables to hold the
         * state of the catalog page and utility functions to update those variables.
         */
        .service('catalogStateService', catalogStateService);

        catalogStateService.$inject = ['catalogManagerService', 'utilService'];

        function catalogStateService(catalogManagerService, utilService) {
            var self = this;
            var cm = catalogManagerService;
            var util = utilService;

            /**
             * @ngdoc property
             * @name catalogState.service:catalogStateService#catalogs
             * @propertyOf catalogState.service:catalogStateService
             * @type {Object}
             *
             * @description
             * `catalogs` holds the current state for each catalog, local and distributed, of Mobi.
             * Each state contains a "show" boolean indicating whether it is currently being shown, the
             * full "catalog" object from the {@link catalogManager.service:catalogManagerService catalogManagerService},
             * the "openedPath" indicating which entity in the catalog is currently opened, and key-value
             * pairs for each paginated list of entities that can be shown within the catalog.
             */
            self.catalogs = {
                local: {
                    show: true,
                    catalog: undefined,
                    openedPath: [],
                    records: {
                        recordType: '',
                        sortOption: undefined,
                        searchText: '',
                        limit: 10
                    },
                    branches: {
                        sortOption: undefined,
                        limit: 10
                    }
                },
                distributed: {
                    show: false,
                    catalog: undefined,
                    openedPath: [],
                    records: {
                        recordType: '',
                        sortOption: undefined,
                        searchText: '',
                        limit: 10
                    }
                }
            };
            /**
             * @ngdoc property
             * @name catalogState.service:catalogStateService#currentPage
             * @propertyOf catalogState.service:catalogStateService
             * @type {number}
             *
             * @description
             * `currentPage` holds an 1 based index indicating which page of results for the current paginated
             * results list should be shown.
             */
            self.currentPage = 1;
            /**
             * @ngdoc property
             * @name catalogState.service:catalogStateService#links
             * @propertyOf catalogState.service:catalogStateService
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
             * @name catalogState.service:catalogStateService#totalSize
             * @propertyOf catalogState.service:catalogStateService
             * @type {number}
             *
             * @description
             * `totalSize` holds an integer for the total number of results for the current paginated
             * results list.
             */
            self.totalSize = 0;
            /**
             * @ngdoc property
             * @name catalogState.service:catalogStateService#results
             * @propertyOf catalogState.service:catalogStateService
             * @type {Object[]}
             *
             * @description
             * `results` holds an array of Objects represneting the results for the current page of the
             * current paginated results list.
             */
            self.results = [];

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Initializes `catalogs` using information retrieved from
             * {@link catalogManager.service:catalogManagerService catalogManagerService}.
             */
            self.initialize = function() {
                self.catalogs.local.catalog = cm.localCatalog;
                self.catalogs.local.openedPath = [cm.localCatalog];
                self.catalogs.distributed.catalog = cm.distributedCatalog;
                self.catalogs.distributed.openedPath = [cm.distributedCatalog];
                self.resetSortOptions();
            }
            /**
             * @ngdoc method
             * @name catalogState.service:catalogStateService#reset
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Resets all the main state variables.
             */
            self.reset = function() {
                self.resetPagination();
                self.catalogs.local.openedPath = _.take(self.catalogs.local.openedPath);
                self.catalogs.distributed.openedPath = _.take(self.catalogs.distributed.openedPath);
                self.resetSortOptions();
            }
            /**
             * @ngdoc method
             * @name resetSortOptions
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Resets all selected sort options.
             */
            self.resetSortOptions = function() {
                _.forEach(
                    _.flatten(_.map(self.catalogs, catalog => _.filter(catalog, val => _.has(val, 'sortOption')))),
                    obj => obj.sortOption = _.head(cm.sortOptions)
                );
            }
            /**
             * @ngdoc method
             * @name catalogState.service:catalogStateService#resetPagination
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Resets all the pagination related variables.
             */
            self.resetPagination = function() {
                self.currentPage = 0;
                self.links = {
                    prev: '',
                    next: ''
                };
                self.totalSize = 0;
                self.results = [];
            }
            /**
             * @ngdoc method
             * @name catalogState.service:catalogStateService#setPagination
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Sets the pagination state variables based on the information in the passed response from
             * an HTTP call.
             *
             * @param {Object} response A response from a paginated HTTP call
             */
            self.setPagination = function(response) {
                self.results = response.data;
                var headers = response.headers();
                self.totalSize = _.get(headers, 'x-total-count', 0);
                var links = util.parseLinks(_.get(headers, 'link', ''));
                self.links.prev = _.get(links, 'prev', '');
                self.links.next = _.get(links, 'next', '');
            }
            /**
             * @ngdoc method
             * @name catalogState.service:catalogStateService#getCurrentCatalog
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Retrieves the catalog state object representing the catalog currently being shown.
             *
             * @return {Object} The catalog state object for the current catalog
             */
            self.getCurrentCatalog = function() {
                return _.find(self.catalogs, {show: true});
            }
        }
})();
