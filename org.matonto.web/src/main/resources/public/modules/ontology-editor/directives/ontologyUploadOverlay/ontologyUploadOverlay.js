(function() {
    'use strict';

    angular
        .module('ontologyUploadOverlay', [])
        .directive('ontologyUploadOverlay', ontologyUploadOverlay);

        function ontologyUploadOverlay() {
            return {
                restrict: 'E',
                transclude: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyUploadOverlay/ontologyUploadOverlay.html'
            }
        }
})();
