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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name profileTab
         *
         * @description
         * The `profileTab` module only provides the `profileTab` directive which creates
         * a Bootstrap `row` with a form allowing the current user to change their profile
         * information.
         */
        .module('profileTab', [])
        /**
         * @ngdoc directive
         * @name profileTab.directive:profileTab
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires loginManager.service:loginManagerService
         *
         * @description
         * `profileTab` is a directive that creates a Bootstrap `row` with a
         * {@link block.directive:block block} that contains a form allowing the
         * current user to change their profile information. This information includes their
         * first name, last name, and email address. The directive is replaced by the content
         * of its template.
         */
        .directive('profileTab', profileTab);

        profileTab.$inject = ['userManagerService', 'loginManagerService'];

        function profileTab(userManagerService, loginManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.um = userManagerService;
                    dvm.lm = loginManagerService;
                    dvm.currentUser = angular.copy(_.find(dvm.um.users, {username: dvm.lm.currentUser}));

                    dvm.save = function() {
                        dvm.um.updateUser(dvm.currentUser.username, dvm.currentUser).then(response => {
                            dvm.errorMessage = '';
                            dvm.success = true;
                            dvm.form.$setPristine();
                        }, error => {
                            dvm.errorMessage = error;
                            dvm.success = false;
                        });
                    }
                },
                templateUrl: 'modules/settings/directives/profileTab/profileTab.html'
            }
        }
})();
