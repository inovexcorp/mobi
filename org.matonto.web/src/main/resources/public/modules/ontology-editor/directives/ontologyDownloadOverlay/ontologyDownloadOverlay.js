(function() {
    'use strict';

    angular
        .module('ontologyDownloadOverlay', [])
        .directive('ontologyDownloadOverlay', ontologyDownloadOverlay);

        function ontologyDownloadOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.html'
            }
        }
})();
