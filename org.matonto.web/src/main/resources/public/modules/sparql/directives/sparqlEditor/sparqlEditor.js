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
                    var self = this;

                    self.sparqlManagerService = sparqlManagerService;

                    self.prefixList = _.map(prefixes, function(value, key) {
                        return key + ': <' + value + '>';
                    });

                    self.editorOptions = {
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
