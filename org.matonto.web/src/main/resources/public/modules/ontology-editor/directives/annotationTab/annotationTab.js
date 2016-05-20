(function() {
    'use strict';

    angular
        .module('annotationTab', [])
        .directive('annotationTab', annotationTab);

        function annotationTab() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/annotationTab/annotationTab.html'
            }
        }
})();
