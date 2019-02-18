(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name requestBranchSelect
         *
         * @description
         * The `requestBranchSelect` module only provides the `requestBranchSelect` directive
         * which creates a form for selecting the source and target Branch of a new MergeRequest.
         */
        .module('requestBranchSelect', [])
        /**
         * @ngdoc directive
         * @name requestBranchSelect.directive:requestBranchSelect
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires catalogManager.service:catalogManagerService
         * @requires util.service:utilService
         *
         * @description
         * `requestBranchSelect` is a directive which creates a div containing a form with ui-selects
         * to choose the source and target Branch for a new MergeRequest. The Branch list is derived from
         * the previously selected VersionedRDFRecord for the MergeRequest. The div also contains a
         * {@link commitDifferenceTabset.directive:commitDifferenceTabset} to display the changes and commits
         * between the selected branches. The directive is replaced by the contents of its template.
         */
        .directive('requestBranchSelect', requestBranchSelect);

    requestBranchSelect.$inject = ['mergeRequestsStateService', 'mergeRequestManagerService', 'catalogManagerService', 'utilService', 'prefixes'];

    function requestBranchSelect(mergeRequestsStateService, mergeRequestManagerService, catalogManagerService, utilService, prefixes) {
        return {
            restrict: 'E',
            templateUrl: 'merge-requests/directives/requestBranchSelect/requestBranchSelect.directive.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var cm = catalogManagerService;
                var mm = mergeRequestManagerService;
                var catalogId = _.get(cm.localCatalog, '@id');
                dvm.util = utilService;
                dvm.state = mergeRequestsStateService;
                dvm.prefixes = prefixes;

                dvm.state.requestConfig.difference = undefined;
                dvm.branches = [];

                if (dvm.state.requestConfig.sourceBranch && dvm.state.requestConfig.targetBranch) {
                    updateDifference();
                }

                cm.getRecordBranches(dvm.state.requestConfig.recordId, catalogId)
                    .then(response => dvm.branches = response.data, error => {
                        dvm.util.createErrorToast(error);
                        dvm.branches = [];
                    });

                dvm.changeSource = function() {
                    if (dvm.state.requestConfig.sourceBranch) {
                        dvm.state.requestConfig.sourceBranchId = dvm.state.requestConfig.sourceBranch['@id'];
                        if (dvm.state.requestConfig.targetBranch) {
                            updateDifference();
                        } else {
                            dvm.state.requestConfig.difference = undefined;
                        }
                    } else {
                        dvm.state.requestConfig.difference = undefined;
                    }
                }
                dvm.changeTarget = function() {
                    if (dvm.state.requestConfig.targetBranch) {
                        dvm.state.requestConfig.targetBranchId = dvm.state.requestConfig.targetBranch['@id'];
                        if (dvm.state.requestConfig.sourceBranch) {
                            updateDifference();
                        } else {
                            dvm.state.requestConfig.difference = undefined;
                        }
                    } else {
                        dvm.state.requestConfig.difference = undefined;
                    }
                }

                function updateDifference() {
                    cm.getDifference(dvm.util.getPropertyId(dvm.state.requestConfig.sourceBranch, dvm.prefixes.catalog + 'head'), dvm.util.getPropertyId(dvm.state.requestConfig.targetBranch, dvm.prefixes.catalog + 'head'))
                        .then(diff => {
                            dvm.state.requestConfig.difference = diff;
                        }, errorMessage => {
                            dvm.util.createErrorToast(errorMessage);
                            dvm.state.requestConfig.difference = undefined;
                        });
                }
            }
        }
    }
})();