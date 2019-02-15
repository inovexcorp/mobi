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
         * which creates a form for setting the metadata of a new MergeRequest.
         */
        .module('requestDetailsForm', [])
        .config(ignoreUnhandledRejectionsConfig)
        /**
         * @ngdoc directive
         * @name requestDetailsForm.directive:requestDetailsForm
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         * @requires util.service:utilService
         *
         * @description
         * `requestDetailsForm` is a directive which creates a div containing a form with inputs for
         * the title, description, and other metadata about a new MergeRequest. The div also contains
         * {@link commitDifferenceTabset.directive:commitDifferenceTabset} to display the changes and
         * commits between the previously selected source and target branch of the Merge Request.
         * The directive is replaced by the contents of its template.
         */
        .directive('requestDetailsForm', requestDetailsForm);

    requestDetailsForm.$inject = ['mergeRequestsStateService', 'userManagerService', 'utilService', 'prefixes'];

    function requestDetailsForm(mergeRequestsStateService, userManagerService, utilService, prefixes) {
        return {
            restrict: 'E',
            templateUrl: 'merge-requests/directives/requestDetailsForm/requestDetailsForm.directive.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.util = utilService;
                dvm.prefixes = prefixes;
                dvm.state = mergeRequestsStateService;
                dvm.um = userManagerService;

                dvm.state.requestConfig.title = dvm.util.getDctermsValue(dvm.state.requestConfig.sourceBranch, 'title');
            }
        }
    }
})();