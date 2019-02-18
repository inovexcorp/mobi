(function() {
    'use strict';

    function circleButtonStack() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/circleButtonStack/circleButtonStack.directive.html'
        }
    }

    angular
        .module('circleButtonStack', [])
        .directive('circleButtonStack', circleButtonStack);
})();
