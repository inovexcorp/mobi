(function() {
    'use strict';

    angular
        .module('login', ['loginManager'])
        .controller('LoginController', LoginController);

    LoginController.$inject = ['loginManagerService'];

    function LoginController(loginManagerService) {
        var vm = this;

        vm.login = function(isValid) {
            loginManagerService.login(isValid, vm.form.username, vm.form.password)
                .then(function(valid) {
                    vm.showError = !valid;
                });
        }
    }
})();