/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
        .module('aDisabled', [])
        .directive('aDisabled', aDisabled);

        function aDisabled() {
            return {
                restrict: 'A',
                link: function (scope, iElement, iAttrs) {
                    iAttrs['ngClick'] = '!(' + iAttrs['aDisabled'] + ') && (' + iAttrs['ngClick'] + ')';
                    scope.$watch(iAttrs['aDisabled'], function(newValue) {
                        if (newValue !== undefined) {
                            iElement.toggleClass('disabled', newValue);
                        }
                    });
                },
            }
        }
})();