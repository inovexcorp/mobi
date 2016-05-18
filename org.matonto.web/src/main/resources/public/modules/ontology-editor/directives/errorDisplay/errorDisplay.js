(function() {
    'use strict';

    angular
        .module('errorDisplay', [])
        .directive('errorDisplay', errorDisplay);

        function errorDisplay() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: 'modules/ontology-editor/directives/errorDisplay/errorDisplay.html'
            }
        }
})();
