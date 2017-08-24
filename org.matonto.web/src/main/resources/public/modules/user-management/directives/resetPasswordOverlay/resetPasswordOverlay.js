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
         * @name resetPasswordOverlay
         *
         * @description
         * The `resetPasswordOverlay` module only provides the `resetPasswordOverlay` directive which creates
         * an overlay for resetting the {@link userState.service:userStateService#selectedUser selected user's}
         * password in Mobi.
         */
        .module('resetPasswordOverlay', [])
        /**
         * @ngdoc directive
         * @name resetPasswordOverlay.directive:resetPasswordOverlay
         * @scope
         * @restrict E
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `resetPasswordOverlay` is a directive that creates an overlay with a form to reset the
         * {@link userState.service:userStateService#selectedUser selected user's} password in Matonto. The form
         * uses a {@link passwordConfirmInput.directive:passwordConfirmInput passwordConfirmInput} to confirm the
         * new password. The directive is replaced by the contents of its template.
         */
        .directive('resetPasswordOverlay', resetPasswordOverlay);

    resetPasswordOverlay.$inject = ['userStateService', 'userManagerService'];

    function resetPasswordOverlay(userStateService, userManagerService) {
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
                    dvm.um.resetPassword(dvm.state.selectedUser.username, dvm.password).then(response => {
                        dvm.errorMessage = '';
                        dvm.state.displayResetPasswordOverlay = false;
                    }, error => dvm.errorMessage = error);
                }
            },
            templateUrl: 'modules/user-management/directives/resetPasswordOverlay/resetPasswordOverlay.html'
        };
    }
})();
