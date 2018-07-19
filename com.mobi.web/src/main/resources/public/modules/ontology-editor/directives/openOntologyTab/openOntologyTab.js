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

        openOntologyTab.$inject = ['httpService', 'ontologyManagerService', 'ontologyStateService', 'prefixes',
            'stateManagerService', 'utilService', 'mapperStateService', 'catalogManagerService'];

        function openOntologyTab(httpService, ontologyManagerService, ontologyStateService, prefixes,
            stateManagerService, utilService, mapperStateService, catalogManagerService) {
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
                    var cm = catalogManagerService;
                    var ontologyRecords = [];

                    dvm.prefixes = prefixes;
                    dvm.om = ontologyManagerService;
                    dvm.os = ontologyStateService;
                    dvm.ms = mapperStateService;
                    dvm.util = utilService;
                    dvm.pageIndex = 0;
                    dvm.limit = 10;
                    dvm.totalSize = 0;
                    dvm.filteredList = [];
                    dvm.id = "openOntologyTabTargetedSpinner";

                    dvm.open = function(record) {
                        dvm.os.openOntology(record['@id'], dvm.util.getDctermsValue(record, 'title'))
                            .then(_.noop, dvm.util.createErrorToast);
                    }
                    dvm.newOntology = function() {
                        var date = new Date();
                        dvm.os.newOntology = {
                            '@id': 'https://mobi.com/ontologies/' + (date.getMonth() + 1) + '/' + date.getFullYear() + '/',
                            '@type': [prefixes.owl + 'Ontology'],
                            [prefixes.dcterms + 'title']: [{
                                '@value': ''
                            }],
                            [prefixes.dcterms + 'description']: [{
                                '@value': ''
                            }]
                        };
                        dvm.os.newKeywords = [];
                        dvm.os.newLanguage = undefined;
                        dvm.os.showNewTab = true;
                    }
                    dvm.getPage = function(direction) {
                        if (direction === 'next') {
                            dvm.pageIndex++;
                        } else {
                            dvm.pageIndex--;
                        }
                        dvm.getPageOntologyRecords();
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
                    dvm.getPageOntologyRecords = function(sortOption = _.find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true})) {
                        var ontologyRecordType = prefixes.ontologyEditor + 'OntologyRecord';
                        var catalogId = _.get(cm.localCatalog, '@id', '');
                        var paginatedConfig = {
                            pageIndex: dvm.pageIndex,
                            limit: dvm.limit,
                            recordType: ontologyRecordType,
                            sortOption,
                            searchText: dvm.filterText
                        };
                        httpService.cancel(dvm.id);
                        cm.getRecords(catalogId, paginatedConfig, dvm.id).then(response => {
                            var ontologyRecords = response.data;
                            dvm.filteredList = getFilteredRecords(ontologyRecords);
                            if (response.headers() !== undefined) {
                                dvm.totalSize = _.get(response.headers(), 'x-total-count');
                            }
                        });
                    }
                    dvm.search = function(event) {
                        dvm.pageIndex = 0;
                        // keyCode 13 is the enter key
                        if (event.keyCode === 13) {
                            dvm.getPageOntologyRecords();
                        }
                    }
                    
                    $scope.$watch(() => dvm.os.list.length, () => {
                        dvm.getPageOntologyRecords();
                    });

                    function getFilteredRecords(records) {
                        return _.reject(records, record => _.find(dvm.os.list, {ontologyRecord: {recordId: record['@id']}}));
                    }
                }]
            }
        }
})();