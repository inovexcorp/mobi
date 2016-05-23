(function() {
    'use strict';

    angular
        .module('leftNavItem', [])
        .directive('leftNavItem', leftNavItem);

        function leftNavItem() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    onClick: '&',
                    isActiveWhen: '=',
                    isDisabledWhen: '=',
                    navTitle: '@'
                },
                templateUrl: 'directives/leftNavItem/leftNavItem.html'
            }
        }
})();
