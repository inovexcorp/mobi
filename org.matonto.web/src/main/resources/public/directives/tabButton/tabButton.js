(function() {
    'use strict';

    angular
        .module('tabButton', [])
        .directive('tabButton', tabButton);

        function tabButton() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    displayText: '=',
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'directives/tabButton/tabButton.html'
            }
        }
})();
