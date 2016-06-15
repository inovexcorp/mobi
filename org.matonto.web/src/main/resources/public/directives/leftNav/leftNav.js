(function() {
    'use strict';

    angular
        /**
         * @ngdoc overview
         * @name leftNav
         *
         * @description 
         * The `leftNav` module only provides the `leftNav` directive which creates a left side menu bar 
         * with transcluded content and an info button.
         */
        .module('leftNav', [])
        /**
         * @ngdoc directive
         * @name leftNav.directive:leftNav
         * @scope
         * @restrict E
         * @requires $window
         * 
         * @description 
         * `leftNav` is a directive which creates an aside element styled to be a left side meny bar with 
         * transcluded content and a static information {@link leftNavItem.directive:leftNavItem leftNavItem}
         * that opens the passed in url in a new tab. The transcluded conent is meant to be more 
         * {@link leftNavItem.directive:leftNavItem leftNavItem} directives.
         *
         * @param {string} moduleName the name of the module the leftNav is in to be used as a title for the 
         * information {@link leftNavItem.directive:leftNavItem leftNavItem}
         * @param {string} docUrl the URL of the documentation the information {@link leftNavItem.directive:leftNavItem leftNavItem}
         * should open
         */
        .directive('leftNav', leftNav);

        leftNav.$inject = ['$window'];

        function leftNav($window) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                transclude: true,
                scope: {
                    moduleName: '=',
                    docUrl: '=',
                },
                link: function(scope, el, attrs, ctrl) {
                    scope.openDocs = function() {
                        $window.open(scope.docUrl);
                    }
                },
                templateUrl: 'directives/leftNav/leftNav.html'
            }
        }
})();
