(function() {
    'use strict';

    angular
        .module('ontologyDownloadOverlay', [])
        .directive('ontologyDownloadOverlay', ontologyDownloadOverlay);

        function ontologyDownloadOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/ontologyDownloadOverlay/ontologyDownloadOverlay.html',
                controllerAs: 'dvm',
                controller: ['REGEX', function(REGEX) {
                    var dvm = this;
                    dvm.fileNamePattern = REGEX.FILENAME;
                }]
            }
        }
})();
