(function() {
    'use strict';

    angular
        .module('classTree', [])
        .directive('classTree', classTree);

        function classTree() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/classTree/classTree.html'
            }
        }
})();
