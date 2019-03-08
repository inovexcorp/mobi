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
     * @name shared.component:entityDescription
     * @requires $filter
     * @requires shared.service:utilService
     *
     * @description
     * `entityDescription` is a component which creates a div with a display of a JSON-LD object's dcterms:description 
     * property value. Based on the limited variable, will optionally limit the display to the first 200 characters and
     * provide a button to toggle the full display.
     *
     * @param {boolean} limited Whether or not the display should be limited to the first 200 characters
     * @param {Object} entity A JSON-LD object
     */
    const entityDescriptionComponent = {
        templateUrl: 'shared/components/entityDescription/entityDescription.component.html',
        bindings: {
            limited: '@',
            entity: '<'
        },
        controllerAs: 'dvm',
        controller: entityDescriptionComponentCtrl
    };

    entityDescriptionComponentCtrl.$inject = ['$filter', 'utilService'];

    function entityDescriptionComponentCtrl($filter, utilService) {
        var dvm = this;
        dvm.util = utilService;
        dvm.descriptionLimit = 200;
        dvm.full = false;

        dvm.$onInit = function() {
            dvm.isLimited = dvm.limited !== undefined;
        }
        dvm.getLimitedDescription = function() {
            var description = dvm.getDescription();
            return dvm.full || description.length < dvm.descriptionLimit ? description : $filter('limitTo')(description, dvm.descriptionLimit) + '...';
        }
        dvm.getDescription = function() {
            return dvm.util.getDctermsValue(dvm.entity, 'description');
        }
    }

    angular.module('shared')
        .component('entityDescription', entityDescriptionComponent);
})();
