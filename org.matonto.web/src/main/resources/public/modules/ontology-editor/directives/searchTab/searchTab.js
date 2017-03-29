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

        searchTab.$inject = ['ontologyStateService', 'ontologyUtilsManagerService', 'ontologyManagerService'];

        function searchTab(ontologyStateService, ontologyUtilsManagerService, ontologyManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/searchTab/searchTab.html',
                scope: {},
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.os = ontologyStateService;
                    dvm.um = ontologyUtilsManagerService;
                    dvm.om = ontologyManagerService;

                    dvm.onKeyup = function($event) {
                        if ($event.keyCode === 13) {
                            dvm.os.unSelectItem();
                            dvm.om.getSearchResults(dvm.os.listItem.recordId, dvm.os.listItem.branchId,
                                dvm.os.listItem.commitId, dvm.os.state.searchText).then(results => {
                                    dvm.os.state.errorMessage = '';
                                    dvm.os.state.results = results;
                                    dvm.os.state.infoMessage = !_.isEmpty(results) ? ''
                                        : 'There were no results for your search text.';
                                    dvm.os.state.highlightText = dvm.os.state.searchText;
                                }, errorMessage => {
                                    dvm.os.state.errorMessage = errorMessage;
                                    dvm.os.state.infoMessage = '';
                                });
                        }
                    }

                    dvm.onClear = function() {
                        dvm.os.state.errorMessage = '';
                        dvm.os.state.highlightText = '';
                        dvm.os.state.infoMessage = '';
                        dvm.os.state.results = {};
                        dvm.os.state.searchText = '';
                        dvm.os.state.selected = {};
                    }

                    function setSelected() {
                        dvm.os.state.selected = _.omit(angular.copy(dvm.os.selected), '@id', '@type', 'matonto');
                    }

                    $scope.$watch('dvm.os.selected', setSelected);
                }]
            }
        }
})();
