(function() {
    'use strict';

    angular
        .module('ontologyUploadOverlay', [])
        .directive('ontologyUploadOverlay', ontologyUploadOverlay);

        function ontologyUploadOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyUploadOverlay/ontologyUploadOverlay.html'
            }
        }
})();
