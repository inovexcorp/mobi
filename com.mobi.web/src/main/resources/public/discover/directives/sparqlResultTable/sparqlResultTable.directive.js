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
                templateUrl: 'discover/directives/sparqlResultTable/sparqlResultTable.directive.html',
                replace: true,
                scope: {
                    bindings: '<',
                    data: '<',
                    headers: '<?'
                },
            }
        }
})();