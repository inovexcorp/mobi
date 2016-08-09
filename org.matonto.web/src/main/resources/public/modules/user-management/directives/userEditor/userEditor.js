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
        .module('userEditor', [])
        .directive('userEditor', userEditor);

    userEditor.$inject = ['$q', 'userStateService', 'userManagerService', 'loginManagerService'];

    function userEditor($q, userStateService, userManagerService, loginManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            replace: true,
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.lm = loginManagerService;

                dvm.success = false;
                dvm.changed = false;
                dvm.roles = {
                    admin: dvm.um.isAdmin(dvm.state.selectedUser.username)
                };

                dvm.save = function() {
                    var requests = [];
                    if (dvm.password) {
                        requests.push(dvm.um.updateUser(dvm.state.selectedUser.username, undefined, dvm.password));
                    }
                    if (dvm.roles.admin !== dvm.um.isAdmin(dvm.state.selectedUser.username)) {
                        if (dvm.roles.admin) {
                            requests.push(dvm.um.addUserGroup(dvm.state.selectedUser.username, 'admingroup'));
                        } else {
                            requests.push(dvm.um.deleteUserGroup(dvm.state.selectedUser.username, 'admingroup'));
                            requests.push(dvm.um.deleteUserRole(dvm.state.selectedUser.username, 'admin'));
                        }
                    }
                    if (requests.length) {
                        $q.all(requests).then(responses => {
                            dvm.errorMessage = '';
                            dvm.password = '';
                            dvm.toConfirm = '';
                            dvm.success = true;
                            dvm.form.$setPristine();
                            dvm.form.$setUntouched();
                        }, error => {
                            dvm.errorMessage = error;
                            dvm.success = false;
                        });
                    }
                }
            },
            templateUrl: 'modules/user-management/directives/userEditor/userEditor.html'
        };
    }
})();