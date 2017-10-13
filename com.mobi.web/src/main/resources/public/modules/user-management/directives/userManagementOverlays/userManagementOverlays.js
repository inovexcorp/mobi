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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name userManagementOverlays
         *
         * @description
         * The `userManagementOverlays` module only provides the `userManagementOverlays` directive
         * which provides all overlays used in the user management page.
         */
        .module('userManagementOverlays', [])
        /**
         * @ngdoc directive
         * @name userManagementOverlays.directive:userManagementOverlays
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         * @requires userManager.service:userManagerService
         *
         * @description
         * `userManagementOverlays` is a directive that creates all of the overlays used in the user
         * management page. Those overlays are {@link addGroupOverlay.directive:addGroupOverlay addGroupOverlay},
         * {@link addUserOverlays.directive:addUserOverlays addUserOverlays},
         * {@link changePasswordOverlay.directive:changePasswordOverlay changePasswordOverlay},
         * {@link editUserProfileOverlay.directive:editUserProfileOverlay editUserProfileOverlay},
         * {@link editGroupInfoOverlay.directive:editGroupInfoOverlay editGroupInfoOverlay},
         * and several {@link confirmationOverlay.directive:confirmationOverlay confirmationOverlays}.
         */
        .directive('userManagementOverlays', userManagementOverlays);

    userManagementOverlays.$inject = ['userStateService', 'userManagerService'];

    function userManagementOverlays(userStateService, userManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.errorMessage = '';

                dvm.deleteUser = function() {
                    dvm.um.deleteUser(dvm.state.selectedUser.username).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.selectedUser = undefined;
                        dvm.state.displayDeleteUserConfirm = false;
                    }, error => dvm.errorMessage = error);
                }
                dvm.deleteGroup = function() {
                    dvm.um.deleteGroup(dvm.state.selectedGroup.title).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.selectedGroup = undefined;
                        dvm.state.displayDeleteGroupConfirm = false;
                    }, error => dvm.errorMessage = error);
                }
                dvm.removeMember = function() {
                    dvm.um.deleteUserGroup(dvm.state.memberName, dvm.state.selectedGroup.title).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.memberName = '';
                        dvm.state.displayRemoveMemberConfirm = false;
                    }, error => dvm.errorMessage = error);
                }
            },
            templateUrl: 'modules/user-management/directives/userManagementOverlays/userManagementOverlays.html'
        };
    }
})();
