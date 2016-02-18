(function() {
    'use strict';

    angular
        .module('treeItem', [])
        .directive('treeItem', treeItem);

        function treeItem() {
            return {
                restrict: 'E',
                transclude: true,
                remove: true,
                scope: {
                    currentEntity: '=',
                    currentOntology: '=',
                    hasIcon: '=',
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'modules/ontology-editor/directives/treeItem/treeItem.html'
            }
        }
})();
