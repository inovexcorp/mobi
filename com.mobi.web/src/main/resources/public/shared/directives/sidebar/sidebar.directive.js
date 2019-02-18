(function() {
    'use strict';

    sidebar.$inject = ['$rootScope', '$state', 'loginManagerService', 'userManagerService'];

    function sidebar($rootScope, $state, loginManagerService, userManagerService) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;
                dvm.lm = loginManagerService;
                dvm.um = userManagerService;

                dvm.perspectives = [
                    { icon: 'home', sref: 'root.home', isActive: $state.is('root.home'), name: 'Home' },
                    { icon: 'book', sref: 'root.catalog', isActive: $state.is('root.catalog'), name: 'Catalog' },
                    { icon: 'pencil-square-o', sref: 'root.ontology-editor', isActive: $state.is('root.ontology-editor'), name: 'Ontology Editor'},
                    { icon: 'envelope-o', sref: 'root.merge-requests', isActive: $state.is('root.merge-requests'), name: 'Merge Requests' },
                    { icon: 'map-o', sref: 'root.mapper', isActive: $state.is('root.mapper'), name: 'Mapping Tool' },
                    { icon: 'database', sref: 'root.datasets', isActive: $state.is('root.datasets'), name: 'Datasets' },
                    { icon: 'search', sref: 'root.discover', isActive: $state.is('root.discover'), name: 'Discover' },
                ];

                dvm.toggle = function() {
                    $rootScope.collapsedNav = !$rootScope.collapsedNav;
                }
                dvm.getUserDisplay = function() {
                    var user = _.find(dvm.um.users, {'iri': dvm.lm.currentUserIRI});
                    return _.get(user, 'firstName') || _.get(user, 'username');
                }
            },
            templateUrl: 'shared/directives/sidebar/sidebar.directive.html'
        }
    }

    angular
        .module('sidebar', [])
        .directive('sidebar', sidebar);
})();
