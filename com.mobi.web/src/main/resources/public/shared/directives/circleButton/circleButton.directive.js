/*-
 * #%L
 * com.mobi.web
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

    function circleButton() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                btnIcon: '<',
                btnSmall: '<',
                displayText: '<'
            },
            templateUrl: 'shared/directives/circleButton/circleButton.directive.html'
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name circleButton
         * 
         * @description
         * The `circleButton` module only provides the `circleButton` directive which
         * creates a circular button with a Font Awesome icon.
         */
        .module('circleButton', [])
        /**
         * @ngdoc directive
         * @name circleButton.directive:circleButton
         * @scope
         * @restrict E
         *
         * @description 
         * `circleButton` is a directive that creates a button element with the specified
         * Font Awesome icon and specified behavior. The directive is replaced with the 
         * content of the template. The button will always come styled as a Bootstrap primary 
         * button and the Font Awesome icon will always be a fixed width.
         *
         * @param {string} btnIcon the Font Awesome name of a specific icon
         * @param {boolean} [btnSmall=false] whether or not the button should be small
         * @param {boolean} displayText the text to get displayed on hover
         *
         * @usage
         * <!-- With only an icon -->
         * <circle-button btn-icon="fa-camera"></circle-button>
         *
         * <!-- With the other optional attributes -->
         * <circle-button btn-icon="fa-camera" btn-small="true" is-enabled="true" on-click="console.log('Hello world!')"></circle-button>
         */
        .directive('circleButton', circleButton);
})();
