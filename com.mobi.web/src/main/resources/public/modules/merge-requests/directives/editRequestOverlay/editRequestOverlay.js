/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
         * @name editRequestOverlay
         *
         * @description
         * The `editRequestOverlay` module only provides the `editRequestOverlay` directive which creates content
         * for a modal to edit a merge request.
         */
        .module('editRequestOverlay', [])
        /**
         * @ngdoc directive
         * @name editRequestOverlay.directive:editRequestOverlay
         * @scope
         * @restrict E
         * @requires mergeRequestManager.service:mergeRequestManagerService
         * @requires mergeRequestState.service:mergeRequestStateService
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `editRequestOverlay` is a directive that creates content for a modal that edits a merge request on the
         * {@link mergeRequestsState.service:mergeRequestsStateSvc selected entity}. The form in the modal contains a
         * 
         * Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .directive('editRequestOverlay', editRequestOverlay);

        editRequestOverlay.$inject = ['mergeRequestsStateSvc', 'mergeRequestManagerSvc', 'utilService', 'prefixes'];

        function editRequestOverlay(mergeRequestsStateSvc, mergeRequestManagerSvc, utilService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'modules/merge-requests/directives/editRequestOverlay/editRequestOverlay.html',
                scope: {
                    close: '&',
                    dismiss: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.mm = mergeRequestManagerService;
                    dvm.state = mergeRequestsStateService;
                    dvm.util = utilService;
                    dvm.prefixes = prefixes;

                    dvm.submit = function() {
                    }
                    dvm.isDisabled = function() {
                    }
                    dvm.cancel = function() {
                        $scope.dismiss();
                    }
                }]
            }
        }
})();
