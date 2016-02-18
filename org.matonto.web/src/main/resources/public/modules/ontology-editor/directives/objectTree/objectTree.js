(function() {
    'use strict';

    angular
        .module('objectTree', [])
        .directive('objectTree', objectTree);

        function objectTree() {
            return {
                restrict: 'E',
                transclude: true,
                remove: true,
                templateUrl: 'modules/ontology-editor/directives/objectTree/objectTree.html'
            }
        }
})();
