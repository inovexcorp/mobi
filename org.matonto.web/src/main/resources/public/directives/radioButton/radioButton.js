(function() {
    'use strict';

    angular
        .module('radioButton', ['customLabel'])
        .directive('radioButton', radioButton);

        radioButton.$inject = ['$timeout'];

        function radioButton($timeout) {
            return {
                restrict: 'E',
                scope: {
                    bindModel: '=ngModel',
                    value: '=',
                    changeEvent: '&',
                    displayText: '=',
                    mutedText: '=',
                    isDisabledWhen: '='
                },
                controllerAs: 'dvm',
                controller: function($scope) {
                    var dvm = this;

                    dvm.onChange = function() {
                        $timeout(function() {
                            $scope.changeEvent();                            
                        });
                    }
                },
                templateUrl: 'directives/radioButton/radioButton.html'
            }
        }
})();
