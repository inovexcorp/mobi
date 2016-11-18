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
         * The `createUserOverlays` module only provides the `createUserOverlays` directive which creates
         * overlays for adding a user to MatOnto.
         */
        .module('createUserOverlays', [])
        /**
         * @ngdoc directive
         * @name createUserOverlays.directive:createUserOverlays
         * @scope
         * @restrict E
         * @requires $q
         * @requires $timeout
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `createUserOverlays` is a directive that creates overlays with forms to add a user to Matonto.
         * The first overlay provides a form for the basic information about the user including the username,
         * password, first name, last name, and email. The second overlay provides a form for settings the
         * permissions and roles of the new user.
         */
        .directive('createUserOverlays', createUserOverlays)
        /**
         * @ngdoc directive
         * @name mappingNameInput.directive:uniqueUsername
         * @restrict A
         * @requires $parse
         * @requires userManager.service:userManagerService
         *
         * @description
         * `uniqueUsername` is a directive which tests whether the ngModel value is in the list of saved
         * {@link userManager.service:userManagerService#users username}. It requires the parent
         * element to have an ngModel. If the ngModel value has already been used as a username,
         * it sets the uniqueUsername validity of the parent element to false.
         */
        .directive('uniqueUsername', uniqueUsername);

    uniqueUsername.$inject = ['$parse', 'userManagerService'];

    function uniqueUsername($parse, userManagerService) {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, el, attrs, ctrl) {
                ctrl.$validators.uniqueUsername = function(modelValue, viewValue) {
                    var value = modelValue || viewValue;
                    if (ctrl.$isEmpty(value)) {
                        return true;
                    }
                    return !_.includes(_.map(userManagerService.users, 'username'), value);
                }
            }
        }
    }

    createUserOverlays.$inject = ['$q', 'userStateService', 'userManagerService'];

    function createUserOverlays($q, userStateService, userManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
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

                dvm.add = function () {
                    dvm.um.addUser(dvm.newUser, dvm.password).then(response => {
                        var requests = [dvm.um.addUserRole(dvm.newUser.username, 'user')];
                        if (dvm.roles.admin) {
                            requests.push(dvm.um.addUserRole(dvm.newUser.username, 'admin'));
                        }
                        return $q.all(requests);
                    }, error => {
                        return $q.reject(error);
                    }).then(response => {
                        dvm.errorMessage = '';
                        dvm.step = 2;
                        dvm.state.displayCreateUserOverlay = false;
                    }, error => {
                        dvm.errorMessage = error;
                    });
                };
            },
            templateUrl: 'modules/user-management/directives/createUserOverlays/createUserOverlays.html'
        };
    }
})();
