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
         * @name runMappingOntologyOverlay
         *
         * @description
         * The `runMappingOntologyOverlay` module only provides the `runMappingOntologyOverlay` directive which creates
         * an overlay with settings for committing the results of a mapping to an Ontology.
         */
        .module('runMappingOntologyOverlay', [])
        /**
         * @ngdoc directive
         * @name runMappingOntologyOverlay.directive:runMappingOntologyOverlay
         * @scope
         * @restrict E
         * @requires mapperState.service:mapperStateService
         * @requires delimitedManager.service:delimitedManagerService
         * @requires util.service:utilService
         * @requires catalogManager.service:catalogManagerService
         * @requires ontologyState.service:ontologyStateService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `runMappingOntologyOverlay` is a directive that creates an overlay containing a configuration settings
         * for the result of running the currently selected {@link mapperState.service:mapperStateService#mapping mapping}
         * against the uploaded {@link delimitedManager.service:delimitedManagerService#dataRows delimited data}.
         * This includes a ui-select to determine which ontology's master branch to commit the mapping to. The directive
         * is replaced by the contents of its template.
         */
        .directive('runMappingOntologyOverlay', runMappingOntologyOverlay);

        runMappingOntologyOverlay.$inject = ['mapperStateService', 'delimitedManagerService', 'utilService', 'catalogManagerService', 'ontologyStateService', 'prefixes'];

        function runMappingOntologyOverlay(mapperStateService, delimitedManagerService, utilService, catalogManagerService, ontologyStateService, prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    var state = mapperStateService;
                    var dm = delimitedManagerService;
                    var cm = catalogManagerService;
                    var os = ontologyStateService;
                    var branches = [];
                    dvm.util = utilService;
                    dvm.errorMessage = '';
                    dvm.ontologies = [];
                    dvm.branches = [];
                    dvm.branchId = undefined;
                    dvm.ontology = undefined;
                    dvm.update = false;

                    dvm.changeOntology = function(ontologyRecord) {
                        if (ontologyRecord) {
                            setOntologyBranches(ontologyRecord);
                        }
                    }
                    dvm.getOntologyIRI = function(ontology) {
                        return dvm.util.getPropertyId(ontology, prefixes.ontEdit + 'ontologyIRI');
                    }
                    dvm.getOntologies = function(searchText) {
                        var catalogId = _.get(cm.localCatalog, '@id', '');
                        var paginatedConfig = {
                            limit: 50,
                            recordType: prefixes.ontologyEditor + 'OntologyRecord',
                            sortOption: _.find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true}),
                            searchText
                        };
                        cm.getRecords(catalogId, paginatedConfig, 'test')
                            .then(response => {
                                dvm.ontologies = response.data;
                            });
                    }
                    function setOntologyBranches(ontologyRecord) {
                        var catalogId = _.get(cm.localCatalog, '@id', '');
                        var recordId = _.get(ontologyRecord, '@id', '');
                        var paginatedConfig = {
                            sortOption: _.find(cm.sortOptions, {field: 'http://purl.org/dc/terms/title', asc: true}),
                        };
                        if (recordId) {
                            return cm.getRecordBranches(recordId, catalogId, paginatedConfig)
                                .then(response => {
                                    dvm.branches = response.data;
                                    dvm.branchId = _.get(_.find(dvm.branches, branch => dvm.util.getDctermsValue(branch, 'title') === 'MASTER'), '@id');
                                });
                        }
                    }
                    dvm.run = function() {
                        if (state.editMapping && state.isMappingChanged()) {
                            state.saveMapping().then(runMapping, onError);
                        } else {
                            runMapping(state.mapping.record.id);
                        }
                    }
                    dvm.cancel = function() {
                        state.displayRunMappingOntologyOverlay = false;
                    }

                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                    }
                    function runMapping(id) {
                        state.mapping.record.id = id;
                        dm.mapAndCommit(id, dvm.ontology['@id'], dvm.branchId, dvm.update).then(response => {
                            if (response.status === 204) {
                                dvm.util.createWarningToast('No commit was submitted, commit was empty due to duplicate data', {timeOut: 8000});
                                reset();
                            } else {
                                testOntology(dvm.ontology)
                                reset();
                            }
                        }, onError);
                    }
                    function reset() {
                        state.step = state.selectMappingStep;
                        state.initialize();
                        state.resetEdit();
                        dm.reset();
                        state.displayRunMappingOntologyOverlay = false;
                    }
                    function testOntology(ontologyRecord) {
                        var item = _.find(os.list, {ontologyRecord: {recordId: ontologyRecord['@id']}});
                        if (item) {
                            if (_.get(item, 'ontologyRecord.branchId') === dvm.branchId) {
                                item.upToDate = false;
                                if (item.merge.active) {
                                    dvm.util.createWarningToast('You have a merge in progress in the Ontology Editor for ' + dvm.util.getDctermsValue(ontologyRecord, 'title') + ' that is out of date. Please reopen the merge form.', {timeOut: 5000});
                                }
                            }
                            if (item.merge.active && _.get(item.merge.target, '@id') === dvm.branchId) {
                                dvm.util.createWarningToast('You have a merge in progress in the Ontology Editor for ' + dvm.util.getDctermsValue(ontologyRecord, 'title') + ' that is out of date. Please reopen the merge form to avoid conflicts.', {timeOut: 5000});
                            }
                        }
                    }
                },
                templateUrl: 'modules/mapper/directives/runMappingOntologyOverlay/runMappingOntologyOverlay.html'
            }
        }
})();
