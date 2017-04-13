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
(function() {
    'use strict';

    angular
        .module('usagesBlock', [])
        .directive('usagesBlock', usagesBlock);

        usagesBlock.$inject = ['$filter', 'ontologyStateService', 'ontologyManagerService', 'ontologyUtilsManagerService'];

        function usagesBlock($filter, ontologyStateService, ontologyManagerService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/usagesBlock/usagesBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    var size = 100;
                    var index = 0;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.id = 'usages-' + dvm.os.getActiveKey() + '-' + dvm.os.listItem.recordId;
                    dvm.results = getResults();
                    dvm.total = 0;
                    dvm.shown = 0;

                    dvm.getMoreResults = function() {
                        index++;
                        _.forEach(_.get(_.chunk(usages, size), index, []), binding => addToResults(dvm.results, binding));
                    }

                    $scope.$watch(function() {
                        return dvm.os.getActivePage().usages;
                    }, function() {
                        size = 100;
                        index = 0;
                        dvm.results = getResults();
                    });

                    function getResults() {
                        var results = {};
                        var usages = _.get(dvm.sm.getActivePage(), 'usages', []);
                        dvm.total = usages.length;
                        _.forEach(_.get(_.chunk(usages, size), index, []), binding => addToResults(results, binding));
                        return results;
                    }

                    function addToResults(results, binding) {
                        results[binding.p.value] = _.union(_.get(results, binding.p.value, []), [{subject: binding.s.value, predicate: binding.p.value, object: binding.o.value}])
                    }
                }]
            }
        }
})();
