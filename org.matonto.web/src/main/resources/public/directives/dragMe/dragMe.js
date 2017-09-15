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
         * @name dragMe
         *
         * @description
         * The `dragMe` module provides the `dragMe` directive which provides a way to drag an element.
         */
        .module('dragMe', [])
        /**
         * @ngdoc directive
         * @name dragMe.directive:dragMe
         * @restrict A
         *
         * @description
         * `dragMe` is a directive that allows users to drag the element. It expects attributes "info" and "dragId".
         * The "info" attribute contains whatever you want to pass on when you drop this directive. The "dragId" attribute
         * is a unique identifier to match up to a "dropId" where you can actually drop this directive.
         */
        .directive('dragMe', dragMe);

        function dragMe() {
            return {
                restrict: 'A',
                link: function(scope, elem, attrs) {
                    elem.on('dragstart', event => {
                        event.dataTransfer.setData(scope.$eval(attrs.dragId), JSON.stringify(scope.$eval(attrs.info)));
                    });
                    scope.$watch(() => _.get(attrs, 'disabled'), newValue => {
                        elem.prop('draggable', !newValue);
                    });
                }
            }
        }
})();