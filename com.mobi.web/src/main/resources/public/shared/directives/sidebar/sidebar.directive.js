/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
