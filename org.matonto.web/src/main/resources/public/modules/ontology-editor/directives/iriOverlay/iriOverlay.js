(function() {
    'use strict';

    angular
        .module('iriOverlay', [])
        .directive('iriOverlay', iriOverlay);

        function iriOverlay() {
            return {
                restrict: 'E',
                templateUrl: 'modules/ontology-editor/directives/iriOverlay/iriOverlay.html'
            }
        }
})();
