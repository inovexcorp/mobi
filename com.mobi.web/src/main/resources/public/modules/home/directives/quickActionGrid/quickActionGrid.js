/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
(function () {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name quickActionGrid
         *
         * @description
         * The `quickActionGrid` module only provides the `quickActionGrid` directive which creates a Bootstrap `.card`
         * with a grid of common actions in the application.
         */
        .module('quickActionGrid', [])
        /**
         * @ngdoc directive
         * @name quickActionGrid.directive:quickActionGrid
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires discoverState.service:discoverStateService
         *
         * @description
         * `quickActionGrid` is a directive which creates a Bootstrap `.card` containing a grid of links to perform
         * common actions in the application. These actions are searching the catalog, opening an ontology, reading the
         * documentation, exploring data, querying data, and ingesting data. The directive is replaced by the contents
         * of its template.
         */
        .directive('quickActionGrid', quickActionGrid);

    quickActionGrid.$inject = ['$window', '$state', 'ontologyStateService', 'discoverStateService'];

    function quickActionGrid($window, $state, ontologyStateService, discoverStateService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {},
            controller: function() {
                var dvm = this;
                var os = ontologyStateService;
                var ds = discoverStateService;

                dvm.searchTheCatalog = function() {
                    $state.go('root.catalog');
                }
                dvm.openAnOntology = function() {
                    $state.go('root.ontology-editor');
                    if (!_.isEmpty(os.listItem)) {
                        os.listItem.active = false;
                    }
                    os.listItem = {};
                }
                dvm.readTheDocumentation = function() {
                    $window.open('https://mobi.inovexcorp.com/docs/', '_blank');
                }
                dvm.exploreData = function() {
                    $state.go('root.discover');
                    ds.explore.active = true;
                    ds.search.active = false;
                    ds.query.active = false;
                }
                dvm.queryData = function() {
                    $state.go('root.discover');
                    ds.explore.active = false;
                    ds.search.active = false;
                    ds.query.active = true;
                }
                dvm.ingestData = function() {
                    $state.go('root.mapper');
                }

                var actions = [
                    {
                        title: 'Search the Catalog',
                        icon: 'fa-book',
                        action: dvm.searchTheCatalog
                    },
                    {
                        title: 'Open an Ontology',
                        icon: 'fa-folder-open',
                        action: dvm.openAnOntology
                    },
                    {
                        title: 'Read the Documentation',
                        icon: 'fa-book',
                        action: dvm.readTheDocumentation
                    },
                    {
                        title: 'Explore Data',
                        icon: 'fa-database',
                        action: dvm.exploreData
                    },
                    {
                        title: 'Query Data',
                        icon: 'fa-search',
                        action: dvm.queryData
                    },
                    {
                        title: 'Ingest Data',
                        icon: 'fa-map',
                        action: dvm.ingestData
                    },
                ];
                dvm.actions = _.chunk(actions, 3);
            },
            templateUrl: 'modules/home/directives/quickActionGrid/quickActionGrid.html'
        };
    }
})();
