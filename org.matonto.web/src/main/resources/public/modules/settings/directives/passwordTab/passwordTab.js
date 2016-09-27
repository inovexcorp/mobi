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
(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name passwordTab
         *
         * @description 
         * The `passwordTab` module only provides the `passwordTab` directive which creates 
         * a Bootstrap `row` with a form allowing the current user to change their password.
         */
        .module('passwordTab', [])
        /**
         * @ngdoc directive
         * @name passwordTab.directive:passwordTab
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires loginManager.service:loginManagerService
         *
         * @description
         * `passwordTab` is a directive that creates a Bootstrap `row` with a 
         * {@link block.directive:block block} containing a form allowing the current user to 
         * change their password. The user must enter their current password in order to make 
         * a change. The new password is confirmed within a 
         * {@link passwordConfirmInput.directive:passwordConfirmInput passwordConfirmInput}. The 
         * directive is replaced by the content of its template.
         */
        .directive('passwordTab', passwordTab);

        passwordTab.$inject = ['$q', 'userManagerService', 'loginManagerService'];

        function passwordTab($q, userManagerService, loginManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.um = userManagerService;
                    dvm.lm = loginManagerService;
                    dvm.currentUser = _.find(dvm.um.users, {username: dvm.lm.currentUser});

                    dvm.save = function() {
                        dvm.um.updateUser(dvm.currentUser.username, {}, dvm.currentPassword, dvm.password).then(response => {
                            dvm.errorMessage = '';
                            dvm.success = true;
                        }, error => {
                            dvm.errorMessage = error;
                            dvm.success = false;
                        });
                    }
                },
                templateUrl: 'modules/settings/directives/passwordTab/passwordTab.html'
            }
        }
})();