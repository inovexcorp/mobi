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
         * @name searchRow
         *
         * @description
         * The `searchRow` module only provides the `searchRow` directive which creates
         * a Bootstrap `row` with a for for searching through the records in the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}.
         */
        .module('searchRow', [])
        /**
         * @ngdoc directive
         * @name searchRow.directive:searchRow
         * @scope
         * @restrict E
         * @requires catalogState.service:catalogStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         *
         * @description
         * `searchRow` is a directive which creates a Bootstrap `row` with a
         * {@link catalogManager.service:catalogManagerService#recordTypes record type} filter select, a
         * {@link catalogState.service:catalogStateService search text} input, and a submit button. A
         * submission of this form will affect the
         * {@link catalogState.service:catalogStateService#results list of records} shown in a
         * {@link resultsBlock.directive:resultsBlock resultsBlock} and navigate back to the current
         * {@link catalogState.service:catalogStateService#catalogs catalog}. The directive is replaced by
         * the contents of its template.
         */
        .directive('searchRow', searchRow);

    searchRow.$inject = ['catalogStateService', 'catalogManagerService', 'utilService'];

    function searchRow(catalogStateService, catalogManagerService, utilService) {
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
                dvm.searchText = _.get(dvm.state.getCurrentCatalog(), 'records.searchText', '');
                dvm.recordType = _.get(dvm.state.getCurrentCatalog(), 'records.recordType', '');

                dvm.search = function() {
                    dvm.state.currentPage = 1;
                    var currentCatalog = dvm.state.getCurrentCatalog();
                    var paginatedConfig = {
                        pageIndex: dvm.state.currentPage - 1,
                        limit: currentCatalog.records.limit,
                        sortOption: currentCatalog.records.sortOption,
                        recordType: dvm.recordType,
                        searchText: dvm.searchText
                    };
                    dvm.cm.getRecords(currentCatalog.catalog['@id'], paginatedConfig)
                        .then(response => {
                            currentCatalog.records.recordType = dvm.recordType;
                            currentCatalog.records.searchText = dvm.searchText;
                            dvm.state.setPagination(response);
                            currentCatalog.openedPath = _.take(currentCatalog.openedPath, 1);
                        }, dvm.util.createErrorToast);
                }
            },
            templateUrl: 'modules/catalog/directives/searchRow/searchRow.html'
        };
    }
})();
