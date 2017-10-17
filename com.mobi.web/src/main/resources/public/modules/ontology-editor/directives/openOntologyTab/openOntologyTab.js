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
        .module('openOntologyTab', [])
        .directive('openOntologyTab', openOntologyTab);

        openOntologyTab.$inject = ['$filter', 'ontologyManagerService', 'ontologyStateService', 'prefixes',
            'stateManagerService', 'utilService', 'mapperStateService'];

        function openOntologyTab($filter, ontologyManagerService, ontologyStateService, prefixes,
            stateManagerService, utilService, mapperStateService) {
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
                    var sm = stateManagerService;
                    var ontologyRecords = [];

                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ms = mapperStateService;
                    dvm.util = utilService;
                    dvm.begin = 0;
                    dvm.limit = 10;
                    dvm.filteredList = [];
                    dvm.type = 'ontology';

                    dvm.openSelected = function(record) {
                        dvm.recordId = record['@id'];
                        dvm.recordTitle = dvm.util.getDctermsValue(record, 'title');
                        dvm.showOpenOverlay = true
                    }

                    dvm.open = function() {
                        dvm.os.openOntology(dvm.recordId, dvm.recordTitle, dvm.type)
                            .then(ontologyId => {
                                dvm.showOpenOverlay = false;
                            }, errorMessage => dvm.errorMessage = errorMessage);
                    }

                    dvm.getPage = function(direction) {
                        if (direction === 'next') {
                            dvm.begin += dvm.limit;
                        } else {
                            dvm.begin -= dvm.limit;
                        }
                    }

                    dvm.showDeleteConfirmationOverlay = function(record) {
                        dvm.recordId = _.get(record, '@id', '');
                        dvm.recordTitle = dvm.util.getDctermsValue(record, 'title');
                        dvm.errorMessage = '';

                        if (_.find(dvm.ms.sourceOntologies, {recordId: dvm.recordId})) {
                            dvm.mappingErrorMessage = "Warning: The ontology you're about to delete is currently open in the mapping tool.";
                        } else {
                            dvm.mappingErrorMessage = '';
                        }

                        dvm.showDeleteConfirmation = true;
                    }

                    dvm.deleteOntology = function() {
                        dvm.om.deleteOntology(dvm.recordId)
                            .then(response => {
                                _.remove(ontologyRecords, record => _.get(record, '@id', '') === dvm.recordId);
                                var state = sm.getOntologyStateByRecordId(dvm.recordId);
                                if (!_.isEmpty(state)) {
                                    sm.deleteState(_.get(state, 'id', ''));
                                }
                                dvm.showDeleteConfirmation = false;
                            }, errorMessage => dvm.errorMessage = errorMessage);
                    }

                    dvm.getAllOntologyRecords = function(sortingOption) {
                        dvm.om.getAllOntologyRecords(sortingOption)
                            .then(records => {
                                ontologyRecords = records;
                                dvm.filteredList = getFilteredRecords(ontologyRecords);
                            });
                    }

                    $scope.$watch(function() {
                        return dvm.filterText + dvm.os.list + ontologyRecords;
                    }, function handleFilterTextChange(newValue, oldValue) {
                        dvm.filteredList = $filter('filter')(getFilteredRecords(ontologyRecords), dvm.filterText,
                            (actual, expected) => {
                                expected = _.lowerCase(expected);
                                return _.includes(_.lowerCase(dvm.util.getDctermsValue(actual, 'title')), expected)
                                    || _.includes(_.lowerCase(dvm.util.getDctermsValue(actual, 'description')), expected)
                                    || _.includes(_.lowerCase(dvm.util.getDctermsValue(actual, 'identifier')), expected);
                            });
                    });

                    dvm.getAllOntologyRecords();

                    function getFilteredRecords(records) {
                        return _.reject(records, record => _.find(dvm.os.list, {ontologyRecord: {recordId: record['@id']}}));
                    }
                }]
            }
        }
})();
