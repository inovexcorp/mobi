(function() {
    'use strict';

    angular
        .module('textArea', ['customLabel'])
        .directive('textArea', textArea);

        function textArea() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    bindModel: '=ngModel',
                    displayText: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/textInput/textInput.html'
            }
        }
})();
