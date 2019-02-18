/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
         * @name mergeRequestList
         *
         * @description
         * The `mergeRequestList` module only provides the `mergeRequestList` directive which creates a div
         * with a {@link block.directive:block} with a list of MergeRequests.
         */
        .module('mergeRequestList', [])
        /**
         * @ngdoc directive
         * @name mergeRequestList.directive:mergeRequestList
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         * @requires modal.service:modalService
         *
         * @description
         * `mergeRequestList` is a directive which creates a div containing a {@link block.directive:block}
         * with the list of MergeRequests retrieved by the
         * {@link mergeRequestsState.service:mergeRequestsStateService}. The directive houses the method for opening a
         * modal for deleting merge requests. The directive is replaced by the contents of its template.
         */
        .directive('mergeRequestList', mergeRequestList);

        mergeRequestList.$inject = ['mergeRequestsStateService', 'modalService'];

        function mergeRequestList(mergeRequestsStateService, modalService) {
            return {
                restrict: 'E',
                templateUrl: 'merge-requests/directives/mergeRequestList/mergeRequestList.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.filterOptions = [
                        {value: false, label: 'Open'},
                        {value: true, label: 'Accepted'}
                    ];
                    dvm.state = mergeRequestsStateService;

                    dvm.state.setRequests(dvm.state.acceptedFilter);

                    dvm.showDeleteOverlay = function(request, event) {
                        event.stopPropagation();
                        modalService.openConfirmModal('<p>Are you sure you want to delete ' + request.title + '?</p>', () => dvm.state.deleteRequest(request));
                    }
                }
            }
        }
})();