(function() {
    'use strict';

    function statementContainer() {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            scope: {},
            templateUrl: 'shared/directives/statementContainer/statementContainer.directive.html',
            controller: angular.noop,
            link: function(scope, element, attrs) {
                scope.hasAdditions = 'additions' in attrs;
                scope.hasDeletions = 'deletions' in attrs;
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name statementContainer
         *
         */
        .module('statementContainer', [])
        /**
         * @ngdoc directive
         * @name statementContainer.directive:statementContainer
         * @scope
         * @restrict E
         *
         */
        .directive('statementContainer', statementContainer);

})();
