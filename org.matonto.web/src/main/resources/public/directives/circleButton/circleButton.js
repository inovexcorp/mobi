(function() {
    'use strict';

    angular
        .module('circleButton', [])
        .directive('circleButton', circleButton);

        function circleButton() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    btnIcon: '=',
                    btnSmall: '=',
                    isEnabled: '=',
                    onClick: '&'
                },
                templateUrl: 'directives/circleButton/circleButton.html'
            }
        }
})();
