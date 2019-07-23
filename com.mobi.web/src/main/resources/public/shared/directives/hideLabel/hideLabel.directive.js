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

    hideLabel.$inject = ['$timeout'];

    /**
     * @ngdoc directive
     * @name shared.directive:hideLabel
     * @restrict A
     *
     * @description
     * `hideLabel` is a utility directive for working with Angular Material inputs so that the placeholder for a
     * `md-autocomplete` is set appropriately on the underlying `<input>`.
     */
    function hideLabel($timeout) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                if ('placeholder' in attrs) {
                    $timeout(() => elem.find('input').attr('placeholder', attrs.placeholder));
                }
            }
        }
    }

    angular.module('shared')
        .directive('hideLabel', hideLabel);
})();