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
     * `recordsView` is a component which creates a div with a Bootstrap `row` containing a list of Records in the Mobi
     * instance. The list can be sorted using a {@link catalog.component:sortOptions}, searched using a
     * {@link searchBar.component:searchBar}, and filtered using a {@link catalog.component:recordFilters}. The list is
     * also {@link paging.directive:paging paginated}. Each Record is displayed using a
     * {@link catalog.component:recordCard} that will select the Record it in the
     * {@link catalogState.service:catalogStateService} when clicked.
     */
    const recordsViewComponent = {
        templateUrl: 'catalog/components/recordsView/recordsView.component.html',
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
        dvm.searchRecords = function() {
            dvm.search(dvm.state.recordSearchText);
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
