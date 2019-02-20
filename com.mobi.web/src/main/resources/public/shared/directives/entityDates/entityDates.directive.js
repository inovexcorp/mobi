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
(function () {
    'use strict';

    entityDates.$inject = ['$filter', 'utilService'];

    function entityDates($filter, utilService) {
        return {
            restrict: 'E',
            replace: true,
            controllerAs: 'dvm',
            scope: {
                entity: '<'
            },
            controller: function() {
                var dvm = this;

                dvm.getDate = function(entity, key) {
                    var dateStr = utilService.getDctermsValue(entity, key);
                    return utilService.getDate(dateStr, 'short');
                }
            },
            templateUrl: 'shared/directives/entityDates/entityDates.directive.html'
        };
    }

    angular
        .module('shared')
        /**
         * @ngdoc directive
         * @name shared.directive:entityDates
         * @scope
         * @restrict E
         * @requires $filter
         * @requires shared.service:utilService
         *
         * @description
         * `entityDates` is a directive which creates a div with displays for a JSON-LD object's
         * dcterms:issued and dcterms:modified property values. Displays the dates in "short" form.
         * If it can't find one of the dates, displays "(No Date Specified)". The directive is
         * replaced by the contents of its template.
         *
         * @param {Object} entity A JSON-LD object
         */
        .directive('entityDates', entityDates);
})();