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
         * @requires mergeRequestState.service:mergeRequestStateService
         *
         * @description
         * `mergeRequestList` is a directive which creates a div containing a {@link block.directive:block}
         * with the list of MergeRequests retrieved by the
         * {@link mergeRequestsState.service:mergeRequestsStateService}. The directive is replaced
         * by the contents of its template.
         */
        .directive('mergeRequestList', mergeRequestList);

        mergeRequestList.$inject = ['mergeRequestsStateService'];

        function mergeRequestList(mergeRequestsStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/merge-requests/directives/mergeRequestList/mergeRequestList.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.filterOptions = [
                        {value: false, label: 'Open'},
                        {value: true, label: 'Accepted'},
                    ];
                    dvm.state = mergeRequestsStateService;

                    dvm.state.setRequests(dvm.state.acceptedFilter);

                    dvm.showDeleteOverlay = function(request) {
                        dvm.state.requestToDelete = request;
                        dvm.state.showDelete = true;
                    }
                }
            }
        }
})();