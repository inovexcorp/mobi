(function () {
    'use strict';

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
        /**
         * @ngdoc component
         * @name resetPasswordOverlay.component:resetPasswordOverlay
         * @requires userManager.service:userManagerService
         * @requires userState.service:userStateService
         *
         * @description
         * `resetPasswordOverlay` is a component that creates content for a modal with a form to reset the
         * {@link userState.service:userStateService#selectedUser selected user's} password in Mobi. The form uses a
         * {@link passwordConfirmInput.directive:passwordConfirmInput passwordConfirmInput} to confirm the new password.
         * Meant to be used in conjunction with the {@link modalService.directive:modalService}.
         *
         * @param {Function} close A function that closes the modal
         * @param {Function} dismiss A function that dismisses the modal
         */
        .component('resetPasswordOverlay', {
            bindings: {
                close: '&',
                dismiss: '&'
            },
            controllerAs: 'dvm',
            controller: ['userStateService', 'userManagerService', ResetPasswordOverlayController],
            templateUrl: 'user-management/directives/resetPasswordOverlay/resetPasswordOverlay.component.html'
        });

    function ResetPasswordOverlayController(userStateService, userManagerService) {
        var dvm = this;
        dvm.state = userStateService;
        dvm.um = userManagerService;

        dvm.set = function() {
            dvm.um.resetPassword(dvm.state.selectedUser.username, dvm.password).then(response => {
                dvm.errorMessage = '';
                dvm.close();
            }, error => dvm.errorMessage = error);
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }
    }
})();
