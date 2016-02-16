(function() {
    'use strict';

    angular
        .module('customButton', [])
        .directive('customButton', customButton);

        function customButton() {
            return {
                restrict: 'E',
                scope: {
                    displayText: '=',
                    isDisabledWhen: '=',
                    isShown: '=',
                    clickEvent: '&'
                },
                templateUrl: 'directives/customButton/customButton.html'
            }
        }
})();
