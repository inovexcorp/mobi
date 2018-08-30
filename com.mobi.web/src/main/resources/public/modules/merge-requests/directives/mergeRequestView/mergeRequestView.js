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
        /**
         * @ngdoc directive
         * @name mergeRequestView.directive:mergeRequestView
         * @scope
         * @restrict E
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires mergeRequestState.service:mergeRequestStateService
         * @requires util.service:utilService
         *
         * @description
         * `mergeRequestView` is a directive which creates a div containing a {@link block.directive:block}
         * which displays metadata about the
         * {@link mergeRequestsState.service:mergeRequestsStateService selected MergeRequest} including a
         * {@link commitDifferenceTabset.directive:commitDifferenceTabset} to display the changes and commits
         * between the source and target branch of the MergeRequest. The block also contains buttons to delete
         * the MergeRequest, accept the MergeRequest, and go back to the
         * {@link mergeRequestList.directive:mergeRequestList}. This directive is replaced by the contents of its
         * template.
         */
        .directive('mergeRequestView', mergeRequestView);

        mergeRequestView.$inject = ['mergeRequestManagerService', 'mergeRequestsStateService', 'utilService'];

        function mergeRequestView(mergeRequestManagerService, mergeRequestsStateService, utilService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/merge-requests/directives/mergeRequestView/mergeRequestView.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.mm = mergeRequestManagerService;
                    dvm.util = utilService;
                    dvm.state = mergeRequestsStateService;

                    dvm.mm.getRequest(dvm.state.selected.request['@id'])
                        .then(request => {
                            dvm.state.selected.request = request;
                            dvm.state.setRequestDetails(dvm.state.selected);
                        }, error => {
                            dvm.util.createWarningToast('The request you had selected no longer exists');
                            dvm.back();
                        });

                    dvm.back = function() {
                        dvm.state.selected = undefined;
                    }
                    dvm.showDelete = function() {
                        dvm.state.requestToDelete = dvm.state.selected;
                        dvm.state.showDelete = true;
                    }
                    dvm.showAccept = function() {
                        dvm.state.requestToAccept = dvm.state.selected;
                        dvm.state.showAccept = true;
                    }
                }
            }
        }
})();