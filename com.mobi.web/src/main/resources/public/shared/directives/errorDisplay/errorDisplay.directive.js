(function() {
    'use strict';

    function errorDisplay() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            templateUrl: 'shared/directives/errorDisplay/errorDisplay.directive.html',
            scope: {}
        }
    }

    angular
        .module('errorDisplay', [])
        .directive('errorDisplay', errorDisplay);
})();
