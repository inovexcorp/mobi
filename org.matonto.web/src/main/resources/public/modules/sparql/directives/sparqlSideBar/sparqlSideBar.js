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
