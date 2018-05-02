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
         * @name requestDetailsForm
         *
         * @description
         * The `requestDetailsForm` module only provides the `requestDetailsForm` directive
         * which creates the main div containing the Merge Requests page.
         */
        .module('requestDetailsForm', [])
        /**
         * @ngdoc directive
         * @name requestDetailsForm.directive:requestDetailsForm
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         *
         * @description
         * `requestDetailsForm` is a directive which creates a div containing a
         * {@link tabset.directive:tabset} with the main tabs of the Merge Requests page. These tabs
         * are the {@link openTab.directive:openTab}. The directive is replaced by the contents
         * of its template.
         */
        .directive('requestDetailsForm', requestDetailsForm);

    requestDetailsForm.$inject = ['mergeRequestsStateService', 'utilService'];

    function requestDetailsForm(mergeRequestsStateService, utilService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/requestDetailsForm/requestDetailsForm.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.util = utilService;
                dvm.state = mergeRequestsStateService;

                dvm.state.requestConfig.title = dvm.util.getDctermsValue(dvm.state.requestConfig.sourceBranch, 'title');
            }
        }
    }
})();