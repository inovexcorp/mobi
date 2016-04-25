(function() {
    'use strict';

    angular
        .module('ontologyEditor', [])
        .directive('ontologyEditor', ontologyEditor);

        function ontologyEditor() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyEditor/ontologyEditor.html',
                controllerAs: 'dvm',
                controller: ['REGEX', function(REGEX) {
                    var dvm = this;

                    dvm.getIriPattern = function() {
                        return REGEX.IRI;
                    }
                }]
            }
        }
})();
