(function() {
    'use strict';

    angular
        .module('radioButton', [])
        .directive('radioButton', radioButton);

        radioButton.$inject = ['$timeout'];

        function radioButton($timeout) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    bindModel: '=ngModel',
                    value: '=',
                    changeEvent: '&',
                    displayText: '=',
                    isDisabledWhen: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;

                    dvm.onChange = function() {
                        $timeout(function() {
                            $scope.changeEvent();                            
                        });
                    }
                }],
                templateUrl: 'directives/radioButton/radioButton.html'
            }
        }
})();
