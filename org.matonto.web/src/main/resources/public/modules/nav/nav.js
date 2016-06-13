/*-
 * #%L
 * org.matonto.web
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
