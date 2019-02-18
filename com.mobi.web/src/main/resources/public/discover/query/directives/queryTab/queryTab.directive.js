(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name queryTab
         *
         * @description
         * The `queryTab` module only provides the `queryTab` directive which creates
         * the SPARQL editor tab.
         */
        .module('queryTab', [])
        /**
         * @ngdoc directive
         * @name sparqlResultTable.directive:queryTab
         * @scope
         * @restrict E
         *
         * @description
         * HTML contents in the SPARQL editor tab.
         */
        .directive('queryTab', queryTab);

        function queryTab() {
            return {
                restrict: 'E',
                templateUrl: 'discover/query/directives/queryTab/queryTab.directive.html',
                replace: true,
                scope: {}
            }
        }
})();