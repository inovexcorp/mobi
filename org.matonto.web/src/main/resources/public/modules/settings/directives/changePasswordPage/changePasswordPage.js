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
        .module('changePasswordPage', [])
        .directive('changePasswordPage', changePasswordPage);

        changePasswordPage.$inject = ['$q', 'userManagerService', 'loginManagerService'];

        function changePasswordPage($q, userManagerService, loginManagerService) {
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
                        dvm.um.checkPassword(dvm.currentUser.username, dvm.currentPassword).then(response => {
                            dvm.form.currentPassword.$setValidity('matchesSavedPassword', true);
                            return dvm.um.updateUser(dvm.currentUser.username, undefined, dvm.password);
                        }, error => {
                            dvm.form.currentPassword.$setValidity('matchesSavedPassword', false);
                            return $q.reject(error);
                        }).then(response => {
                            dvm.errorMessage = '';
                            dvm.success = true;
                        }, error => {
                            dvm.errorMessage = error;
                            dvm.success = false;
                        });
                    }
                },
                templateUrl: 'modules/settings/directives/changePasswordPage/changePasswordPage.html'
            }
        }
})();