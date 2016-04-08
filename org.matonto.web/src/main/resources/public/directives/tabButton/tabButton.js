(function() {
    'use strict';

    angular
        .module('tabButton', [])
        .directive('tabButton', tabButton);

        function tabButton() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'directives/tabButton/tabButton.html'
            }
        }
})();
