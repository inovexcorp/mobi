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

    /**
     * @ngdoc component
     * @name search.component:propertySelector
     * @requires shared.service:discoverStateService
     * @requires shared.service:ontologyManagerService
     * @requires shared.service:prefixes
     * @requires shared.service:utilService
     *
     * @description
     * `propertySelector` is a component that provides the users an option to select a property and range
     * they want to add to their search.
     *
     * @param {string[]} keys The keys of the provided properties
     * @param {Function} updateKeys A function to be called when the value of `keys` changes. Expects an argument
     * called `value` and should update the value of `keys`.
     * @param {Object} property The property selected to be used in the search
     * @param {Function} updateProperty A function to be called when the value of `property` changes. Expects an argument
     * called `value` and should update the value of `property`.
     * @param {string} range the range of the selected property
     * @param {Function} updateRange A function to be called when the value of `range` changes. Expects an argument
     * called `value` and should update the value of `range`.
     * @param {Function} rangeChangeEvent A function to be called when the value of `range` changes.
     */
    const propertySelectorComponent = {
        templateUrl: 'discover/search/components/propertySelector/propertySelector.component.html',
        require: '^^propertyFilterOverlay',
        bindings: {
            keys: '<',
            property: '<',
            updateProperty: '&',
            range: '<',
            updateRange: '&',
            rangeChangeEvent: '&'
        },
        controllerAs: 'dvm',
        controller: propertySelectorComponentCtrl
    };

    propertySelectorComponent.$inject = ['$timeout', 'discoverStateService', 'ontologyManagerService', 'prefixes', 'utilService'];

    function propertySelectorComponentCtrl($timeout, discoverStateService, ontologyManagerService, prefixes, utilService) {
        var dvm = this;
        dvm.ds = discoverStateService;
        dvm.util = utilService;
        dvm.om = ontologyManagerService;
        dvm.propertySearch = '';
        dvm.rangeSearch = '';
        dvm.properties = dvm.ds.search.properties;
        dvm.ranges = [];

        dvm.getSelectedPropertyText = function() {
            return dvm.property ? dvm.om.getEntityName(dvm.property) : '';
        }
        dvm.getSelectedRangeText = function() {
            return dvm.range ? dvm.util.getBeautifulIRI(dvm.range) : '';
        }
        dvm.orderRange = function(range) {
            return dvm.util.getBeautifulIRI(range['@id']);
        }
        dvm.shouldDisplayOptGroup = function(type) {
            return _.some(dvm.ds.search.properties[type], dvm.checkEntityText);
        }
        dvm.propertyChanged = function() {
            dvm.updateProperty({value: dvm.property});
            dvm.ranges = _.get(dvm.property, prefixes.rdfs + 'range', [{'@id': prefixes.xsd + 'string'}]);
            if (dvm.ranges.length === 1) {
                dvm.range = dvm.ranges[0]['@id'];
                dvm.updateRange({value: dvm.range});
                $timeout(() => dvm.rangeChangeEvent());
            }
        }
        dvm.showNoDomains = function() {
            var noDomains = _.get(dvm.ds.search, 'noDomains', []);
            return noDomains.length && _.filter(noDomains, dvm.checkEntityText).length;
        }
        dvm.checkEntityText = function(entity) {
            return _.includes(_.toLower(dvm.om.getEntityName(entity)), _.toLower(dvm.propertySearch));
        }
    }

    angular.module('search')
        .component('propertySelector', propertySelectorComponent);
})();
