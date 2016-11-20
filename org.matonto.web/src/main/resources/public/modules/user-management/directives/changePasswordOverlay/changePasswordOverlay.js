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
         * @name changePasswordOverlay
         *
         * @description
         * The `changePasswordOverlay` module only provides the `changePasswordOverlay` directive which creates
         * an overlay for changing the {@link userState.service:userStateService#selectedUser selected user's}
         * password in MatOnto.
         */
        .module('changePasswordOverlay', [])
        /**
         * @ngdoc directive
         * @name changePasswordOverlay.directive:changePasswordOverlay
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `changePasswordOverlay` is a directive that creates an overlay with a form to change the
         * {@link userState.service:userStateService#selectedUser selected user's} password in Matonto. The form
         * uses a {@link passwordConfirmInput.directive:passwordConfirmInput passwordConfirmInput} to confirm the
         * new password. The current password must be provided and correct for the change to persist. The directive
         * is replaced by the contents of its template.
         */
        .directive('changePasswordOverlay', changePasswordOverlay);

    changePasswordOverlay.$inject = ['userStateService', 'userManagerService'];

    function changePasswordOverlay(userStateService, userManagerService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                dvm.state = userStateService;
                dvm.um = userManagerService;

                dvm.set = function() {
                    dvm.um.updatePassword(dvm.state.selectedUser.username, dvm.currentPassword, dvm.password).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.displayChangePasswordOverlay = false;
                    }, error => dvm.errorMessage = error);
                }
            },
            templateUrl: 'modules/user-management/directives/changePasswordOverlay/changePasswordOverlay.html'
        };
    }
})();
