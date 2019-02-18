(function() {
    'use strict';

    function blockHeader() {
        return {
            require: '^^block',
            replace: true,
            restrict: 'E',
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/blockHeader/blockHeader.directive.html'
        }
    }
    
    angular
        /**
         * @ngdoc overview
         * @name blockHeader
         *
         */
        .module('blockHeader', [])
        /**
         * @ngdoc directive
         * @name blockHeader.directive:blockHeader
         * @scope
         * @restrict E
         *
         */
        .directive('blockHeader', blockHeader);
})();
