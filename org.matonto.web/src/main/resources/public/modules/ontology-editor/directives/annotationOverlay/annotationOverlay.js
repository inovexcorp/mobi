(function() {
    'use strict';

    angular
        .module('annotationOverlay', [])
        .directive('annotationOverlay', annotationOverlay);

        function annotationOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/annotationOverlay/annotationOverlay.html',
                controllerAs: 'dvm',
                controller: ['REGEX', function(REGEX) {
                    var dvm = this;
                    dvm.iriPattern = REGEX.IRI;
                }]
            }
        }
})();
