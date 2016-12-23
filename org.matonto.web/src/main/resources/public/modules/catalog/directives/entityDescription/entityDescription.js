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
(function () {
    'use strict';

    angular
        .module('entityDescription', [])
        .directive('entityDescription', entityDescription);

    entityDescription.$inject = ['$filter', 'prefixes'];

    function entityDescription($filter, prefixes) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                limited: '<'
            },
            bindToController: {
                entity: '<'
            },
            link: function(scope, el, attrs) {
                scope.limited = attrs.limited !== undefined;
            },
            controller: function() {
                var dvm = this;
                dvm.descriptionLimit = 200;
                dvm.full = false;

                dvm.getLimitedDescription = function() {
                    var description = dvm.getDescription();
                    return dvm.full || description.length < dvm.descriptionLimit ? description : $filter('limitTo')(description, dvm.descriptionLimit) + '...';
                }
                dvm.getDescription = function() {
                    return _.get(dvm.entity, "['" + prefixes.dcterms + "description'][0]['@value']", '');
                }
            },
            templateUrl: 'modules/catalog/directives/entityDescription/entityDescription.html'
        };
    }
})();
