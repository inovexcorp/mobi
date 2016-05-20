(function() {
    'use strict';

    angular
        .module('annotationTree', [])
        .directive('annotationTree', annotationTree);

        function annotationTree() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/annotationTree/annotationTree.html'
            }
        }
})();
