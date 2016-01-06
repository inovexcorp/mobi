(function() {
    'use strict';

    angular
        .module('login', ['loginManager'])
        .controller('LoginController', LoginController);

    LoginController.$inject = ['loginManagerService'];

    function LoginController(loginManagerService) {
        var vm = this;

        vm.login = function(isValid) {
            vm.showError = !loginManagerService.login(isValid, vm.form.email, vm.form.password);
        }
    }
})();