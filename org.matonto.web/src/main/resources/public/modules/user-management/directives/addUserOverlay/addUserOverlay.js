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
        .module('addUserOverlay', [])
        .directive('addUserOverlay', addUserOverlay);

    addUserOverlay.$inject = ['$q', 'userStateService', 'userManagerService'];

    function addUserOverlay($q, userStateService, userManagerService) {
        return {
            restrict: 'E',
            controllerAs: 'dvm',
            replace: true,
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;
                dvm.errorMessage = '';

                dvm.add = function () {
                    dvm.um.addUser(dvm.username, dvm.password).then(response => {
                        return dvm.um.addUserRole(dvm.username, 'user');
                    }, error => {
                        return $q.reject(error);
                    }).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.showAddUser = false;
                    }, error => {
                        dvm.errorMessage = error;
                    });
                };
                dvm.testUniqueness = function () {
                    dvm.form.username.$setValidity('uniqueUsername', !_.includes(_.map(dvm.um.users, 'username'), dvm.username));
                };
                dvm.confirmPassword = function (toConfirm) {
                    dvm.form.confirmPassword.$setValidity('samePassword', toConfirm === dvm.password);
                };
            },
            templateUrl: 'modules/user-management/directives/addUserOverlay/addUserOverlay.html'
        };
    }
})();