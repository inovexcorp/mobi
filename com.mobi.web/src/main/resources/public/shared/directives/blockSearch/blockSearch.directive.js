(function() {
    'use strict';

    function blockSearch() {
        return {
            restrict: 'E',
            replace: true,
            require: '^^block',
            scope: {
                bindModel: '=ngModel',
                keyupEvent: '&',
                clearEvent: '&'
            },
            templateUrl: 'shared/directives/blockSearch/blockSearch.directive.html'
        }
    }
    
    angular
        /**
         * @ngdoc overview
         * @name blockSearch
         *
         */
        .module('blockSearch', [])
        /**
         * @ngdoc directive
         * @name blockSearch.directive:blockSearch
         * @scope
         * @restrict E
         *
         */
        .directive('blockSearch', blockSearch);
})();
