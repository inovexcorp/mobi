(function() {
    'use strict';
    /**
     * @ngdoc component
     * @name settings.component:passwordTab
     * @requires userManager.service:userManagerService
     * @requires loginManager.service:loginManagerService
     *
     * @description
     * `passwordTab` is a component that creates a Bootstrap `row` with a {@link block.directive:block block} containing a
     * form allowing the current user to change their password. The user must enter their current password in order to make
     * a change. The new password is confirmed within a
     * {@link passwordConfirmInput.directive:passwordConfirmInput passwordConfirmInput}.
     */
    const passwordTabComponent = {
        templateUrl: 'settings/components/passwordTab/passwordTab.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: passwordTabComponentCtrl
    };

    passwordTabComponentCtrl.$inject = ['userManagerService', 'loginManagerService', 'utilService'];

    function passwordTabComponentCtrl(userManagerService, loginManagerService, utilService) {
        var dvm = this;
        var util = utilService;
        dvm.um = userManagerService;
        dvm.lm = loginManagerService;

        dvm.save = function() {
            dvm.um.changePassword(dvm.lm.currentUser, dvm.currentPassword, dvm.password).then(response => {
                dvm.errorMessage = '';
                util.createSuccessToast('Password successfully saved');
                dvm.currentPassword = '';
                dvm.password = '';
                dvm.confirmedPassword = '';
                dvm.form.$setPristine();
            }, error => dvm.errorMessage = error);
        }
    }
    angular.module('settings')
        .component('passwordTab', passwordTabComponent);
})();