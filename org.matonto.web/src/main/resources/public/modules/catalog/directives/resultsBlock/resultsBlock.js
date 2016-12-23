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
(function () {
    'use strict';

    angular
        .module('resultsBlock', [])
        .directive('resultsBlock', resultsBlock);

    resultsBlock.$inject = ['catalogStateService', 'catalogManagerService', 'prefixes', 'utilService', 'toastr'];

    function resultsBlock(catalogStateService, catalogManagerService, prefixes, utilService, toastr) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
                dvm.prefixes = prefixes;
                dvm.util = utilService;

                getRecords();

                dvm.changeSort = function() {
                    getRecords();
                }
                dvm.openRecord = function(record) {
                    var currentCatalog = dvm.state.getCurrentCatalog();
                    dvm.cm.getRecord(record['@id'], currentCatalog.catalog['@id'])
                        .then(response => {
                            dvm.state.resetPagination();
                            currentCatalog.openedPath.push(response);
                        }, error => toastr.error(error, 'Error', {timeOut: 0}));
                }

                function getRecords() {
                    dvm.state.currentPage = 0;
                    var currentCatalog = dvm.state.getCurrentCatalog();
                    var paginatedConfig = {
                        pageIndex: dvm.state.currentPage,
                        limit: currentCatalog.records.limit,
                        sortOption: currentCatalog.records.sortOption,
                        recordType: currentCatalog.records.filterType,
                        searchText: currentCatalog.records.searchText
                    };
                    dvm.cm.getRecords(currentCatalog.catalog['@id'], paginatedConfig)
                        .then(response => dvm.state.setPagination(response), error => toastr.error(error, 'Error', {timeOut: 0}));
                }
            },
            templateUrl: 'modules/catalog/directives/resultsBlock/resultsBlock.html'
        };
    }
})();
