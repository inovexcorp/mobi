(function() {
    'use strict';

    angular
        .module('app')
        .controller('WebtopController', WebtopController);

    WebtopController.$inject = ['$http'];

    function WebtopController($http) {
        var vm = this;

        activate();

        function activate() {

        }
    }
})();
