/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
         * @name mergeRequestView
         *
         * @description
         * The `mergeRequestView` module only provides the `mergeRequestView` directive which creates a
         * {@link block.directive:block} with a display of a selected MergeRequest.
         */
        .module('mergeRequestView', [])
        .config(['$qProvider', function($qProvider) {
            $qProvider.errorOnUnhandledRejections(false);
        }])
        /**
         * @ngdoc directive
         * @name mergeRequestView.directive:mergeRequestView
         * @scope
         * @restrict E
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires mergeRequestState.service:mergeRequestStateService
         * @requires util.service:utilService
         * @requires modal.service:modalService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyState.service:ontologytateService
         *
         * @description
         * `mergeRequestView` is a directive which creates a div containing a {@link block.directive:block}
         * which displays metadata about the
         * {@link mergeRequestsState.service:mergeRequestsStateService selected MergeRequest} including a
         * {@link commitDifferenceTabset.directive:commitDifferenceTabset} to display the changes and commits
         * between the source and target branch of the MergeRequest. The block also contains buttons to delete
         * the MergeRequest, accept the MergeRequest, and go back to the
         * {@link mergeRequestList.directive:mergeRequestList}. This directive houses the method for opening a
         * modal for accepting merge requests. This directive is replaced by the contents of its template.
         */
        .directive('mergeRequestView', mergeRequestView);

        mergeRequestView.$inject = ['$q', 'mergeRequestManagerService', 'mergeRequestsStateService', 'utilService', 'modalService', 'ontologyStateService', 'ontologyManagerService'];

        function mergeRequestView($q, mergeRequestManagerService, mergeRequestsStateService, utilService, modalService, ontologyStateService, ontologyManagerService) {
            return {
                restrict: 'E',
                templateUrl: 'merge-requests/directives/mergeRequestView/mergeRequestView.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var os = ontologyStateService;
                    var om = ontologyManagerService;
                    dvm.mm = mergeRequestManagerService;
                    dvm.util = utilService;
                    dvm.state = mergeRequestsStateService;
                    dvm.resolveConflicts = false;
                    dvm.copiedConflicts = [];
                    dvm.resolveError = false;

                    dvm.mm.getRequest(dvm.state.selected.jsonld['@id'])
                        .then(jsonld => {
                            dvm.state.selected.jsonld = jsonld;
                            dvm.state.setRequestDetails(dvm.state.selected);
                        }, error => {
                            dvm.util.createWarningToast('The request you had selected no longer exists');
                            dvm.back();
                        });

                    dvm.back = function() {
                        dvm.state.selected = undefined;
                    }
                    dvm.showDelete = function() {
                        modalService.openConfirmModal('<p>Are you sure you want to delete <strong>' + dvm.state.selected.title + '</strong>?</p>', () => dvm.state.deleteRequest(dvm.state.selected));
                    }
                    dvm.showAccept = function() {
                        modalService.openConfirmModal('<p>Are you sure that you want to accept <strong>' + dvm.state.selected.title + '</strong>?</p>', dvm.acceptRequest);
                    }
                    dvm.acceptRequest = function() {
                        var requestToAccept = angular.copy(dvm.state.selected);
                        var targetBranchId = requestToAccept.targetBranch['@id'];
                        var sourceBranchId = requestToAccept.sourceBranch['@id'];
                        var removeSource = dvm.state.removeSource(requestToAccept.jsonld);
                        dvm.mm.acceptRequest(requestToAccept.jsonld['@id'])
                            .then(() => {
                                dvm.util.createSuccessToast('Request successfully accepted');
                                return dvm.mm.getRequest(requestToAccept.jsonld['@id'])
                            }, $q.reject)
                            .then(jsonld => {
                                requestToAccept.jsonld = jsonld;
                                return dvm.state.setRequestDetails(requestToAccept);
                            }, $q.reject)
                            .then(() => {
                                if (removeSource) {
                                    return om.deleteOntologyBranch(requestToAccept.recordIri, sourceBranchId)
                                        .then(() => {
                                            if (_.some(os.list, {ontologyRecord: {recordId: requestToAccept.recordIri}})) {
                                                os.removeBranch(requestToAccept.recordIri, sourceBranchId);
                                            }
                                        }, $q.reject);
                                }
                                return $q.when();
                            }, $q.reject)
                            .then(() => {
                                dvm.state.selected = requestToAccept;
                                if (!_.isEmpty(os.listItem)) {
                                    if (_.get(os.listItem, 'ontologyRecord.branchId') === targetBranchId) {
                                        os.listItem.upToDate = false;
                                        if (os.listItem.merge.active) {
                                            dvm.util.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form.', {timeOut: 5000});
                                        }
                                    }
                                    if (os.listItem.merge.active && _.get(os.listItem.merge.target, '@id') === targetBranchId) {
                                        dvm.util.createWarningToast('You have a merge in progress in the Ontology Editor that is out of date. Please reopen the merge form to avoid conflicts.', {timeOut: 5000});
                                    }
                                }
                            }, dvm.util.createErrorToast);
                    }
                    dvm.showResolutionForm = function() {
                        dvm.resolveConflicts = true;
                        dvm.copiedConflicts = angular.copy(dvm.state.selected.conflicts);
                        _.forEach(dvm.copiedConflicts, conflict => {
                            conflict.resolved = false;
                        });
                        dvm.resolveError = false;
                    }
                    dvm.resolve = function() {
                        var resolutions = createResolutions();
                        dvm.state.resolveRequestConflicts(dvm.state.selected, resolutions)
                            .then(() => {
                                dvm.util.createSuccessToast('Conflicts successfully resolved');
                                dvm.resolveConflicts = false;
                                dvm.copiedConflicts = [];
                                dvm.resolveError = false;
                            }, error => {
                                dvm.resolveError = true;
                            });
                    }
                    dvm.cancelResolve = function() {
                        dvm.resolveConflicts = false;
                        dvm.copiedConflicts = [];
                        dvm.resolveError = false;
                    }
                    dvm.allResolved = function() {
                        return !_.some(dvm.copiedConflicts, {resolved: false});
                    }
                    dvm.editRequest = function() {
                        modalService.openModal('editRequestOverlay');
                    }

                    function createResolutions() {
                        var resolutions = {
                            additions: [],
                            deletions: []
                        };
                        _.forEach(dvm.copiedConflicts, conflict => {
                            if (conflict.resolved === 'left') {
                                addToResolutions(resolutions, conflict.right);
                            } else if (conflict.resolved === 'right') {
                                addToResolutions(resolutions, conflict.left);
                            }
                        });
                        return resolutions;
                    }
                    function addToResolutions(resolutions, notSelected) {
                        if (notSelected.additions.length) {
                            resolutions.deletions = _.concat(resolutions.deletions, notSelected.additions);
                        } else {
                            resolutions.additions = _.concat(resolutions.additions, notSelected.deletions);
                        }
                    }
                }
            }
        }
})();