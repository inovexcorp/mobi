/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
         * @name sparqlResultTable
         *
         * @description
         * The `sparqlResultTable` module only provides the `sparqlResultTable` directive which
         * creates a table using the provided SPARQL spec JSON results.
         */
        .module('sparqlResultTable', [])
        /**
         * @ngdoc directive
         * @name sparqlResultTable.directive:sparqlResultTable
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the `sparqlResultTable` which create a table with a header row of binding names
         * and rows of the SPARQL query results provided in the SPARQL spec JSON format.
         *
         * @param {string[]} bindings The array of binding names for the SPARQl results
         * @param {Object[]} data The actual SPARQL query results
         */
        .directive('sparqlResultTable', sparqlResultTable);

        function sparqlResultTable() {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/directives/sparqlResultTable/sparqlResultTable.directive.html',
                replace: true,
                scope: {
                    bindings: '<',
                    data: '<',
                    headers: '<?'
                },
            }
        }
})();