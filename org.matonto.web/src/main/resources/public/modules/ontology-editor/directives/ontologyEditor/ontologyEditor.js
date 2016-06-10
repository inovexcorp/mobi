(function() {
    'use strict';

    angular
        .module('ontologyEditor', [])
        .directive('ontologyEditor', ontologyEditor);

        function ontologyEditor() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyEditor/ontologyEditor.html',
                controllerAs: 'dvm',
                controller: ['REGEX', function(REGEX) {
                    var dvm = this;
                    dvm.iriPattern = REGEX.IRI;
                }]
            }
        }
})();
