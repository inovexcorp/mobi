(function() {
    'use strict';

    angular
        .module('datatypeTree', [])
        .directive('datatypeTree', datatypeTree);

        function datatypeTree() {
            return {
                restrict: 'E',
                remove: true,
                templateUrl: 'modules/ontology-editor/directives/datatypeTree/datatypeTree.html'
            }
        }
})();
