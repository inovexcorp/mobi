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
         * @name mergeRequestsPage
         *
         * @description
         * The `mergeRequestsPage` module only provides the `mergeRequestsPage` directive
         * which creates the main div containing the Merge Requests page.
         */
        .module('mergeRequestsPage', [])
        /**
         * @ngdoc directive
         * @name mergeRequestsPage.directive:mergeRequestsPage
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires util.service:utilService
         * @requires ontologyState.service:ontologyStateService
         *
         * @description
         * `mergeRequestsPage` is a directive which creates a div containing the main parts of the Merge Requests
         * tool and {@link confirmationOverlay.directive:confirmationOverlay confirmation overlays} for deleting and
         * accepting MergeRequests. The main parts of the page are the {@link mergeRequestList.directive:mergeRequestList},
         * {@link mergeRequestView.directive:mergeRequestView}, and
         * {@link createRequest.directive:createRequest createRequest page}. The directive is replaced by the contents
         * of its template.
         */
        .directive('mergeRequestsPage', mergeRequestsPage);

    mergeRequestsPage.$inject = ['$q', 'mergeRequestsStateService', 'mergeRequestManagerService', 'utilService', 'ontologyStateService'];

    function mergeRequestsPage($q, mergeRequestsStateService, mergeRequestManagerService, utilService, ontologyStateService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/mergeRequestsPage/mergeRequestsPage.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var mm = mergeRequestManagerService;
                var util = utilService;
                var os = ontologyStateService;
                dvm.state = mergeRequestsStateService;
                dvm.errorMessage = '';

                dvm.closeDelete = function() {
                    dvm.state.requestToDelete = undefined;
                    dvm.state.showDelete = false;
                    dvm.errorMessage = '';
                }
                dvm.deleteRequest = function() {
                    mm.deleteRequest(dvm.state.requestToDelete.request['@id'])
                        .then(() => {
                            var hasSelected = !!dvm.state.selected;
                            dvm.state.selected = undefined;
                            util.createSuccessToast('Request successfully deleted');
                            dvm.closeDelete();
                            if (!hasSelected) {
                                dvm.state.setRequests(dvm.state.acceptedFilter);
                            }
                        }, error => dvm.errorMessage = error);
                }
                dvm.closeAccept = function() {
                    dvm.state.requestToAccept = undefined;
                    dvm.state.showAccept = false;
                    dvm.errorMessage = '';
                }
                dvm.acceptRequest = function() {
                    var targetBranchId = dvm.state.requestToAccept.targetBranch['@id'];
                    mm.acceptRequest(dvm.state.requestToAccept.request['@id'])
                        .then(() => {
                            util.createSuccessToast('Request successfully accepted');
                            return mm.getRequest(dvm.state.selected.request['@id'])
                        }, $q.reject)
                        .then(request => {
                            dvm.state.requestToAccept.request = request;
                            return dvm.state.setRequestDetails(dvm.state.requestToAccept);
                        }, $q.reject)
                        .then(() => {
                            dvm.state.selected = dvm.state.requestToAccept;
                            dvm.closeAccept();
                            if (os.listItem) {
                                if (os.listItem.ontologyRecord.branchId === targetBranchId) {
                                    os.listItem.upToDate = false;
                                    if (os.listItem.merge.active) {
                                        util.createWarningToast('You have a merge in process in the Ontology Editor that is out of date. Please reopen the merge form.');
                                    }
                                }
                                if (os.listItem.merge.active && _.get(os.listItem.merge.target, '@id') === targetBranchId) {
                                    util.createWarningToast('You have a merge in process in the Ontology Editor that is out of date. Please reopen the merge form to avoid conflicts.');
                                }
                            }
                        }, error => dvm.errorMessage = error);
                }
            }
        }
    }
})();