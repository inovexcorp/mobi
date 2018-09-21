/*-
 * #%L
 * com.mobi.web
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
        /**
         * @ngdoc overview
         * @name usagesBlock
         *
         * @description
         * The `usagesBlock` module only provides the `usagesBlock` directive which creates a section for
         * displaying the usages of an entity within an ontology.
         */
        .module('usagesBlock', [])
        /**
         * @ngdoc directive
         * @name usagesBlock.directive:usagesBlock
         * @scope
         * @restrict E
         * @requires ontologyState.service:ontologyStateService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires ontologyUtilsManager.service:ontologyUtilsManagerService
         *
         * @description
         * `usagesBlock` is a directive that creates a section that displays the usages of the
         * {@link ontologyState.service:ontologyStateService selected entity} using
         * {@link propertyValues.directive:propertyValues}. The usages are only shown 100 at a time to save rendering
         * time with a link at the bottom to load more. The directive is replaced by the contents of its template.
         */
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
                    dvm.size = 100;
                    dvm.index = 0;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.id = 'usages-' + dvm.os.getActiveKey() + '-' + dvm.os.listItem.ontologyRecord.recordId;
                    dvm.results = getResults();
                    dvm.total = 0;
                    dvm.shown = 0;

                    dvm.getMoreResults = function() {
                        dvm.index++;
                        _.forEach(_.get(_.chunk(_.get(dvm.os.getActivePage(), 'usages', []), dvm.size), dvm.index, []), binding => addToResults(dvm.results, binding));
                    }

                    $scope.$watch(function() {
                        return dvm.os.getActivePage().usages;
                    }, function() {
                        dvm.size = 100;
                        dvm.index = 0;
                        dvm.shown = 0;
                        dvm.results = getResults();
                    });

                    function getResults() {
                        var results = {};
                        var usages = _.get(dvm.os.getActivePage(), 'usages', []);
                        dvm.total = usages.length;
                        var chunks = _.chunk(usages, dvm.size);
                        dvm.chunks = chunks.length === 0 ? 0 : chunks.length - 1;
                        _.forEach(_.get(chunks, dvm.index, []), binding => addToResults(results, binding));
                        return results;
                    }

                    function addToResults(results, binding) {
                        results[binding.p.value] = _.union(_.get(results, binding.p.value, []), [{subject: binding.s.value, predicate: binding.p.value, object: binding.o.value}]);
                        dvm.shown++;
                    }
                }]
            }
        }
})();
