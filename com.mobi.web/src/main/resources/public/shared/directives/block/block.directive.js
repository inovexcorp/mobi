(function() {
    'use strict';

    function block() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/block/block.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name block
         *
         */
        .module('block', [])
        /**
         * @ngdoc directive
         * @name block.directive:block
         * @scope
         * @restrict E
         *
         */
        .directive('block', block);
})();
