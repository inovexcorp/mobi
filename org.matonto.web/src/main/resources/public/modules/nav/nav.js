(function() {
    'use strict';

    angular
        .module('nav', ['loginManager'])
        .controller('NavController', NavController);

    NavController.$inject = ['$state', 'loginManagerService'];

    function NavController($state, loginManagerService) {
        var vm = this;
        vm.perspectives;

        activate();

        function activate() {
            getPerspectives();
        }

        // TODO: removing catalog and webtop from the navigation since they don't have anything yet
        function getPerspectives() {
            // Default perspectives
            vm.perspectives = [
                { icon: 'home', sref: 'root.home', isActive: $state.is('root.home'), name: 'Home' },
                /*{ icon: 'desktop', sref: 'root.webtop', isActive: $state.is('root.webtop'), name: 'Webtop' },*/
                { icon: 'pencil-square-o', sref: 'root.ontology-editor', isActive: $state.is('root.ontology-editor'), name: 'Editor'},
                { icon: 'map-o', sref: 'root.mapper', isActive: $state.is('root.mapper'), name: 'Map' },
                { icon: 'terminal', sref: 'root.sparql', isActive: $state.is('root.sparql'), name: 'SPARQL' },
                { icon: 'book', sref: 'root.catalog', isActive: $state.is('root.catalog'), name: 'Catalog' }
            ];
        }

        vm.logout = function() {
            loginManagerService.logout();
        }
    }
})();
