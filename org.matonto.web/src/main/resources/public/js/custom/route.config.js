(function() {
    'use strict';

    angular
        .module('app')
        .config(config)
        .run(run);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];

    function config($stateProvider, $urlRouterProvider) {
        // Defaults to login
        $urlRouterProvider.otherwise('/login');

        // Sets the states
        $stateProvider
            .state('login', {
                url: '/login',
                views: {
                    container: {
                        templateUrl: 'modules/login/login.html'
                    }
                },
                data: {
                    title: 'Login'
                }
            })
            .state('root', {
                abstract: true,
                resolve: {
                    authenticate: authenticate
                },
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

        authenticate.$inject = ['loginManagerService'];

        function authenticate(loginManagerService) {
            return loginManagerService.isAuthenticated();
        }
    }

    run.$inject = ['$rootScope', '$state'];

    function run($rootScope, $state) {
        $rootScope.$state = $state;
    }
})();
