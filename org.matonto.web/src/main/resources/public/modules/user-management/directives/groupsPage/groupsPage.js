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
        /**
         * @ngdoc overview
         * @name groupsPage
         *
         * @description
         * The `groupsPage` module only provides the `groupsPage` directive which which creates
         * a Bootstrap `row` with {@link block.directive:block blocks} for selecting and editing
         * a group in the {@link userManager.service:userManagerServiec#groups groups list}.
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
         *
         * @description
         * `groupsPage` is a directive that creates a Bootstrap `row` div with two columns
         * containing {@link block.directive:block blocks} for selecting and editing a group.
         * The left column contains a {@link groupsList.directive:groupsList groupsList} block
         * for selecting the current {@link userState.service:userStateService#selectedGroup group}
         * and buttons for creating, deleting, and searching for a group. The right column contains
         * a block for previewing and editing a group's description and a block for viewing and
         * editing the {@link memberTable.directive:memberTable members} of the group. The directive
         * is replaced by the contents of its template.
         */
        .directive('groupsPage', groupsPage);

    groupsPage.$inject = ['userStateService', 'userManagerService', 'loginManagerService'];

    function groupsPage(userStateService, userManagerService, loginManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.lm = loginManagerService;

                dvm.createGroup = function() {
                    dvm.state.displayCreateGroupOverlay = true;
                }
                dvm.deleteGroup = function() {
                    dvm.state.displayDeleteGroupConfirm = true;
                }
                dvm.editDescription = function() {
                    dvm.state.displayEditGroupInfoOverlay = true;
                }
                dvm.removeMember = function() {
                    dvm.state.displayRemoveMemberConfirm = true;
                }
                dvm.addMember = function() {
                    dvm.um.addUserGroup(dvm.state.memberName, dvm.state.selectedGroup.title).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.memberName = '';
                    }, error => dvm.errorMessage = error);
                }
            },
            templateUrl: 'modules/user-management/directives/groupsPage/groupsPage.html'
        };
    }
})();
