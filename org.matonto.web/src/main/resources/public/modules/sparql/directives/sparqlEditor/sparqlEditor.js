(function() {
    'use strict';

    angular
        .module('sparqlEditor', ['sparqlManager', 'prefixes'])
        .directive('sparqlEditor', sparqlEditor);

        function sparqlEditor() {
            return {
                restrict: 'E',
                templateUrl: 'modules/sparql/directives/sparqlEditor/sparqlEditor.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: ['sparqlManagerService', 'prefixes', function(sparqlManagerService, prefixes) {
                    var dvm = this;

                    dvm.sparqlManagerService = sparqlManagerService;

                    dvm.prefixList = _.map(prefixes, function(value, key) {
                        return key + ': <' + value + '>';
                    });

                    dvm.editorOptions = {
                        mode: 'application/sparql-query',
                        indentUnit: 4,
                        tabMode: 'indent',
                        lineNumbers: true,
                        lineWrapping: true,
                        matchBrackets: true
                    }
                }]
            }
        }
})();
