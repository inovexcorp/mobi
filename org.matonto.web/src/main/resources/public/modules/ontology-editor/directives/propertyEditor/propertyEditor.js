(function() {
    'use strict';

    angular
        .module('propertyEditor', [])
        .directive('propertyEditor', propertyEditor);

        function propertyEditor() {
            return {
                restrict: 'E',
                transclude: true,
                templateUrl: 'modules/ontology-editor/directives/propertyEditor/propertyEditor.html'
            }
        }
})();
