(function() {
    'use strict';

    angular
        .module('formControlInput', [])
        .directive('formControlInput', formControlInput);

        function formControlInput() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    namespace: '=',
                    localName: '=',
                    displayText: '='
                },
                templateUrl: '/directives/textInput/textInput.html'
            }
        }
})();
