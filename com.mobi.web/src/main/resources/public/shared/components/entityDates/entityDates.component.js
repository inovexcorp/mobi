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

    /**
     * @ngdoc component
     * @name shared.component:entityDates
     * @requires shared.service:utilService
     *
     * @description
     * `entityDates` is a component which creates a div with displays for a JSON-LD object's dcterms:issued and
     * dcterms:modified property values. Displays the dates in "short" form. If it can't find one of the dates, 
     * displays "(No Date Specified)".
     *
     * @param {Object} entity A JSON-LD object
     */
    const entityDatesComponent = {
        templateUrl: 'shared/components/entityDates/entityDates.component.html',
        bindings: {
            entity: '<'
        },
        controllerAs: 'dvm',
        controller: entityDatesComponentCtrl
    };

    entityDatesComponentCtrl.$inject = ['utilService'];

    function entityDatesComponentCtrl(utilService) {
        var dvm = this;

        dvm.getDate = function(key) {
            var dateStr = utilService.getDctermsValue(dvm.entity, key);
            return utilService.getDate(dateStr, 'short');
        }
    }

    angular.module('shared')
        .component('entityDates', entityDatesComponent);
})();
