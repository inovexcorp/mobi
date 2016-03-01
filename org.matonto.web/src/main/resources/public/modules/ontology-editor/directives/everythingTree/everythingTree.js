(function() {
    'use strict';

    angular
        .module('everythingTree', [])
        .directive('everythingTree', everythingTree);

        function everythingTree() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/everythingTree/everythingTree.html'
            }
        }
})();
