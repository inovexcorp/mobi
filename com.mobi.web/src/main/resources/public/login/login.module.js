(function() {
    'use strict';

    angular
        .module('login', [])
        .controller('LoginController', LoginController);

    LoginController.$inject = ['loginManagerService'];

    function LoginController(loginManagerService) {
        var vm = this;
        vm.errorMessage = '';

        vm.login = function() {
            loginManagerService.login(vm.form.username, vm.form.password)
                .then(() => vm.errorMessage = '', errorMessage => vm.errorMessage = errorMessage);
        }
    }
})();