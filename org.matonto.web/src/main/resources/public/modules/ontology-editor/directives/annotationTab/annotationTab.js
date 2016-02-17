(function() {
    'use strict';

    angular
        .module('annotationTab', [])
        .directive('annotationTab', annotationTab);

        function annotationTab() {
            return {
                restrict: 'E',
                transclude: true,
                templateUrl: 'modules/ontology-editor/directives/annotationTab/annotationTab.html'
            }
        }
})();
