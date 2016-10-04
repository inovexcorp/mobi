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

        usagesBlock.$inject = ['$filter', 'ontologyStateService', 'ontologyManagerService'];

        function usagesBlock($filter, ontologyStateService, ontologyManagerService) {
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

                    function getResults() {
                        var deletedIRIs = _.map(dvm.sm.state.deletedEntities, 'matonto.originalIRI');
                        var filteredBindings = _.reject(dvm.sm.state[dvm.sm.getActiveKey()].usages, usage => {
                            return _.indexOf(deletedIRIs, _.get(usage, 's.value')) !== -1
                                || _.indexOf(deletedIRIs, _.get(usage, 'o.value')) !== -1
                                || _.indexOf(deletedIRIs, _.get(usage, 'p.value')) !== -1;
                        });
                        var results = {};
                        _.forEach(filteredBindings, binding => {
                            if (_.has(binding, 'p')) {
                                results[binding.p.value] = _.union(_.get(results, binding.p.value, []),
                                    [{subject: binding.s.value, predicate: binding.p.value, object: dvm.sm.selected['@id']}]);
                            } else if (_.has(binding, 'o')) {
                                results[dvm.sm.selected['@id']] = _.union(_.get(results, dvm.sm.selected['@id'], []),
                                    [{subject: binding.s.value, predicate: dvm.sm.selected['@id'], object: binding.o.value}]);
                            }
                        });
                        return results;
                    }

                    dvm.results = getResults();

                    dvm.getBindingDisplay = function(binding) {
                        return $filter('splitIRI')(binding).end;
                    }

                    $scope.$watch(function() {
                        return dvm.sm.state[dvm.sm.getActiveKey()].usages;
                    },function() {
                        dvm.results = getResults();
                    });
                }]
            }
        }
})();
