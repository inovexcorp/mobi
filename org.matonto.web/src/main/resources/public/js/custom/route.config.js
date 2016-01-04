(function() {
    'use strict';

    angular
        .module('app')
        .config(config)
        .run(run);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];

    function config($stateProvider, $urlRouterProvider) {
        // Defaults to home
        $urlRouterProvider.otherwise('/home');

        // Sets the states
        $stateProvider
            .state('root', {
                abstract: true,
                views: {
                    header: {
                        templateUrl: 'modules/nav/nav.html'
                    },
                    footer: {
                        templateUrl: 'modules/footer/footer.html'
                    }
                }
            })
            .state('root.home', {
                url: '/home',
                views: {
                    'container@': {
                        templateUrl: 'modules/home/home.html'
                    }
                },
                data: {
                    title: 'Home'
                }
            })
            .state('root.webtop', {
                url: '/webtop',
                views: {
                    'container@': {
                        templateUrl: 'modules/webtop/webtop.html'
                    }
                },
                data: {
                    title: 'Webtop'
                }
            })
            .state('root.catalog', {
                url: '/catalog',
                views: {
                    'container@': {
                        templateUrl: 'modules/catalog/catalog.html'
                    }
                },
                data: {
                    title: 'Catalog'
                }
            })
            .state('root.ontology-editor', {
                url: '/ontology-editor',
                views: {
                    'container@': {
                        templateUrl: 'modules/ontology-editor/ontology-editor.html'
                    }
                },
                data: {
                    title: 'Ontology Editor'
                }
            })
            .state('root.mapper', {
                url: '/mapper',
                views: {
                    'container@': {
                        templateUrl: 'modules/mapper/mapper.html'
                    }
                },
                data: {
                    title: 'Mapper'
                }
            });
    }

    run.$inject = ['$rootScope', '$state'];

    function run($rootScope, $state) {
        $rootScope.$state = $state;
    }
})();
