(function() {
    'use strict';

    angular
        .module('treeItem', [])
        .directive('treeItem', treeItem);

        function treeItem() {
            return {
                restrict: 'E',
                remove: true,
                scope: {
                    currentEntity: '=',
                    currentOntology: '=',
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'modules/ontology-editor/directives/treeItem/treeItem.html'
            }
        }
})();
