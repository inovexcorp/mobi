(function() {
    'use strict';

    angular
        .module('customButton', [])
        .directive('customButton', customButton);

        function customButton() {
            return {
                restrict: 'E',
                transclude: true,
                scope: {
                    type: '=',
                    isDisabledWhen: '=',
                    onClick: '&',
                    pull: '='
                },
                templateUrl: 'directives/customButton/customButton.html',
                controller: function($scope) {
                    $scope.type = angular.isDefined($scope.type) ? $scope.type : 'primary';
                    $scope.pull = angular.isDefined($scope.pull) ? $scope.pull : 'right';
                }
            }
        }
})();
