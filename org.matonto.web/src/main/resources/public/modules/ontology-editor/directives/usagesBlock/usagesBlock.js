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

        usagesBlock.$inject = ['$filter', 'ontologyStateService', 'ontologyManagerService',
            'ontologyUtilsManagerService'];

        function usagesBlock($filter, ontologyStateService, ontologyManagerService, ontologyUtilsManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/usagesBlock/usagesBlock.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;
                    dvm.um = ontologyUtilsManagerService;

                    function getResults() {
                        var results = {};
                        _.forEach(_.get(dvm.sm.getActivePage(), 'usages', []), binding =>
                            results[binding.p.value] = _.union(_.get(results, binding.p.value, []), [{subject: binding.s.value, predicate: binding.p.value, object: binding.o.value}]));
                        return results;
                    }

                    dvm.results = getResults();

                    dvm.getBindingDisplay = function(binding) {
                        return $filter('splitIRI')(binding).end;
                    }

                    $scope.$watch(function() {
                        return dvm.sm.getActivePage().usages;
                    }, function() {
                        dvm.results = getResults();
                    });
                }]
            }
        }
})();
