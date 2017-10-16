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
         * @name sparqlResultTable
         *
         * @description
         * The `sortableTable` module only provides the `sortableTable` directive which
         * creates a sortable table using the provided SPARQL spec JSON results in the analytics module.
         */
        .module('sortableTable', [])
        /**
         * @ngdoc directive
         * @name sortableTable.directive:sortableTable
         * @scope
         * @restrict E
         * @requires analyticState.service:analyticStateService
         *
         * @description
         * HTML contents in the `sortableTable` which create a sortable table with a header row of binding names
         * and rows of the SPARQL query results provided in the SPARQL spec JSON format. This directive should only
         * be used in the analytics module.
         *
         * @param {string[]} bindings The array of binding names for the SPARQl results
         * @param {Object[]} data The actual SPARQL query results
         */
        .directive('sortableTable', sortableTable);
        
        sortableTable.$inject = ['analyticStateService'];

        function sortableTable(analyticStateService) {
            return {
                restrict: 'E',
                templateUrl: 'modules/analytics/directives/sortableTable/sortableTable.html',
                replace: true,
                scope: {
                    data: '<',
                    headers: '<?'
                },
                bindToController: {
                    bindings: '<',
                    onSort: '&'
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.state = analyticStateService;
                    dvm.descendingList = {};
                    
                    dvm.sort = function(binding) {
                        _.forOwn(dvm.descendingList, (value, key) => {
                            if (key !== binding) {
                                dvm.descendingList[key] = undefined;
                            }
                        });
                        dvm.onSort({binding: '?' + binding, descending: !!dvm.descendingList[binding]});
                        dvm.descendingList[binding] = !dvm.descendingList[binding];
                    }
                    
                    $scope.$watch('dvm.bindings', (newValue, oldValue) => {
                        var list = angular.copy(dvm.descendingList);
                        dvm.descendingList = {};
                        var keepers = _.intersection(newValue, oldValue);
                        _.forEach(newValue, binding => {
                            dvm.descendingList[binding] = _.includes(keepers, binding) ? list[binding] : undefined;
                        });
                    });
                }]
            }
        }
})();