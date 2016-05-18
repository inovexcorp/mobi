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
                    isActive: '=',
                    isDisabledWhen: '=',
                    navTitle: '@'
                },
                templateUrl: 'modules/ontology-editor/directives/leftNavItem/leftNavItem.html'
            }
        }
})();
