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
         * @name createUserOverlays
         *
         * @description
         * The `createUserOverlays` module only provides the `createUserOverlays` directive which creates overlays
         * for adding a user to Mobi.
         */
        .module('createUserOverlays', [])
        /**
         * @ngdoc directive
         * @name createUserOverlays.directive:createUserOverlays
         * @scope
         * @restrict E
         * @requires $q
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `createUserOverlays` is a directive that creates overlays with forms to add a user to Matonto.
         * The first overlay provides a form for the basic information about the user including the username,
         * password, first name, last name, and email. The second overlay provides a form for settings the
         * permissions and roles of the new user.
         */
        .directive('createUserOverlays', createUserOverlays);

    createUserOverlays.$inject = ['$q', 'userStateService', 'userManagerService', 'REGEX'];

    function createUserOverlays($q, userStateService, userManagerService, REGEX) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.usernamePattern = REGEX.LOCALNAME;
                dvm.errorMessage = '';
                dvm.step = 0;
                dvm.roles = {admin: false};
                dvm.newUser = {
                    username: '',
                    roles: [],
                    firstName: '',
                    lastName: '',
                    email: ''
                };

                dvm.getUsernames = function() {
                    return _.map(dvm.um.users, 'username');
                }
                dvm.add = function() {
                    var roles = ['user'];
                    if (dvm.roles.admin) {
                        roles.push('admin');
                    }
                    dvm.um.addUser(dvm.newUser, dvm.password).then(response => dvm.um.addUserRoles(dvm.newUser.username, roles), $q.reject)
                        .then(response => {
                            dvm.errorMessage = '';
                            dvm.step = 2;
                            dvm.state.displayCreateUserOverlay = false;
                        }, error => dvm.errorMessage = error);
                }
            },
            templateUrl: 'modules/user-management/directives/createUserOverlays/createUserOverlays.html'
        };
    }
})();
