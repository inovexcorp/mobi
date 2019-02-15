/*-
 * #%L
 * com.mobi.web
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
        /**
         * @ngdoc overview
         * @name filterSelector
         *
         * @description
         * The `filterSelector` module only provides the `filterSelector` directive which creates
         * the filter selector.
         */
        .module('filterSelector', [])
        /**
         * @ngdoc directive
         * @name filterSelector.directive:filterSelector
         * @scope
         * @restrict E
         * @requires util.service:utilService
         * @requires prefixes.service:prefixes
         *
         * @description
         * HTML contents for the filter selector which provides the users with the options to select filter options
         * appropriate for the selected range.
         */
        .directive('filterSelector', filterSelector);
        
        filterSelector.$inject = ['utilService', 'prefixes'];
        
        function filterSelector(utilService, prefixes) {
            return {
                restrict: 'E',
                templateUrl: 'modules/discover/sub-modules/search/directives/filterSelector/filterSelector.html',
                replace: true,
                require: '^^propertyFilterOverlay',
                scope: {},
                bindToController: {
                    begin: '=',
                    boolean: '=',
                    end: '=',
                    filterType: '=',
                    range: '<',
                    regex: '=',
                    value: '='
                },
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var needsOneInput = ['Contains', 'Exact', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to'];
                    dvm.util = utilService;
                    dvm.type = dvm.util.getInputType(dvm.range);
                    dvm.pattern = dvm.util.getPattern(dvm.range);
                    dvm.types = {
                        'datetime-local': ['Exact', 'Existence', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', 'Range'],
                        number: ['Exact', 'Existence', 'Greater than', 'Greater than or equal to', 'Less than', 'Less than or equal to', 'Range'],
                        text: ['Contains', 'Exact', 'Existence', 'Regex']
                    };
                    
                    dvm.needsOneInput = function() {
                        return _.includes(needsOneInput, dvm.filterType);
                    }
                    
                    dvm.isBoolean = function() {
                        return dvm.range === prefixes.xsd + 'boolean';
                    }

                    if (dvm.isBoolean()) {
                        dvm.filterType = 'Boolean';
                    } else {
                        dvm.filterType = undefined;
                    }
                }
            }
        }
})();
