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
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name user-management.component:usersPage
     * @requires shared.service:userStateService
     * @requires shared.service:userManagerService
     * @requires shared.service:loginManagerService
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * `usersPage` is a component that creates a Bootstrap `row` div with three columns containing
     * {@link shared.component:block blocks} for selecting and editing a user. The left column contains a
     * {@link user-management.component:usersList usersList} block for selecting the current
     * {@link shared.service:userStateService user} and buttons for creating, deleting, and searching for a user. The
     * center column contains a block for previewing and editing a user's profile information and a block for changing
     * a user's password. The right column contains a block for viewing and changing a user's
     * {@link user-management.component:permissionsInput permissions} and a block for viewing the groups a user is a
     * member of.
     */
    const usersPageComponent = {
        templateUrl: 'user-management/components/usersPage/usersPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: usersPageComponentCtrl
    };

    usersPageComponentCtrl.$inject = ['userStateService', 'userManagerService', 'loginManagerService', 'utilService', 'modalService'];

    function usersPageComponentCtrl(userStateService, userManagerService, loginManagerService, utilService, modalService) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.um = userManagerService;
        dvm.lm = loginManagerService;
        dvm.util = utilService;
        dvm.roles = {admin: false};

        dvm.$onInit = function() {
            setRoles();
        }
        dvm.selectUser = function(user) {
            dvm.state.selectedUser = user;
            setRoles();
        }
        dvm.confirmDeleteUser = function() {
            modalService.openConfirmModal('Are you sure you want to remove <strong>' + dvm.state.selectedUser.username + '</strong>?', dvm.deleteUser);
        }
        dvm.createUser = function() {
            modalService.openModal('createUserOverlay');
        }
        dvm.editProfile = function() {
            modalService.openModal('editUserProfileOverlay');
        }
        dvm.resetPassword = function() {
            modalService.openModal('resetPasswordOverlay');
        }
        dvm.deleteUser = function() {
            dvm.um.deleteUser(dvm.state.selectedUser.username).then(response => {
                dvm.state.selectedUser = undefined;
                setRoles();
            }, dvm.util.createErrorToast);
        }
        dvm.changeRoles = function(value) {
            var request = value.admin ? dvm.um.addUserRoles(dvm.state.selectedUser.username, ['admin']) : dvm.um.deleteUserRole(dvm.state.selectedUser.username, 'admin');
            request.then(() => {
                dvm.roles = value;
            }, dvm.util.createErrorToast);
        }
        dvm.getUserGroups = function() {
            return _.filter(dvm.um.groups, group => _.includes(group.members, dvm.state.selectedUser.username));
        }
        dvm.goToGroup = function(group) {
            dvm.state.showGroups = true;
            dvm.state.showUsers = false;
            dvm.state.selectedGroup = group;
        }

        function setRoles() {
            dvm.roles.admin = _.includes(_.get(dvm.state.selectedUser, 'roles', []), 'admin');
        }
    }

    angular.module('user-management')
        .component('usersPage', usersPageComponent);
})();
