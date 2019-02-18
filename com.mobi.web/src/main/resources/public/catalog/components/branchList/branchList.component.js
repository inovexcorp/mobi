
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:branchList
     * @requires catalogManager.service:catalogManagerService
     * @requires utilService.service:utilService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `branchList` is a component which creates a list of expansion panels for all the Branches in the provided catalog
     * Record. If the provided Record is not a VersionedRDFRecord, no branches will be shown. The panel for each Branch
     * shows the title, description, and {@link commitHistoryTable.directive:commitHistoryTable}. Only one panel can be
     * open at a time.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     */
    const branchListComponent = {
        templateUrl: 'catalog/components/branchList/branchList.component.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: branchListComponentCtrl
    };

    branchListComponentCtrl.$inject = ['catalogManagerService', 'utilService', 'prefixes'];

    function branchListComponentCtrl(catalogManagerService, utilService, prefixes) {
        var dvm = this;
        var cm = catalogManagerService;
        dvm.util = utilService;
        dvm.prefixes = prefixes;
        dvm.totalSize = 0;
        dvm.branches = [];
        dvm.catalogId = '';
        var increment = 10;
        dvm.limit = increment;

        dvm.$onInit = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.catalogId = dvm.util.getPropertyId(dvm.record, prefixes.catalog + 'catalog');
                dvm.setBranches();
            }
        }
        dvm.$onChanges = function() {
            if (dvm.record && !_.isEmpty(dvm.record)) {
                dvm.catalogId = dvm.util.getPropertyId(dvm.record, prefixes.catalog + 'catalog');
                dvm.setBranches();
            }
        }
        dvm.loadMore = function () {
            dvm.limit += increment;
            dvm.setBranches();
        }
        dvm.showPanel = function(branch) {
            _.forEach(dvm.branches, result => delete result.show);
            branch.show = true;
        }
        dvm.setBranches = function() {
            if (cm.isVersionedRDFRecord(dvm.record)) {
                var paginatedConfig = {
                    pageIndex: 0,
                    limit: dvm.limit,
                    sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'modified', asc: false})
                };
                cm.getRecordBranches(dvm.record['@id'], dvm.catalogId, paginatedConfig)
                    .then(response => {
                        dvm.branches = _.filter(response.data, branch => !cm.isUserBranch(branch));
                        var headers = response.headers();
                        dvm.totalSize = _.get(headers, 'x-total-count', 0) - (response.data.length - dvm.branches.length);
                    }, dvm.util.createErrorToast);
            }
        }
    }

    angular.module('catalog')
        .component('branchList', branchListComponent);
})();