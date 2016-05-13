(function() {
    'use strict';

    angular
        .module('createAnnotationOverlay', [])
        .directive('createAnnotationOverlay', createAnnotationOverlay);

        function createAnnotationOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/createAnnotationOverlay/createAnnotationOverlay.html',
                controllerAs: 'dvm',
                controller: ['REGEX', function(REGEX) {
                    var dvm = this;
                    dvm.iriPattern = REGEX.IRI;
                }]
            }
        }
})();
