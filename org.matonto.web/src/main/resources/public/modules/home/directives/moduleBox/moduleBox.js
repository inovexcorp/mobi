(function() {
    'use strict';

    angular
        .module('moduleBox', [])
        .directive('moduleBox', moduleBox);

        function moduleBox() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                templateUrl: 'modules/home/directives/moduleBox/moduleBox.html',
                scope: {
                    backgroundColor: '@',
                    headerText: '@',
                    iconName: '@'
                }
            }
        }
})();
