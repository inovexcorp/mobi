(function() {
    'use strict';

    function blockContent() {
        return {
            restrict: 'E',
            replace: true,
            require: '^^block',
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/blockContent/blockContent.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name blockContent
         *
         */
        .module('blockContent', [])
        /**
         * @ngdoc directive
         * @name blockContent.directive:blockContent
         * @scope
         * @restrict E
         *
         */
        .directive('blockContent', blockContent);
})();
