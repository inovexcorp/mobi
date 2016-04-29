(function() {
    'use strict';

    angular
        .module('finishOverlay', [])
        .directive('finishOverlay', finishOverlay);

        function finishOverlay() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    save: '&',
                    finish: '&'
                },
                templateUrl: 'modules/mapper/directives/finishOverlay/finishOverlay.html'
            }
        }
})();
