(function() {
    'use strict';

    angular
        .module('app')
        .config(config)
        .run(run);

    config.$inject = ['$stateProvider', '$urlRouterProvider', 'uiSelectConfig'];

    function config($stateProvider, $urlRouterProvider, uiSelectConfig) {
        // Sets proper style for the ui-select directives
        uiSelectConfig.theme = 'bootstrap';

        // Defaults to login
        $urlRouterProvider.otherwise('/login');

        // Sets the states
        $stateProvider
            .state('login', {
                url: '/login',
                views: {
                    container: {
                        templateUrl: 'login/login.module.html'
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
                }
            })
            .state('root.home', {
                url: '/home',
                views: {
                    'container@': {
                        template: '<home-page></home-page>'
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
                        templateUrl: 'webtop/webtop.html'
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
                        template: '<catalog-page></catalog-page>'
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
                        templateUrl: 'ontology-editor/ontology-editor.module.html'
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
                        templateUrl: 'mapper/mapper.module.html'
                    }
                },
                data: {
                    title: 'Mapping Tool'
                }
            })
            .state('root.settings', {
                url: '/settings',
                views: {
                    'container@': {
                        template: '<settings-page></settings-page>'
                    }
                },
                data: {
                    title: 'Settings'
                }
            })
            .state('root.discover', {
                url: '/discover',
                views: {
                    'container@': {
                        templateUrl: 'discover/discover.module.html'
                    }
                },
                data: {
                    title: 'Discover'
                }
            }).state('root.user-management', {
                url: '/user-management',
                views: {
                    'container@': {
                        templateUrl: 'user-management/user-management.module.html'
                    }
                },
                data: {
                    title: 'User Management'
                }
            }).state('root.datasets', {
                url: '/datasets',
                views: {
                    'container@': {
                        templateUrl: 'datasets/datasets.module.html'
                    }
                },
                data: {
                    title: 'Datasets'
                }
            }).state('root.merge-requests', {
                url: '/merge-requests',
                views: {
                    'container@': {
                        templateUrl: 'merge-requests/merge-requests.module.html'
                    }
                },
                data: {
                    title: 'Merge Requests'
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
