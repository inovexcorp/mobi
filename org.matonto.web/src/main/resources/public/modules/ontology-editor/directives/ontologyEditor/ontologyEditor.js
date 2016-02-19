(function() {
    'use strict';

    angular
        .module('ontologyEditor', [])
        .directive('ontologyEditor', ontologyEditor);

        function ontologyEditor() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyEditor/ontologyEditor.html'
            }
        }
})();
