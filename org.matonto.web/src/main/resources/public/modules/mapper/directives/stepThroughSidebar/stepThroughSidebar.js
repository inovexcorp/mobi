(function() {
    'use strict';

    angular
        .module('stepThroughSidebar', [])
        .directive('stepThroughSidebar', stepThroughSidebar);

        function stepThroughSidebar() {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    activeIndex: '=',
                    steps: '='
                },
                templateUrl: 'modules/mapper/directives/stepThroughSidebar/stepThroughSidebar.html'
            }
        }
})();
