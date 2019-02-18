/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    clickToCopy.$inject = ['$compile', 'toastr'];

    function clickToCopy($compile, toastr) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                scope.onSuccess = function() {
                    toastr.success('', 'Copied', {timeOut: 2000});
                }
                elem.removeAttr('click-to-copy');
                elem.addClass('click-to-copy');
                elem.attr('uib-tooltip', attrs.title || 'Copy to clipboard');
                elem.attr('ngclipboard', '');
                elem.attr('data-clipboard-text', '{{' + attrs.clickToCopy + '}}');
                elem.attr('ngclipboard-success', 'onSuccess()');

                $compile(elem)(scope);
            }
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name clickToCopy
         *
         * @description
         * The `clickToCopy` module provides the `clickToCopy` directive which adds functionality to click
         * an element to copy specified text.
         */
        .module('clickToCopy', [])
        /**
         * @ngdoc directive
         * @name clickToCopy.directive:clickToCopy
         * @restrict A
         * @requires toastr
         *
         * @description
         * `clickToCopy` is a directive that adds directives to the parent element so that a user can click on the
         * element and copy provided text that is resolved from the parent scope. To customize the text displayed in the
         * tootltip, set the `title` attribute on the parent.
         *
         * @param {*} clickToCopy The expression to be evaluated in the parent scope that should result in text that
         * will be copied on click.
         */
        .directive('clickToCopy', clickToCopy);
})();