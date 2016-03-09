(function() {
    'use strict';

    angular
        .module('confirmationOverlay', [])
        .directive('confirmationOverlay', confirmationOverlay);

        function confirmationOverlay() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    cancelText: '=',
                    cancelClick: '&',
                    confirmText: '=',
                    confirmClick: '&',
                    headerText: '=',
                    size: '='
                },
                templateUrl: 'directives/confirmationOverlay/confirmationOverlay.html'
            }
        }
})();
