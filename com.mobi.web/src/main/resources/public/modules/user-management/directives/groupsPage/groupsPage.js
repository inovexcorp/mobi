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
         * @name groupsPage
         *
         * @description
         * The `groupsPage` module only provides the `groupsPage` directive which which creates a Bootstrap `row` with
         * {@link block.directive:block blocks} for selecting and editing a group in the
         * {@link userManager.service:userManagerServiec#groups groups list}.
         */
        .module('groupsPage', [])
        /**
         * @ngdoc directive
         * @name groupsPage.directive:groupsPage
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         * @requires userManager.service:userManagerService
         * @requires loginManager.service:loginManagerService
         * @requires util.service:utilService
         * @requires modal.service:modalService
         *
         * @description
         * `groupsPage` is a directive that creates a Bootstrap `row` div with two columns containing
         * {@link block.directive:block blocks} for selecting and editing a group. The left column contains a
         * {@link groupsList.directive:groupsList groupsList} block for selecting the current
         * {@link userState.service:userStateService#selectedGroup group} and buttons for creating, deleting, and
         * searching for a group. The right column contains a block for previewing and editing a group's description, a
         * block for editing the group's {@link permissionsInput.directive:permissionsInput permission}, and a block for
         * viewing and editing the {@link memberTable.directive:memberTable members} of the group. The directive houses
         * the methods for deleting a group, removing group members, and adding group members. The directive is replaced
         * by the contents of its template.
         */
        .directive('groupsPage', groupsPage);

    groupsPage.$inject = ['userStateService', 'userManagerService', 'loginManagerService', 'utilService', 'modalService'];

    function groupsPage(userStateService, userManagerService, loginManagerService, utilService, modalService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: ['$scope', function($scope) {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.lm = loginManagerService;
                dvm.util = utilService;
                dvm.roles = {admin: _.includes(_.get(dvm.state.selectedGroup, 'roles', []), 'admin')};

                $scope.$watch('dvm.state.selectedGroup', function(newValue, oldValue) {
                    if (!_.isEqual(newValue, oldValue)) {
                        dvm.roles.admin = _.includes(_.get(dvm.state.selectedGroup, 'roles', []), 'admin');
                    }
                });
                dvm.createGroup = function() {
                    modalService.openModal('createGroupOverlay');
                }
                dvm.confirmDeleteGroup = function() {
                    modalService.openConfirmModal('Are you sure you want to remove <strong>' + dvm.state.selectedGroup.title + '</strong>?', dvm.deleteGroup);
                }
                dvm.deleteGroup = function() {
                    dvm.um.deleteGroup(dvm.state.selectedGroup.title).then(response => {
                        dvm.state.selectedGroup = undefined;
                    }, dvm.util.createErrorToast);
                }
                dvm.editDescription = function() {
                    modalService.openModal('editGroupInfoOverlay');
                }
                dvm.changeRoles = function() {
                    var request = dvm.roles.admin ? dvm.um.addGroupRoles(dvm.state.selectedGroup.title, ['admin']) : dvm.um.deleteGroupRole(dvm.state.selectedGroup.title, 'admin');
                    request.then(angular.noop, dvm.util.createErrorToast);
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
            }],
            templateUrl: 'modules/user-management/directives/groupsPage/groupsPage.html'
        };
    }
})();
