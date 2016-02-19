(function() {
    'use strict';

    angular
        .module('textInput', ['customLabel'])
        .directive('textInput', textInput);

        function textInput() {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/textInput/textInput.html'
            }
        }
})();
