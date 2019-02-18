(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name sparqlEditor
         *
         * @description
         * The `sparqlEditor` module only provides the `sparqlEditor` directive which creates a form
         * to input a SPARQL query, its prefixes, and submit it.
         */
        .module('sparqlEditor', [])
        /**
         * @ngdoc directive
         * @name sparqlEditor.directive:sparqlEditor
         * @scope
         * @restrict E
         * @requires sparqlManager.service:sparqlManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `sparqlEditor` is a directive that creates a {@link block.directive:block block} with a form for creating
         * a {@link sparqlManager.service:sparqlManagerService#queryString SPARQL query}, selecting
         * {@link sparqlManager.service:sparqlManagerService#prefixes prefixes} and a
         * {@link sparqlManager.service:sparqlManagerService#datasetRecordIRI dataset} and submitting it. The directive
         * is replaced by the contents of its template.
         */
        .directive('sparqlEditor', sparqlEditor);

        sparqlEditor.$inject = ['sparqlManagerService', 'prefixes'];

        function sparqlEditor(sparqlManagerService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'discover/query/directives/sparqlEditor/sparqlEditor.directive.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    dvm.sparql = sparqlManagerService;
                    dvm.prefixList = _.sortBy(_.map(prefixes, (value, key) => key + ': <' + value + '>'));
                    dvm.editorOptions = {
                        mode: 'application/sparql-query',
                        indentUnit: 4,
                        tabMode: 'indent',
                        lineNumbers: true,
                        lineWrapping: true,
                        matchBrackets: true
                    }
                }
            }
        }
})();
