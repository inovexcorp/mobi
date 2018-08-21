/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
                }
            })
            .state('root.activity-log', {
                url: '/activity-log',
                views: {
                    'container@': {
                        templateUrl: 'modules/activityLog/activityLog.html'
                    }
                },
                data: {
                    title: 'Activity Log'
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
                    title: 'Mapping Tool'
                }
            })
            .state('root.settings', {
                url: '/settings',
                views: {
                    'container@': {
                        templateUrl: 'modules/settings/settings.html'
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
                        templateUrl: 'modules/discover/discover.html'
                    }
                },
                data: {
                    title: 'Discover'
                }
            }).state('root.user-management', {
                url: '/user-management',
                views: {
                    'container@': {
                        templateUrl: 'modules/user-management/user-management.html'
                    }
                },
                data: {
                    title: 'User Management'
                }
            }).state('root.datasets', {
                url: '/datasets',
                views: {
                    'container@': {
                        templateUrl: 'modules/datasets/datasets.html'
                    }
                },
                data: {
                    title: 'Datasets'
                }
            }).state('root.analytics', {
                url: '/analytics',
                views: {
                    'container@': {
                        templateUrl: 'modules/analytics/analytics.html'
                    }
                },
                data: {
                    title: 'Analytics'
                }
            }).state('root.merge-requests', {
                url: '/merge-requests',
                views: {
                    'container@': {
                        templateUrl: 'modules/merge-requests/merge-requests.html'
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
