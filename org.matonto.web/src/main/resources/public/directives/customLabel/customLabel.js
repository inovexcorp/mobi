(function() {
    'use strict';

    angular
        .module('customLabel', [])
        .directive('customLabel', customLabel);

        function customLabel() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    mutedText: '='
                },
                templateUrl: 'directives/customLabel/customLabel.html'
            }
        }
})();
