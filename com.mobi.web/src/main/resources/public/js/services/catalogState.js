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
         * The `catalogState` module only provides the `catalogStateService` service which contains various variables to
         * hold the state of the {@link catalog.component:catalogPage} and utility functions to update those
         * variables.
         */
        .module('catalogState', [])
        /**
         * @ngdoc service
         * @name catalogState.service:catalogStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `catalogStateService` is a service which contains various variables to hold the state of the
         * {@link catalog.component:catalogPage} and utility functions to update those variables.
         */
        .service('catalogStateService', catalogStateService);

        catalogStateService.$inject = ['catalogManagerService', 'prefixes'];

        function catalogStateService(catalogManagerService, prefixes) {
            var self = this;
            var cm = catalogManagerService;

            /**
             * @ngdoc property
             * @name totalRecordSize
             * @propertyOf catalogState.service:catalogStateService
             * @type {number}
             *
             * @description
             * `totalRecordSize` holds an integer for the total number of catalog Records in the latest query on the
             * {@link catalog.component:recordsView}.
             */
            self.totalRecordSize = 0;
            /**
             * @ngdoc property
             * @name currentRecordPage
             * @propertyOf catalogState.service:catalogStateService
             * @type {number}
             *
             * @description
             * `currentRecordPage` holds an 1 based index indicating which page of catalog Records should be displayed
             * in the {@link catalog.component:recordsView}.
             */
            self.currentRecordPage = 1;
            /**
             * @ngdoc property
             * @name recordLimit
             * @propertyOf catalogState.service:catalogStateService
             * @type {number}
             *
             * @description
             * `recordLimit` holds an integer representing the maximum number of catalog Records to be shown in a page
             * in the {@link catalog.component:recordsView}.
             */
            self.recordLimit = 10;
            /**
             * @ngdoc property
             * @name recordSortOption
             * @propertyOf catalogState.service:catalogStateService
             * @type {Object}
             *
             * @description
             * `recordSortOption` holds one of the options from the `sortOptions` in the
             * {@link catalogManager.service:catalogManagerService} to be used when sorting the catalog Records in the
             * {@link catalog.component:recordsView}.
             */
            self.recordSortOption = undefined;
            /**
             * @ngdoc property
             * @name recordFilterType
             * @propertyOf catalogState.service:catalogStateService
             * @type {string}
             *
             * @description
             * `recordFilterType` holds the IRI of a catalog Record type to be used to filter the results in the
             * {@link catalog.component:recordsView}.
             */
            self.recordFilterType = '';
            /**
             * @ngdoc property
             * @name recordSearchText
             * @propertyOf catalogState.service:catalogStateService
             * @type {string}
             *
             * @description
             * `recordSearchText` holds a search text to be used when retrieving catalog Records in the
             * {@link catalog.component:recordsView}.
             */
            self.recordSearchText = '';
            /**
             * @ngdoc property
             * @name selectedRecord
             * @propertyOf catalogState.service:catalogStateService
             * @type {Object}
             *
             * @description
             * `selectedRecord` holds the currently selected catalog Record object that is being viewed in the
             * {@link catalog.component:catalogPage}.
             */
            self.selectedRecord = undefined;
            /**
             * @ngdoc property
             * @name recordIcons
             * @propertyOf catalogState.service:catalogStateService
             * @type {Object}
             *
             * @description
             * `recordIcons` holds each recognized Record type as keys and values of Font Awesome class names to
             * represent the record types.
             */
            self.recordIcons = {
                [prefixes.ontologyEditor + 'OntologyRecord']: 'fa-sitemap',
                [prefixes.dataset + 'DatasetRecord']: 'fa-database',
                [prefixes.delim + 'MappingRecord']: 'fa-map',
                default: 'fa-book'
            };

            /**
             * @ngdoc method
             * @name initialize
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Initializes state variables for the {@link catalog.component:catalogPage} using information retrieved
             * from {@link catalogManager.service:catalogManagerService catalogManagerService}.
             */
            self.initialize = function() {
                self.recordSortOption = _.find(cm.sortOptions, {field: prefixes.dcterms + 'modified', asc: false});
            }
            /**
             * @ngdoc method
             * @name getRecordIcon
             * @methodOf catalogState.service:catalogStateService
             *
             * @description
             * Returns a Font Awesome icon class representing the type of the provided catalog Record object. If the
             * record is not a type that has a specific icon, a generic icon class is returned.
             * 
             * @return {string} A Font Awesome class string
             */
            self.getRecordIcon = function(record) {
                var type = _.find(_.keys(self.recordIcons), type => _.includes(_.get(record, '@type', []), type));
                return self.recordIcons[type || 'default'];
            }
        }
})();
