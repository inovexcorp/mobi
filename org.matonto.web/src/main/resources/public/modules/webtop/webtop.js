(function() {
    'use strict';

    angular
        .module('webtop', ['widget'])
        .controller('WebtopController', WebtopController);

    WebtopController.$inject = ['$http'];

    function WebtopController($http) {
        var vm = this;

        activate();

        function activate() {

        }
    }
})();
