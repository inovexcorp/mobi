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
         * @name addUserOverlays
         *
         * @description 
         * The `addUserOverlays` module only provides the `addUserOverlays` directive which creates
         * overlays for adding a user to MatOnto.
         */
        .module('addUserOverlays', [])
        /**
         * @ngdoc directive
         * @name addUserOverlays.directive:addUserOverlays
         * @scope
         * @restrict E
         * @requires $q
         * @requires $timeout
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description 
         * `addUserOverlays` is a directive that creates overlays with forms to add a user to Matonto.
         * The first ovelray provides a form for the basic information about the user. The second overlay
         * provides a form for settings the permissions and roles of the new user.
         */
        .directive('addUserOverlays', addUserOverlays);

    addUserOverlays.$inject = ['$q', '$timeout', 'userStateService', 'userManagerService'];

    function addUserOverlays($q, $timeout, userStateService, userManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.errorMessage = '';
                $timeout(function() {
                    dvm.step = 0;                
                });
                dvm.roles = {
                    admin: false
                };

                dvm.add = function () {
                    dvm.um.addUser(dvm.username, dvm.password).then(response => {
                        var requests = [dvm.um.addUserRole(dvm.username, 'user')];
                        if (dvm.roles.admin) {
                            requests.push(dvm.um.addUserGroup(dvm.username, 'admingroup'));
                        }
                        return $q.all(requests);
                    }, error => {
                        return $q.reject(error);
                    }).then(response => {
                        dvm.errorMessage = '';
                        dvm.step = 2;
                        dvm.state.showAddUser = false;
                    }, error => {
                        dvm.errorMessage = error;
                    });
                };
                dvm.testUniqueness = function () {
                    dvm.infoForm.username.$setValidity('uniqueUsername', !_.includes(_.map(dvm.um.users, 'username'), dvm.username));
                };
            },
            templateUrl: 'modules/user-management/directives/addUserOverlays/addUserOverlays.html'
        };
    }
})();