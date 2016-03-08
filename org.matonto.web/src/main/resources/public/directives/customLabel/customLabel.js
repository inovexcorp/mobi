(function() {
    'use strict';

    angular
        .module('customLabel', [])
        .directive('customLabel', customLabel);

        function customLabel() {
            return {
                restrict: 'E',
                scope: {
                    displayText: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/customLabel/customLabel.html'
            }
        }
})();
