(function () {
    'use strict';

    function stepProgressBar() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                stepNumber: '<',
                currentStep: '<'
            },
            controllerAs: 'dvm',
            controller: function() {
                var dvm = this;

                dvm.getRange = function(num) {
                    return _.range(0, num);
                }
            },
            templateUrl: 'shared/directives/stepProgressBar/stepProgressBar.directive.html'
        };
    }

    angular
        .module('stepProgressBar', [])
        .directive('stepProgressBar', stepProgressBar);
})();
