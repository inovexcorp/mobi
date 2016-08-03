/*-
 * #%L
 * org.matonto.web
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
        .module('userManagementOverlays', [])
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

                dvm.delete = function() {
                    if (dvm.state.selectedGroup) {
                        dvm.um.deleteGroup(dvm.state.selectedGroup.name).then(response => {
                            dvm.state.selectedGroup = undefined;
                            dvm.state.showDeleteConfirm = false;
                        }, error => {
                            dvm.errorMessage = error;
                        });
                    } else if (dvm.state.selectedUser) {
                        dvm.um.deleteUser(dvm.state.selectedUser.username).then(response => {
                            dvm.state.selectedUser = undefined;
                            dvm.state.showDeleteConfirm = false;
                        }, error => {
                            dvm.errorMessage = error;
                        });
                    }
                };

                dvm.removeMember = function() {
                    dvm.um.deleteUserGroup(dvm.state.memberName, dvm.state.selectedGroup.name).then(response => {
                        dvm.state.memberName = '';
                        dvm.state.showRemoveMemberConfirm = false;
                    }, error => {
                        dvm.errorMessage = error;
                    });
                }
            },
            templateUrl: 'modules/user-management/directives/userManagementOverlays/userManagementOverlays.html'
        };
    }
})();