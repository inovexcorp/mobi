(function() {
    'use strict';

    angular
        .module('leftNavItem', [])
        .directive('leftNavItem', leftNavItem);

        function leftNavItem() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    onClick: '&',
                    isActive: '=',
                    isDisabledWhen: '=',
                    icon: '@',
                    navTitle: '@'
                },
                templateUrl: 'modules/ontology-editor/directives/leftNavItem/leftNavItem.html'
            }
        }
})();
