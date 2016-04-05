(function() {
    'use strict';

    angular
        .module('propertyTree', [])
        .directive('propertyTree', propertyTree);

        function propertyTree() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/propertyTree/propertyTree.html',
                link: function(scope, element, attrs) {
                    scope.headerText = attrs.headerText;
                    scope.propertyType = attrs.propertyType;
                }
            }
        }
})();
