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
     * @name catalog.component:recordsView
     * @requires catalogState.service:catalogStateService
     * @requires catalogManager.service:catalogManagerService
     * @requires utilService.service:utilService
     *
     * @description
     * `recordsView` is a component which creates a div with a Bootstrap `row` containing a
     * {@link block.directive:block} with a list of the Records in the Mobi instance. The list can be sorted using a
     * {@link catalog.component:sortOptions}, searched using a {@link catalog.component:recordSearch}, and filtered
     * using a {@link catalog.component:recordFilters}. The list is also {@link paging.directive:paging paginated}.
     * Each Record is displayed with its title, {@link catalog.component:recordTypes types},
     * {@link entityDates.directive:entityDates issued and modified dates},
     * {@link catalog.component:entityPublisher publisher},
     * {@link entityDescription.directive:entityDescription description}, and
     * {@link recordKeywords.directive:recordKeywords keywords}. Clicking a Record in the list will select it in the
     * {@link catalogState.service:catalogStateService}.
     */
    const recordsViewComponent = {
        templateUrl: 'modules/catalog/components/recordsView/recordsView.html',
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
