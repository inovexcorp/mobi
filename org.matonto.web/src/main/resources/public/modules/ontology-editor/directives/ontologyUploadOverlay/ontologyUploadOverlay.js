(function() {
    'use strict';

    angular
        .module('ontologyUploadOverlay', [])
        .directive('ontologyUploadOverlay', ontologyUploadOverlay);

        function ontologyUploadOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyUploadOverlay/ontologyUploadOverlay.html'
            }
        }
})();
