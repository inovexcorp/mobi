/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name searchForm
         *
         * @description
         * The `searchForm` module only provides the `searchForm` directive which creates
         * the search form within the Search page.
         */
        .module('searchForm', [])
        /**
         * @ngdoc directive
         * @name searchForm.directive:searchForm
         * @scope
         * @restrict E
         * @requires search.service:searchService
         * @requires discoverState.service:discoverStateService
         * @requires explore.service:exploreService
         * @requires util.service:utilService
         *
         * @description
         * HTML contents in the search form within the Search page for entering a keyword search combined
         * using the AND operator or the OR operator.
         */
        .directive('searchForm', searchForm);

        searchForm.$inject = ['searchService', 'discoverStateService', 'exploreService', 'utilService'];

        function searchForm(searchService, discoverStateService, exploreService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/search/directives/searchForm/searchForm.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var s = searchService;
                    var es = exploreService;
                    dvm.ds = discoverStateService;
                    dvm.util = utilService;
                    dvm.typeSearch = '';
                    dvm.errorMessage = '';

                    dvm.submit = function() {
                        s.submitSearch(dvm.ds.search.datasetRecordId, dvm.ds.search.queryConfig)
                            .then(data => {
                                dvm.ds.search.results = data;
                                dvm.errorMessage = '';
                            }, errorMessage => {
                                dvm.ds.search.results = undefined;
                                dvm.errorMessage = errorMessage;
                            });
                    }

                    dvm.getTypes = function() {
                        dvm.ds.search.queryConfig.types = [];
                        es.getClassDetails(dvm.ds.search.datasetRecordId)
                            .then(details => {
                                dvm.ds.search.typeObject = _.groupBy(details, 'ontologyRecordTitle');
                                dvm.errorMessage = '';
                            }, errorMessage => {
                                dvm.ds.search.typeObject = {};
                                dvm.errorMessage = errorMessage;
                            });
                    }

                    dvm.getSelectedText = function() {
                        return _.join(_.map(dvm.ds.search.queryConfig.types, 'classTitle'), ', ');
                    }

                    dvm.removeFilter = function(index) {
                        _.pullAt(dvm.ds.search.queryConfig.filters, index);
                    }

                    dvm.isSubmittable = function() {
                         return dvm.ds.search.datasetRecordId && (dvm.ds.search.queryConfig.keywords.length || dvm.ds.search.queryConfig.types.length || dvm.ds.search.queryConfig.filters.length);
                    }

                    dvm.getLast = function(path) {
                        return _.last(path);
                    }
                }
            }
        }
})();
