(function() {
    'use strict';

    function blockFooter() {
        return {
            restrict: 'E',
            replace: true,
            require: '^^block',
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/blockFooter/blockFooter.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name blockFooter
         *
         */
        .module('blockFooter', [])
        /**
         * @ngdoc directive
         * @name blockFooter.directive:blockFooter
         * @scope
         * @restrict E
         *
         */
        .directive('blockFooter', blockFooter);
})();
