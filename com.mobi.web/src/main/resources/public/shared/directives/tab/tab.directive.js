(function() {
    'use strict';

    function tab() {
        return {
            restrict: 'E',
            require: '^^tabset',
            transclude: true,
            scope: {
                active: '=?',
                hideTab: '<?',
                heading: '<',
                isLast: '<',
                marked: '<',
                onClick: '&',
                onClose: '&?'
            },
            templateUrl: 'shared/directives/tab/tab.directive.html',
            link: function(scope, elem, attr, tabsetController) {
                tabsetController.addTab(scope);
                scope.$on('$destroy', function() {
                    tabsetController.removeTab(scope);
                });
            }
        }
    }

    angular
        .module('tab', [])
        .directive('tab', tab);
})();
