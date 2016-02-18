(function() {
    'use strict';

    angular
        .module('everythingTree', [])
        .directive('everythingTree', everythingTree);

        function everythingTree() {
            return {
                restrict: 'E',
                transclude: true,
                remove: true,
                templateUrl: 'modules/ontology-editor/directives/everythingTree/everythingTree.html'
            }
        }
})();
