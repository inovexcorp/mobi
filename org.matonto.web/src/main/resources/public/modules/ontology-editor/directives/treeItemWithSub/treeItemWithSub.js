(function() {
    'use strict';

    angular
        .module('treeItemWithSub', [])
        .directive('treeItemWithSub', treeItemWithSub);

        function treeItemWithSub() {
            return {
                restrict: 'E',
                remove: true,
                scope: {
                    currentEntity: '=',
                    currentOntology: '=',
                    isActive: '=',
                    isOpened: '=',
                    onClick: '&'
                },
                templateUrl: 'modules/ontology-editor/directives/treeItemWithSub/treeItemWithSub.html'
            }
        }
})();
