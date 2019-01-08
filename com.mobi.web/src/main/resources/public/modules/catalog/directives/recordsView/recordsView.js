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

    /**
     * @ngdoc component
     * @name recordsView.component:recordsView
     * @requires catalogState.service:cataStateService
     * @requires catalogManager.service:catalogManagerService
     * @requires utilService.service:utilService
     *
     * @description
     * `recordsView` is a component which creates a div with a {@link block.directive:block block}
     * containing a paginated list of records in the current
     * {@link catalogState.service:catalogStateService#catalogs catalog}. The paginated list includes a
     * {@link paginationHeader.directive:paginationHeader paginationHeader} and a
     * {@link catalogPagination.directive:catalogPagination catalogPagination}. Clicking a record in the
     * list will add it to the current catalog's `openedPath`. The directive is replaced by the contents
     * of its template.
     */
    const recordsViewComponent = {
        templateUrl: 'modules/catalog/directives/recordsView/recordsView.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: recordsViewComponentCtrl
    };

    recordsViewComponentCtrl.$inject = ['catalogStateService', 'catalogManagerService', 'utilService'];

    function recordsViewComponentCtrl(catalogStateService, catalogManagerService, utilService) {
        var dvm = this;
        var cm = catalogManagerService;
        dvm.state = catalogStateService;
        dvm.util = utilService;
        dvm.records = [];
        var catalogId = _.get(cm.localCatalog, '@id', '');

        dvm.$onInit = function() {
            dvm.state.currentRecordPage = 1;
            dvm.setRecords(dvm.state.recordSearchText, dvm.state.recordFilterType, dvm.state.recordSortOption);
        }
        dvm.openRecord = function(record) {
            dvm.state.selectedRecord = record;
        }
        dvm.changeSort = function(sortOption) {
            dvm.state.currentRecordPage = 1;
            dvm.setRecords(dvm.state.recordSearchText, dvm.state.recordFilterType, sortOption);
        }
        dvm.changeFilter = function(recordType) {
            dvm.state.currentRecordPage = 1;
            dvm.setRecords(dvm.state.recordSearchText, recordType, dvm.state.recordSortOption);
        }
        dvm.search = function(searchText) {
            dvm.state.currentRecordPage = 1;
            dvm.setRecords(searchText, dvm.state.recordFilterType, dvm.state.recordSortOption);
        }
        dvm.getRecordPage = function() {
            dvm.setRecords(dvm.state.recordSearchText, dvm.state.recordFilterType, dvm.state.recordSortOption);
        }
        dvm.setRecords = function(searchText, recordType, sortOption) {
            var paginatedConfig = {
                pageIndex: dvm.state.currentRecordPage - 1,
                limit: dvm.state.recordLimit,
                sortOption,
                recordType,
                searchText
            };
            cm.getRecords(catalogId, paginatedConfig)
                .then(response => {
                    dvm.state.recordFilterType = recordType;
                    dvm.state.recordSearchText = searchText;
                    dvm.state.recordSortOption = sortOption;
                    dvm.records = response.data;
                    dvm.state.totalRecordSize = _.get(response.headers(), 'x-total-count', 0);
                }, dvm.util.createErrorToast);
        }
    }

    angular.module('catalog')
        .component('recordsView', recordsViewComponent);
})();
