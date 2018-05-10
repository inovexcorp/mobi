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
         * @name mergeRequestsTabset
         *
         * @description
         * The `mergeRequestsTabset` module only provides the `mergeRequestsTabset` directive
         * which creates the main div containing the Merge Requests page.
         */
        .module('mergeRequestsTabset', [])
        /**
         * @ngdoc directive
         * @name mergeRequestsTabset.directive:mergeRequestsTabset
         * @scope
         * @restrict E
         * @requires mergeRequestsState.service:mergeRequestsStateService
         *
         * @description
         * `mergeRequestsTabset` is a directive which creates a div containing a
         * {@link tabset.directive:tabset} with the main tabs of the Merge Requests page. These tabs
         * are the {@link openTab.directive:openTab}. The directive is replaced by the contents
         * of its template.
         */
        .directive('mergeRequestsTabset', mergeRequestsTabset);

    mergeRequestsTabset.$inject = ['mergeRequestsStateService', 'mergeRequestManagerService', 'utilService'];

    function mergeRequestsTabset(mergeRequestsStateService, mergeRequestManagerService, utilService) {
        return {
            restrict: 'E',
            templateUrl: 'modules/merge-requests/directives/mergeRequestsTabset/mergeRequestsTabset.html',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                var mm = mergeRequestManagerService;
                var util = utilService;
                dvm.state = mergeRequestsStateService;
                dvm.errorMessage = '';

                dvm.cancelDelete = function() {
                    dvm.state.requestToDelete = undefined;
                    dvm.state.showDelete = false;
                    dvm.errorMessage = '';
                }
                dvm.deleteRequest = function() {
                    var currentTab = dvm.state.getCurrentTab();
                    mm.deleteRequest(dvm.state.requestToDelete.request['@id'])
                        .then(() => {
                            var hasSelected = !!currentTab.selected;
                            currentTab.selected = undefined;
                            util.createSuccessToast('Request successfully deleted');
                            dvm.cancelDelete();
                            if (!hasSelected) {
                                dvm.state.setRequests(!dvm.state.open.active);
                            }
                        }, error => dvm.errorMessage = error);
                }
            }
        }
    }
})();