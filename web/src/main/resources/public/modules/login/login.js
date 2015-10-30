(function() {
    'use strict';

    angular
        .module('app')
        .controller('LoginController', LoginController);

    LoginController.$inject = ['$state'];

    function LoginController($state) {
        var vm = this;
        vm.submit = submit;

        activate();

        function activate() {

        }

        function submit(isValid) {
            if(isValid) {
                $state.go('root.home');
            }
        }
    }
})();