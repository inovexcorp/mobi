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

clickAnywhereButHere.$inject = ['clickAnywhereButHereService'];

/**
 * @ngdoc directive
 * @name shared.directive:clickAnywhereButHere
 * @restrict A
 * @requires shared.service:clickAnywhereButHereService
 *
 * @description
 * `clickAnywhereButHere` is a directive that creates a click handler for the parent element such
 * that the click event does not propagate and calls the
 * {@link shared.factory:clickAnywhereButHereService clickAnywhereButHereService}
 * attaching a click handler to the document to call the passed expression from the directive.
 */
function clickAnywhereButHere(clickAnywhereButHereService) {
    return {
        restrict: 'A',
        link: function(scope, elem, attr, ctrl) {
            var handler = function(e) {
                e.stopPropagation();
            };
            elem.on('click', handler);

            scope.$on('$destroy', function() {
                elem.off('click', handler);
            });

            clickAnywhereButHereService(scope, attr.clickAnywhereButHere);
        }
    };
}

export default clickAnywhereButHere;