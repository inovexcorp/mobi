(function() {
    'use strict';

    angular
        .module('tabButtonContainer', [])
        .directive('tabButtonContainer', tabButtonContainer);

        function tabButtonContainer() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: 'directives/tabButtonContainer/tabButtonContainer.html'
            }
        }
})();