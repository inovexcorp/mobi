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
         *
         * @description
         * `mergeRequestsPage` is a directive which creates a div containing the main parts of the Merge Requests
         * tool. The main parts of the page are the {@link mergeRequestList.directive:mergeRequestList},
         * {@link mergeRequestView.directive:mergeRequestView}, and
         * {@link createRequest.directive:createRequest createRequest page}. The directive is replaced by the contents
         * of its template.
         */
        .directive('mergeRequestsPage', mergeRequestsPage);

    mergeRequestsPage.$inject = ['mergeRequestsStateService'];

    function mergeRequestsPage(mergeRequestsStateService) {
        return {
            restrict: 'E',
            templateUrl: 'merge-requests/directives/mergeRequestsPage/mergeRequestsPage.directive.html',
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