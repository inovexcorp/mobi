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
         * @name leftNavItem
         *
         * @description 
         * The `leftNavItem` module only provides the `leftNavItem` directive which
         * creates a styled list element with a button containing transcluded content.
         */
        .module('leftNavItem', [])
        /**
         * @ngdoc directive
         * @name leftNavItem.directive:leftNavItem
         * @scope
         * @restrict E
         *
         * @description 
         * `leftNavItem` is a directive which creates a list item with a button containing transcluded 
         * content. It is meant to be used within a {@link leftNav.directive:leftNav leftNav} directive.
         * The button can have an optional onclick function and hover text and conditionally be set to 
         * active or disabled.
         *
         * @param {function} [onClick=undefined] a function to be called when the button is clicked
         * @param {boolean} [isActiveWhen=false] a condition for when the button should be set to active
         * @param {boolean} [isDisabledWhen=false] a condition for when the button should be disabled
         * @param {string} [navTitle=''] text to be displayed when the button is hovered over
         */
        .directive('leftNavItem', leftNavItem);

        function leftNavItem() {
            return {
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    onClick: '&',
                    isActiveWhen: '=',
                    isDisabledWhen: '=',
                    navTitle: '@'
                },
                templateUrl: 'directives/leftNavItem/leftNavItem.html'
            }
        }
})();
