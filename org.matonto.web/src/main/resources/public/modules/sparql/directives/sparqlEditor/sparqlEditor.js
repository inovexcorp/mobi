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
                    this.prefixList = [
                        'rdf: <' + prefixes.rdf + '>',
                        'rdfs: <' + prefixes.rdfs + '>',
                        'owl: <' + prefixes.owl + '>',
                        'dc: <' + prefixes.dc + '>',
                        'foaf: <' + prefixes.foaf + '>'
                    ];
                    this.prefixes = ['foaf: <' + prefixes.foaf + '>'];
                    this.editorOptions = {
                        mode: 'application/sparql-query',
                        indentUnit: 4,
                        tabMode: 'indent',
                        lineNumbers: true,
                        lineWrapping: true,
                        matchBrackets: true
                    }
                    this.sparqlService = sparqlService;
                }]
            }
        }
})();
