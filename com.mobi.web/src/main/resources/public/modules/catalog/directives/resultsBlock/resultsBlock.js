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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name resultsBlock
         *
         * @description
         * The `resultsBlock` module only provides the `resultsBlock` directive which creates
         * a div with a {@link block.directive:block block} containing a paginated list of records
         * in the current {@link catalogState.service:catalogStateService#catalogs catalog}.
         */
        .module('resultsBlock', [])
        /**
         * @ngdoc directive
         * @name resultsBlock.directive:resultsBlock
         * @scope
         * @restrict E
         * @requires catalogState.service:cataStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires utilService.service:utilService
         *
         * @description
         * `resultsBlock` is a directive which creates a div with a {@link block.directive:block block}
         * containing a paginated list of records in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}. The paginated list includes a
         * {@link paginationHeader.directive:paginationHeader paginationHeader} and a
         * {@link catalogPagination.directive:catalogPagination catalogPagination}. Clicking a record in the
         * list will add it to the current catalog's `openedPath`. The directive is replaced by the contents
         * of its template.
         */
        .directive('resultsBlock', resultsBlock);

    resultsBlock.$inject = ['catalogStateService', 'catalogManagerService', 'utilService'];

    function resultsBlock(catalogStateService, catalogManagerService, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = catalogStateService;
                dvm.cm = catalogManagerService;
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
                        }, dvm.util.createErrorToast);
                }

                function getRecords() {
                    dvm.state.currentPage = 0;
                    var currentCatalog = dvm.state.getCurrentCatalog();
                    var paginatedConfig = {
                        pageIndex: dvm.state.currentPage,
                        limit: currentCatalog.records.limit,
                        sortOption: currentCatalog.records.sortOption,
                        recordType: currentCatalog.records.recordType,
                        searchText: currentCatalog.records.searchText
                    };
                    dvm.cm.getRecords(currentCatalog.catalog['@id'], paginatedConfig)
                        .then(dvm.state.setPagination, dvm.util.createErrorToast);
                }
            },
            templateUrl: 'modules/catalog/directives/resultsBlock/resultsBlock.html'
        };
    }
})();
