(function() {
    'use strict';

    angular
        .module('ontologyOpenOverlay', [])
        .directive('ontologyOpenOverlay', ontologyOpenOverlay);

        function ontologyOpenOverlay() {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyOpenOverlay/ontologyOpenOverlay.html'
            }
        }
})();
