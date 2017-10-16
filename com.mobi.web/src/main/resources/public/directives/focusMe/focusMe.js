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

    angular
        /**
         * @ngdoc overview
         * @name focusMe
         *
         * @description
         * The `focusMe` module provides the `focusMe` directive which provides a way to focus an element when it
         * becomes visible.
         */
        .module('focusMe', [])
        /**
         * @ngdoc directive
         * @name focusMe.directive:focusMe
         * @restrict A
         *
         * @description
         * `focusMe` is a directive that sets the focus of the element it is set on when it becomes visible.
         */
        .directive('focusMe', focusMe);

        focusMe.$inject = ['$timeout'];

        function focusMe($timeout) {
            return {
                restrict: 'A',
                link: function(scope, elem) {
                    $timeout(function() {
                        elem[0].focus();
                    });
                }
            }
        }
})();