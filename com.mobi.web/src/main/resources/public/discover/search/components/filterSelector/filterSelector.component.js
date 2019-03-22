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
     * @name search.component:filterSelector
     * @requires shared.service:utilService
     * @requires shared.service:prefixes
     *
     * @description
     * `filterSelector` is a component that provides the users with the options to select filter options
     * appropriate for the selected range.
     *
     * @param {string} begin The lower bound of a range of the property filter
     * @param {Function} updateBegin A function to be called when the value of `begin` changes. Expects an argument
     * called `value` and should update the value of `begin`.
     * @param {boolean} boolean The boolean value of the property filter
     * @param {Function} updateBoolean A function to be called when the value of `boolean` changes. Expects an argument
     * called `value` and should update the value of `boolean`.
     * @param {string} end The upper bound of a range of the property filter
     * @param {Function} updateEnd A function to be called when the value of `end` changes. Expects an argument
     * called `value` and should update the value of `end`.
     * @param {string} filterType The type of filter to be used for the query
     * @param {Function} updateFilterType A function to be called when the value of `filterType` changes. Expects an argument
     * called `value` and should update the value of `filterType`.
     * @param {string} range The range of the property
     * @param {string} regex The regex to match the property value against
     * @param {Function} updateRegex A function to be called when the value of `regex` changes. Expects an argument
     * called `value` and should update the value of `regex`.
     * @param {string} value The value of the filter
     * @param {Function} updateValue A function to be called when the value of `value` changes. Expects an argument
     * called `value` and should update the value of `value`.
     */
    const filterSelectorComponent = {
        templateUrl: 'discover/search/components/filterSelector/filterSelector.component.html',
        require: '^^propertyFilterOverlay',
        bindings: {
            begin: '<',
            updateBegin: '&',
            boolean: '<',
            updateBoolean: '&',
            end: '<',
            updateEnd: '&',
            filterType: '<',
            updateFilterType: '&',
            range: '<',
            regex: '<',
            updateRegex: '&',
            value: '<',
            updateValue: '&',
        },
        controllerAs: 'dvm',
        controller: filterSelectorComponentCtrl
    };

    filterSelectorComponent.$inject = ['utilService', 'prefixes'];
    
    function filterSelectorComponentCtrl(utilService, prefixes) {
        var dvm = this;
        var needsOneInput = ['Contains', 'Exact', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to'];
        dvm.util = utilService;
        dvm.types = {
            'datetime-local': ['Exact', 'Existence', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', 'Range'],
            number: ['Exact', 'Existence', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', 'Range'],
            text: ['Contains', 'Exact', 'Existence', 'Regex']
        };
        dvm.type = '';
        dvm.pattern = '';
        dvm.filterType = undefined;

        dvm.$onInit = function() {
            dvm.type = dvm.util.getInputType(dvm.range);
            dvm.pattern = dvm.util.getPattern(dvm.range);

            if (dvm.isBoolean()) {
                dvm.filterType = 'Boolean';
            } else {
                dvm.filterType = undefined;
            }
        }
        dvm.needsOneInput = function() {
            return _.includes(needsOneInput, dvm.filterType);
        }
        dvm.isBoolean = function() {
            return dvm.range === prefixes.xsd + 'boolean';
        }
    }

    angular.module('search')
        .component('filterSelector', filterSelectorComponent);
})();
