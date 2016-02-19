(function() {
    'use strict';

    angular
        .module('textArea', ['customLabel'])
        .directive('textArea', textArea);

        function textArea() {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    changeEvent: '&',
                    displayText: '=',
                    mutedText: '='
                },
                templateUrl: 'directives/textArea/textArea.html'
            }
        }
})();
