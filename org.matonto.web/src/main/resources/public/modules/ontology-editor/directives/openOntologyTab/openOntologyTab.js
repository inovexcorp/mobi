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

        openOntologyTab.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes',
            'catalogManagerService'];

        function openOntologyTab($filter, ontologyManagerService, ontologyStateService, prefixes,
            catalogManagerService) {
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
                    var cm = catalogManagerService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');
                    dvm.om = ontologyManagerService;
                    dvm.sm = ontologyStateService;
                    dvm.begin = 0;
                    dvm.limit = 10;
                    dvm.ontologyRecords = [];
                    dvm.type = 'ontology';

                    dvm.open = function(id, type) {
                        dvm.om.openOntology(id, type)
                            .then(ontologyId => {
                                var listItem = dvm.om.getListItemById(ontologyId);
                                dvm.sm.addState(ontologyId, dvm.om.getOntologyIRI(listItem.ontology), type);
                                dvm.sm.setState(ontologyId);
                            }, errorMessage => {
                                dvm.errorMessage = errorMessage;
                            });
                    }

                    dvm.getPage = function(direction) {
                        if (direction === 'next') {
                            dvm.begin += dvm.limit;
                        } else {
                            dvm.begin -= dvm.limit;
                        }
                    }

                    dvm.getRecordValue = function(record, property) {
                        return _.get(record, "['" + prefixes.dcterms + property + "'][0]['@value']");
                    }

                    dvm.showDeleteConfirmationOverlay = function(record) {
                        dvm.recordId = _.get(record, '@id', '');
                        dvm.recordTitle = dvm.getRecordValue(record, 'title');
                        dvm.errorMessage = '';
                        dvm.showDeleteConfirmation = true;
                    }

                    dvm.deleteOntology = function() {
                        cm.deleteRecord(dvm.recordId, catalogId)
                            .then(response => {
                                _.remove(dvm.ontologyRecords, record => _.get(record, '@id', '') === dvm.recordId);
                                dvm.showDeleteConfirmation = false;
                            }, errorMessage => dvm.errorMessage = errorMessage);
                    }

                    dvm.download = function(id) {
                        dvm.sm.downloadId = id;
                        dvm.sm.showDownloadOverlay = true;
                    }

                    dvm.getAllOntologyRecords = function(sortingOption) {
                        dvm.om.getAllOntologyRecords(sortingOption)
                            .then(response => dvm.ontologyRecords = _.get(response, 'data', []));
                    }

                    $scope.$watch(
                        function watchFilterText(scope) {
                            return(dvm.filterText + dvm.ontologyRecords);
                        },
                        function handleFilterTextChange(newValue, oldValue) {
                            dvm.ontologyRecords = $filter('filter')(dvm.ontologyRecords, dvm.filterText,
                                (actual, expected) => {
                                    expected = _.lowerCase(expected);
                                    return _.includes(_.lowerCase(dvm.getRecordValue(actual, 'title')), expected)
                                        || _.includes(_.lowerCase(dvm.getRecordValue(actual, 'description')), expected)
                                        || _.includes(_.lowerCase(dvm.getRecordValue(actual, 'identifier')), expected);
                                });
                        }
                    );

                    dvm.getAllOntologyRecords();
                }]
            }
        }
})();
