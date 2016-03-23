(function() {
    'use strict';

    angular
        .module('finishOverlay', [])
        .directive('finishOverlay', finishOverlay);

        function finishOverlay() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    save: '&',
                    finish: '&'
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'modules/mapper/directives/finishOverlay/finishOverlay.html'
            }
        }
})();
