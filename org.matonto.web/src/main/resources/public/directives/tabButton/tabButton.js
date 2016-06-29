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
         * @name tabButton
         *
         * @description 
         * The `tabButton` module only provides the `tabButton` directive which creates
         * a anchor with small transcluded content and a custom on click function
         */
        .module('tabButton', [])
        /**
         * @ngdoc directive
         * @name tabButton.directive:tabButton
         * @scope
         * @restrict E
         *
         * @description 
         * `tabButton` is a directive that creates a anchor with small transcluded content 
         * and a custom on click function. If the button is "active", the "active" class is 
         * applied. This directive is intended to be used for a tab button at the top of a 
         * div. The directive is replaced by the content of the template.
         * 
         * @param {boolean=false} isActive Whether the button should have the "active" class
         * @param {function} onClick A function to be called when the anchor is clicked
         *
         * @usage
         * <tab-button is-active="false" on-click="console.log('Clicked')"></tab-button>
         */
        .directive('tabButton', tabButton);

        function tabButton() {
            return {
                require: '^tabButtonContainer',
                restrict: 'E',
                replace: true,
                transclude: true,
                scope: {
                    isActive: '=',
                    onClick: '&'
                },
                templateUrl: 'directives/tabButton/tabButton.html'
            }
        }
})();
