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
         * The `groupsPage` module only provides the `groupsPage` directive which provides the
         * {@link groupsList.directive:groupsList groupsList} and
         * {@link groupEditor.directive:groupEditor groupEditor} directives.
         */
        .module('groupsPage', [])
        /**
         * @ngdoc directive
         * @name groupsPage.directive:groupsPage
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         *
         * @description
         * `groupsPage` is a directive that provides the {@link groupsList.directive:groupsList groupsList}
         * and {@link groupEditor.directive:groupEditor groupEditor} directives depending on the
         * {@link userState.service:userStateService state} of the user management page.
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
                    dvm.state.displayDeleteConfirm = true;
                }
                dvm.editDescription = function() {
                    console.log('Edit Description');
                }
                dvm.removeMember = function() {
                    dvm.state.displayRemoveMemberConfirm = true;
                }
                dvm.addMember = function() {
                    dvm.um.addUserGroup(dvm.state.memberName, dvm.state.selectedGroup.name).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.memberName = '';
                    }, error => {
                        dvm.errorMessage = error;
                    });
                }
            },
            templateUrl: 'modules/user-management/directives/groupsPage/groupsPage.html'
        };
    }
})();
