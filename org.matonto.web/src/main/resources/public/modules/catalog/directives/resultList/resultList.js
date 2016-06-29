/*-
 * #%L
 * org.matonto.web
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
         * @name resultList
         * @requires catalogManager
         *
         * @description 
         * The `resultList` module only provides the `resultList` directive which creates
         * a sortable paginated list of resources.
         */
        .module('resultList', ['catalogManager', 'ontologyManager'])
        /**
         * @ngdoc directive
         * @name resultList.directive:resultList
         * @scope
         * @restrict E
         * @requires catalogManager.catalogManagerService
         *
         * @description 
         * `resultList` is a directive that creates a sortable paginated list of resources 
         * given the results in {@link catalogManager.service:catalogManagerService catalogManagerService}. 
         * The directive is replaced by the content of the template. The directive is split 
         * into three main divs: '.results-header' which contains information about the 
         * current page and a ordering select box, '.results-list' which contains the series
         * of divs for each resource in the list, and '.page-nav' with pagination buttons. 
         * The title of each resource in the results list is clickable. Each resource also 
         * has a download button.
         *
         * @usage
         * <result-list></result-list>
         */
        .directive('resultList', resultList);

        resultList.$inject = ['catalogManagerService', 'ontologyManagerService'];

        function resultList(catalogManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.catalog = catalogManagerService;

                    dvm.sortOptions = [];

                    dvm.getEndingNumber = function() {
                        return _.min([dvm.catalog.results.totalSize, dvm.catalog.results.start + dvm.catalog.results.limit]);
                    }
                    dvm.changeSort = function() {
                        dvm.catalog.sortBy = dvm.sortOption.field;
                        dvm.catalog.asc = dvm.sortOption.asc;
                        dvm.catalog.getResources();
                    }
                    dvm.getDate = function(date) {
                        var jsDate = catalogManagerService.getDate(date);
                        return jsDate.toDateString();
                    }
                    dvm.getPage = function(direction) {
                        if (direction === 'next') {
                            dvm.catalog.currentPage += 1;
                            dvm.catalog.getResultsPage(dvm.catalog.results.links.base + dvm.catalog.results.links.next);
                        } else {
                            dvm.catalog.currentPage -= 1;
                            dvm.catalog.getResultsPage(dvm.catalog.results.links.base + dvm.catalog.results.links.prev);
                        }
                    }
                    function initialize() {
                        dvm.catalog.getSortOptions()
                        .then(function(options) {
                            _.forEach(options, function(option) {
                                var label = ontologyManagerService.getBeautifulIRI(option);
                                dvm.sortOptions.push({
                                    field: option,
                                    asc: true,
                                    label: label + ' (asc)'
                                });
                                dvm.sortOptions.push({
                                    field: option,
                                    asc: false,
                                    label: label + ' (desc)'
                                });
                            });
                            var index = dvm.catalog.sortBy ? _.findIndex(dvm.sortOptions, {field: dvm.catalog.sortBy, asc: dvm.catalog.asc}) : 0;
                            dvm.sortOption = dvm.sortOptions[index];
                            if (dvm.sortOption) {
                                dvm.changeSort();
                            }
                        });
                    }

                    initialize();
                },
                templateUrl: 'modules/catalog/directives/resultList/resultList.html'
            }
        }
})();
