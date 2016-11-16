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
         * @name usersPage
         *
         * @description
         * The `usersPage` module only provides the `usersPage` directive which provides the
         * {@link usersList.directive:usersList usersList} and
         * {@link userEditor.directive:userEditor userEditor} directives.
         */
        .module('usersPage', [])
        /**
         * @ngdoc directive
         * @name usersPage.directive:usersPage
         * @scope
         * @restrict E
         * @requires userState.service:userStateService
         *
         * @description
         * `usersPage` is a directive that provides the {@link usersList.directive:usersList usersList}
         * and {@link userEditor.directive:userEditor userEditor} directives depending on the
         * {@link userState.service:userStateService state} of the user management page.
         */
        .directive('usersPage', usersPage);

    usersPage.$inject = ['$q', 'userStateService', 'userManagerService', 'loginManagerService'];

    function usersPage($q, userStateService, userManagerService, loginManagerService) {
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
                dvm.roles = {admin: _.includes(_.get(dvm.state.selectedUser, 'roles', []), 'admin')};

                $scope.$watch('dvm.state.selectedUser', function(newValue, oldValue) {
                    if (!_.isEqual(newValue, oldValue)) {
                        dvm.roles.admin = _.includes(dvm.state.selectedUser.roles, 'admin');
                    }
                });
                dvm.deleteUser = function() {
                    dvm.state.displayDeleteConfirm = true;
                }
                dvm.createUser = function() {
                    dvm.state.displayCreateUserOverlay = true;
                }
                dvm.editProfile = function() {
                    dvm.state.displayChangeProfileOverlay = true;
                }
                dvm.changePassword = function() {
                    dvm.state.displayChangePasswordOverlay = true;
                }
                dvm.changeRoles = function() {
                    var request = dvm.roles.admin ? dvm.um.addUserRole(dvm.state.selectedUser.username, 'admin') : dvm.um.deleteUserRole(dvm.state.selectedUser.username, 'admin');
                    request.then(response => {
                        dvm.permissionErrorMessage = '';
                    }, error => {
                        dvm.permissionErrorMessage = error;
                    });
                }
                dvm.getUserGroups = function() {
                    return _.filter(dvm.um.groups, group => _.includes(group.members, dvm.state.selectedUser.username));
                }
                dvm.goToGroup = function(group) {
                    dvm.state.showGroups = true;
                    dvm.state.showUsers = false;
                    dvm.state.selectedGroup = group;
                }
            }],
            templateUrl: 'modules/user-management/directives/usersPage/usersPage.html'
        };
    }
})();
