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

    disableAnimate.$inject = ['$animate'];

    function disableAnimate($animate) {
        return {
            restrict: 'A',
            link: function(scope, el) {
                $animate.enabled(el, false);
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name disableAnimate
         *
         * @description
         * The `disableAnimate` module only provides the `disableAnimate` directive which disabled ngAnimate on an
         * element.
         */
        .module('disableAnimate', [])
        /**
         * @ngdoc directive
         * @name disableAnimate.directive:disableAnimate
         * @restrict A
         * @requires $animate
         *
         * @description
         * `disableAnimate` is a directive that will disable ngAnimate on the parent element. This means that the
         * ngAnimate classes such as `.ng-enter` and `.ng-leave` will not be added to the element.
         */
        .directive('disableAnimate', disableAnimate);
})();