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
        .module('searchTab', [])
        .directive('searchTab', searchTab);

        searchTab.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'ontologyManagerService', 'httpService'];

        function searchTab(ontologyStateService, ontologyUtilsManagerService, ontologyManagerService, httpService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/searchTab/searchTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.ontoUtils = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.id = 'search-' + dvm.os.listItem.recordId;

                    dvm.onKeyup = function($event) {
                        if ($event.keyCode === 13) {
                            httpService.cancel(dvm.id);
                            dvm.os.unSelectItem();
                            var state = dvm.os.getState(dvm.os.listItem.recordId);
                            dvm.om.getSearchResults(dvm.os.listItem.recordId, dvm.os.listItem.branchId, dvm.os.listItem.commitId, dvm.os.state.search.searchText, dvm.id)
                                .then(results => {
                                    state.search.errorMessage = '';
                                    state.search.results = results;
                                    state.search.infoMessage = !_.isEmpty(results) ? '' : 'There were no results for your search text.';
                                    state.search.highlightText = state.search.searchText;
                                }, errorMessage => {
                                    state.search.errorMessage = errorMessage;
                                    state.search.infoMessage = '';
                                });
                        }
                    }

                    dvm.onClear = function() {
                        dvm.os.state.search.errorMessage = '';
                        dvm.os.state.search.highlightText = '';
                        dvm.os.state.search.infoMessage = '';
                        dvm.os.state.search.results = {};
                        dvm.os.state.search.searchText = '';
                        dvm.os.state.search.selected = {};
                    }

                    $scope.$watch('dvm.os.selected', (newValue, oldValue) => {
                        if (!_.isEqual(oldValue, newValue)) {
                            dvm.os.state.search.selected = _.omit(angular.copy(newValue), '@id', '@type', 'matonto');
                        }
                    });
                }]
            }
        }
})();
