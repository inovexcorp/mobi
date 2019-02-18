(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name createRequest
         *
         * @description
         * The `createRequest` module only provides the `createRequest` directive
         * which creates the main div containing the Merge Requests page.
         */
        .module('createRequest', [])
        /**
         * @ngdoc directive
         * @name createRequest.directive:createRequest
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         *
         * @description
         * `createRequest` is a directive which creates a div containing a
         * {@link block.directive:block} with the workflow steps of creating a MergeRequest. These steps are
         * {@link requestRecordSelect.directive:requestRecordSelect},
         * {@link requestBranchSelect.directive:requestBranchSelect}, and
         * {@link requestDetailsForm.directive:requestDetailsForm}. The directive is replaced by the contents
         * of its template.
         */
        .directive('createRequest', createRequest);

    createRequest.$inject = ['mergeRequestManagerService', 'mergeRequestsStateService', 'utilService'];

    function createRequest(mergeRequestManagerService, mergeRequestsStateService, utilService) {
        return {
            restrict: 'E',
            templateUrl: 'merge-requests/directives/createRequest/createRequest.directive.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var util = utilService;
                var mm = mergeRequestManagerService;
                dvm.state = mergeRequestsStateService;

                dvm.next = function() {
                    if (dvm.state.createRequestStep < 2) {
                        dvm.state.createRequestStep++;
                    } else {
                        mm.createRequest(dvm.state.requestConfig)
                            .then(iri => {
                                util.createSuccessToast('Successfully created request');
                                dvm.state.createRequest = false;
                            }, util.createErrorToast);
                    }
                }
                dvm.back = function() {
                    if (dvm.state.createRequestStep > 0) {
                        dvm.state.createRequestStep--;
                        if (dvm.state.createRequestStep === 1) {
                            dvm.state.requestConfig.title = '';
                            dvm.state.requestConfig.description = '';
                            dvm.state.requestConfig.assignees = [];
                            dvm.state.requestConfig.removeSource = false;
                        } else if (dvm.state.createRequestStep === 0) {
                            dvm.state.requestConfig.sourceBranchId = '';
                            dvm.state.requestConfig.targetBranchId = '';
                            delete dvm.state.requestConfig.sourceBranch;
                            delete dvm.state.requestConfig.targetBranch;
                            delete dvm.state.requestConfig.difference;
                            delete dvm.state.requestConfig.removeSource;
                        }
                     } else {
                        dvm.state.createRequest = false;
                    }
                }
                dvm.isDisabled = function() {
                    if (dvm.state.createRequestStep === 0) {
                        return !dvm.state.requestConfig.recordId;
                    } else if (dvm.state.createRequestStep === 1) {
                        return !dvm.state.requestConfig.sourceBranchId || !dvm.state.requestConfig.targetBranchId;
                    } else {
                        return !dvm.state.requestConfig.title;
                    }
                }
            }
        }
    }
})();