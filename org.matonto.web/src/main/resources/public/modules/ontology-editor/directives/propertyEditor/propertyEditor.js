(function() {
    'use strict';

    angular
        .module('propertyEditor', [])
        .directive('propertyEditor', propertyEditor);

        function propertyEditor() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/propertyEditor/propertyEditor.html'
            }
        }
})();
