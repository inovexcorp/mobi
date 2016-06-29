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
        /**
         * @ngdoc overview
         * @name sparqlSideBar
         * @requires sparqlManager
         * 
         * @description
         * The `sparqlSideBar` module only provides the `sparqlSideBar` directive which
         * creates a left navigation of action buttons for the SPARQL Query Editor.
         */
        .module('sparqlSideBar', ['sparqlManager'])
        /**
         * @ngdoc directive
         * @name sparqlSideBar.directive:sparqlSideBar
         * @scope
         * @restrict E
         * @requires sparqlManager.service:sparqlManagerServicec
         *
         * @description 
         * `sparqlSideBar` is a directive that creates a "left-nav" div with buttons for SPARQL
         * query actions. The only action is executing the entered query.
         */
        .directive('sparqlSideBar', sparqlSideBar);

        sparqlSideBar.$inject = ['sparqlManagerService'];

        function sparqlSideBar(sparqlManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.sparql = sparqlManagerService;
                },
                templateUrl: 'modules/sparql/directives/sparqlSideBar/sparqlSideBar.html'
            }
        }
})();
