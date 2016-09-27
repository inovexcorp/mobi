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
        .module('openOntologyTab', [])
        .directive('openOntologyTab', openOntologyTab);

        openOntologyTab.$inject = ['$filter', 'ontologyManagerService', 'stateManagerService'];

        function openOntologyTab($filter, ontologyManagerService, stateManagerService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/openOntologyTab/openOntologyTab.html',
                scope: {
                    listItem: '='
                },
                controllerAs: 'dvm',
                controller: ['$scope', function($scope) {
                    var dvm = this;
                    dvm.om = ontologyManagerService;
                    dvm.sm = stateManagerService;
                    dvm.begin = 0;
                    dvm.limit = 20;
                    dvm.filteredIds = dvm.om.ontologyIds;
                    dvm.type = 'ontology';

                    dvm.open = function open(id, type) {
                        dvm.om.openOntology(id, type)
                            .then(ontologyId => {
                                var listItem = dvm.om.getListItemById(ontologyId);
                                dvm.sm.addState(ontologyId, dvm.om.getOntologyIRI(listItem.ontology), type);
                                dvm.sm.setState(ontologyId);
                            }, errorMessage => {
                                dvm.error = errorMessage;
                            });
                    }

                    dvm.getPage = function(direction) {
                        if (direction === 'next') {
                            dvm.begin += dvm.limit;
                        } else {
                            dvm.begin -= dvm.limit;
                        }
                    }

                    dvm.showDeleteConfirmationOverlay = function(ontologyId) {
                        dvm.ontologyId = ontologyId;
                        dvm.errorMessage = '';
                        dvm.showDeleteConfirmation = true;
                    }

                    dvm.deleteOntology = function() {
                        dvm.om.deleteOntology(dvm.ontologyId)
                            .then(
                                response => dvm.showDeleteConfirmation = false,
                                errorMessage => dvm.errorMessage = errorMessage
                            );
                    }

                    dvm.download = function(id) {
                        dvm.sm.downloadId = id;
                        dvm.sm.showDownloadOverlay = true;
                    }

                    $scope.$watch(
                        function watchFilterText(scope) {
                            return(dvm.filterText + dvm.om.ontologyIds);
                        },
                        function handleFilterTextChange(newValue, oldValue) {
                            dvm.filteredIds = $filter('filter')(dvm.om.ontologyIds, dvm.filterText);
                        }
                    );
                }]
            }
        }
})();
