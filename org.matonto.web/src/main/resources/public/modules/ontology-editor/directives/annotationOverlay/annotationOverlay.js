(function() {
    'use strict';

    angular
        .module('annotationOverlay', [])
        .directive('annotationOverlay', annotationOverlay);

        function annotationOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/annotationOverlay/annotationOverlay.html'
            }
        }
})();
