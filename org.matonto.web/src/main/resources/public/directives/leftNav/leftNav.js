/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
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
                    moduleName: '@',
                    docUrl: '@',
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
