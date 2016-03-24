(function() {
    'use strict';

    angular
        .module('stepThroughSidebar', [])
        .directive('stepThroughSidebar', stepThroughSidebar);

        function stepThroughSidebar() {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {
                    activeIndex: '=',
                    steps: '='
                },
                controller: function() {
                    var dvm = this;
                },
                templateUrl: 'modules/mapper/directives/stepThroughSidebar/stepThroughSidebar.html'
            }
        }
})();
