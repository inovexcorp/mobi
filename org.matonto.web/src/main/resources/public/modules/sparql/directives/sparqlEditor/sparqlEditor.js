(function() {
    'use strict';

    angular
        .module('sparqlEditor', ['sparql', 'prefixes'])
        .directive('sparqlEditor', sparqlEditor);

        function sparqlEditor() {
            return {
                restrict: 'E',
                templateUrl: 'modules/sparql/directives/sparqlEditor/sparqlEditor.html',
                replace: true,
                scope: {},
                controllerAs: 'dvm',
                controller: ['sparqlService', 'prefixes', function(sparqlService, prefixes) {
                    var self = this;

                    self.prefixList = [];
                    self.sparqlService = sparqlService;

                    self.editorOptions = {
                        mode: 'application/sparql-query',
                        indentUnit: 4,
                        tabMode: 'indent',
                        lineNumbers: true,
                        lineWrapping: true,
                        matchBrackets: true
                    }

                    _.forOwn(prefixes, function(value, key) {
                        self.prefixList.push(key + ': <' + value + '>');
                    });
                }]
            }
        }
})();
