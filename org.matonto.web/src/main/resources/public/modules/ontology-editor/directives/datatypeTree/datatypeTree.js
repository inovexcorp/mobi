(function() {
    'use strict';

    angular
        .module('datatypeTree', [])
        .directive('datatypeTree', datatypeTree);

        function datatypeTree() {
            return {
                restrict: 'E',
                transclude: true,
                remove: true,
                templateUrl: 'modules/ontology-editor/directives/datatypeTree/datatypeTree.html'
            }
        }
})();
