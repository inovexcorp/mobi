/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name resetPasswordOverlay.component:resetPasswordOverlay
     * @requires shared.service:userManagerService
     * @requires shared.service:userStateService
     *
     * @description
     * `resetPasswordOverlay` is a component that creates content for a modal with a form to reset the
     * {@link shared.service:userStateService#selectedUser selected user's} password in Mobi. The form uses a
     * {@link shared.component:passwordConfirmInput passwordConfirmInput} to confirm the new password.
     * Meant to be used in conjunction with the {@link shared.service:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const resetPasswordOverlayComponent = {
        templateUrl: 'user-management/directives/resetPasswordOverlay/resetPasswordOverlay.component.html',
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: resetPasswordOverlayComponentCtrl,
    };

    resetPasswordOverlayComponentCtrl.$inject = ['userStateService', 'userManagerService'];

    function resetPasswordOverlayComponentCtrl(userStateService, userManagerService) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.um = userManagerService;

        dvm.set = function() {
            dvm.um.resetPassword(dvm.state.selectedUser.username, dvm.password)
                .then(response => {
                    dvm.errorMessage = '';
                    dvm.close();
                }, error => dvm.errorMessage = error);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name resetPasswordOverlay
         *
         * @description
         * The `resetPasswordOverlay` module only provides the `resetPasswordOverlay` component which creates content
         * for a modal to reset a user's password in Mobi.
         */
        .module('resetPasswordOverlay', [])
        .component('resetPasswordOverlay', resetPasswordOverlayComponent);
})();
