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
         * @requires $window
         *
         * @description 
         * `sparqlSideBar` is a directive that creates a "left-nav" div with buttons for SPARQL
         * query actions. These actions are executing the entered query and opening the user 
         * guide for the SPARQL Query Editor on the documentation site. The directive is 
         * replaced by the contents of its template.
         */
        .directive('sparqlSideBar', sparqlSideBar);

        sparqlSideBar.$inject = ['$window', 'sparqlManagerService'];

        function sparqlSideBar($window, sparqlManagerService) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.sparql = sparqlManagerService;

                    dvm.openDocs = function() {
                        $window.open("http://docs.matonto.org/#sparql_query_editor");
                    }
                },
                templateUrl: 'modules/sparql/directives/sparqlSideBar/sparqlSideBar.html'
            }
        }
})();
