(function() {
    'use strict';

    angular
        .module('app')
        .config(config);

    config.$inject = ['$stateProvider', '$urlRouterProvider'];

    function config($stateProvider, $urlRouterProvider) {
        // Defaults to home
        $urlRouterProvider.otherwise('/login');

        // Sets the states
        $stateProvider
            .state('login', {
                url: '/login',
                views: {
                    'container': {
                        templateUrl: 'modules/login/login.html'
                    }
                }
            })
            .state('root', {
                abstract: true,
                views: {
                    'header': {
                        templateUrl: 'modules/nav/nav.html'
                    },
                    'footer': {
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
                }
            })
            .state('root.webtop', {
                url: '/webtop',
                views: {
                    'container@': {
                        templateUrl: 'modules/webtop/webtop.html'
                    }
                }
            })
            .state('root.catalog', {
                url: '/catalog',
                views: {
                    'container@': {
                        templateUrl: 'modules/catalog/catalog.html'
                    }
                }
            })
            .state('root.ontology-editor', {
                url: '/ontology-editor',
                views: {
                    'container@': {
                        templateUrl: 'modules/ontology-editor/ontology-editor.html'
                    }
                }
            });
    }
})();