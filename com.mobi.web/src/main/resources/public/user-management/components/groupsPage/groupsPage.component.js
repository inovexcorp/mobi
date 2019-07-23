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
     * @name groupsPage.component:groupsPage
     * @requires shared.service:userStateService
     * @requires shared.service:userManagerService
     * @requires shared.service:loginManagerService
     * @requires shared.service:utilService
     * @requires shared.service:modalService
     *
     * @description
     * `groupsPage` is a component that creates a Bootstrap `row` div with two columns containing
     * {@link shared.component:block blocks} for selecting and editing a group. The left column contains a
     * {@link user-management.component:groupsList groupsList} block for selecting the current
     * {@link shared.service:userStateService#selectedGroup group} and buttons for creating, deleting, and searching for
     * a group. The right column contains a block for previewing and editing a group's description, a block for editing
     * the group's {@link user-management.component:permissionsInput permission}, and a block for viewing and editing
     * the {@link user-management.component:memberTable members} of the group. The component houses the methods for
     * deleting a group, removing group members, and adding group members.
     */
    const groupsPageComponent = {
        templateUrl: 'user-management/components/groupsPage/groupsPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: groupsPageComponentCtrl
    };

    groupsPageComponentCtrl.$inject = ['userStateService', 'userManagerService', 'loginManagerService', 'utilService', 'modalService'];

    function groupsPageComponentCtrl(userStateService, userManagerService, loginManagerService, utilService, modalService) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.um = userManagerService;
        dvm.lm = loginManagerService;
        dvm.util = utilService;
        dvm.roles = { admin: false };

        dvm.$onInit = function() {
            setRoles();
        }
        dvm.selectGroup = function(group) {
            dvm.state.selectedGroup = group;
            setRoles();
        }
        dvm.createGroup = function() {
            modalService.openModal('createGroupOverlay');
        }
        dvm.confirmDeleteGroup = function() {
            modalService.openConfirmModal('Are you sure you want to remove <strong>' + dvm.state.selectedGroup.title + '</strong>?', dvm.deleteGroup);
        }
        dvm.deleteGroup = function() {
            dvm.um.deleteGroup(dvm.state.selectedGroup.title)
                .then(() => {
                    dvm.state.selectedGroup = undefined;
                    setRoles();
                }, dvm.util.createErrorToast);
        }
        dvm.editDescription = function() {
            modalService.openModal('editGroupInfoOverlay');
        }
        dvm.changeRoles = function(value) {
            var request = value.admin ? dvm.um.addGroupRoles(dvm.state.selectedGroup.title, ['admin']) : dvm.um.deleteGroupRole(dvm.state.selectedGroup.title, 'admin');
            request.then(() => {
                dvm.roles = value;
            }, dvm.util.createErrorToast);
        }
        dvm.confirmRemoveMember = function(member) {
            modalService.openConfirmModal('Are you sure you want to remove <strong>' + member + '</strong> from <strong>' + dvm.state.selectedGroup.title + '</strong>?', () => dvm.removeMember(member));
        }
        dvm.removeMember = function(member) {
            dvm.um.deleteUserGroup(member, dvm.state.selectedGroup.title).then(_.noop, dvm.util.createErrorToast);
        }
        dvm.addMember = function(member) {
            dvm.um.addUserGroup(member, dvm.state.selectedGroup.title).then(_.noop, dvm.util.createErrorToast);
        }

        function setRoles() {
            dvm.roles.admin = _.includes(_.get(dvm.state.selectedGroup, 'roles', []), 'admin');
        }
    }

    angular.module('user-management')
        .component('groupsPage', groupsPageComponent);
})();
