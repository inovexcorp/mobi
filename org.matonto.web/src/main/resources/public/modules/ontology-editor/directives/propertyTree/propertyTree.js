(function() {
    'use strict';

    angular
        .module('propertyTree', [])
        .directive('propertyTree', propertyTree);

        function propertyTree() {
            return {
                restrict: 'E',
                scope: {},
                templateUrl: 'modules/ontology-editor/directives/propertyTree/propertyTree.html'
            }
        }
})();
