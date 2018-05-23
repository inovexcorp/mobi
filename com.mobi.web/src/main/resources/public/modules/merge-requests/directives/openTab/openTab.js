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
         * @name openTab
         *
         * @description
         * The `openTab` module only provides the `openTab` directive which creates a Bootstrap `row`
         * with either a list of MergeRequests or an individual MergeRequest.
         */
        .module('openTab', [])
        /**
         * @ngdoc directive
         * @name openTab.directive:openTab
         * @scope
         * @restrict E
         * @requires mergeRequestState.service:mergeRequestStateService
         *
         * @description
         * `openTab` is a directive which creates a Bootstrap `row` with a single column with different
         * contents depending on whether a request is selected or being created. It contains the
         * {@link mergeRequestList.directive:mergeRequestList},
         * {@link }
         * The directive is replaced by the contents of its template.
         */
        .directive('openTab', openTab);

        openTab.$inject = ['mergeRequestsStateService'];

        function openTab(mergeRequestsStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/merge-requests/directives/openTab/openTab.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.state = mergeRequestsStateService;
                }
            }
        }
})();