(function() {
    'use strict';

    angular
        .module('customButton', [])
        .directive('customButton', customButton);

        function customButton() {
            return {
                restrict: 'E',
                scope: {
                    type: '=',
                    displayText: '=',
                    isDisabledWhen: '=',
                    onClick: '&'
                },
                templateUrl: 'directives/customButton/customButton.html'
            }
        }
})();
