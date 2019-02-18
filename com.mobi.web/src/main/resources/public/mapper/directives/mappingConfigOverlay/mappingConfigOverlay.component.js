/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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

    /**
     * @ngdoc component
     * @name mappingConfigOverlay.component:mappingConfigOverlay
     * @requires $q
     * @requires util.service:utilService
     * @requires ontologyManager.service:ontologyManagerService
     * @requires mapperState.service:mapperStateService
     * @requires mappingManager.service:mappingManagerService
     * @requires catalogManager.service:catalogManagerService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `mappingConfigOverlay` is a component that creates content for a modal with functionality to edit the
     * configuration of the current {@link mapperState.service:mapperStateService#mapping mapping}.
     * The configuration consists of the source ontology record, the ontology record version, and the base type
     * class. If editing a mapping that already has those data points set, a new mapping will be created with the
     * new settings and will remove any invalid entity mappings within the mapping. The list of ontologies is searchable
     * and selectable. Only 100 will be shown at a time. Meant to be used in conjunction with the
     * {@link modalService.directive:modalService}.
     *
     * @param {Function} close A function that closes the modal
     * @param {Function} dismiss A function that dismisses the modal
     */
    const mappingConfigOverlayComponent = {
        bindings: {
            close: '&',
            dismiss: '&'
        },
        controllerAs: 'dvm',
        controller: mappingConfigOverlayComponentCtrl,
        templateUrl: 'mapper/directives/mappingConfigOverlay/mappingConfigOverlay.component.html'
    };

    mappingConfigOverlayComponentCtrl.$inject = ['$q', 'httpService', 'utilService', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService', 'catalogManagerService', 'prefixes'];

    function mappingConfigOverlayComponentCtrl($q, httpService, utilService, ontologyManagerService, mapperStateService, mappingManagerService, catalogManagerService, prefixes) {
        var dvm = this;
        var cm = catalogManagerService;
        var mm = mappingManagerService;
        var catalogId = '';
        dvm.util = utilService;
        dvm.state = mapperStateService;
        dvm.om = ontologyManagerService;

        dvm.spinnerId = 'mapping-config-overlay';
        dvm.errorMessage = '';
        dvm.ontologyStates = [];
        dvm.recordsConfig = {
            pageIndex: 0,
            sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'title', asc: true}),
            recordType: prefixes.ontologyEditor + 'OntologyRecord',
            limit: 100,
            searchText: ''
        };
        dvm.ontologies = [];
        dvm.selectedOntology = undefined;
        dvm.selectedVersion = 'latest';
        dvm.selectedOntologyState = undefined;
        dvm.classes = [];

        dvm.$onInit = function() {
            catalogId = _.get(cm.localCatalog, '@id');
            var ontologyJsonld = angular.copy(_.get(dvm.state.mapping, 'ontology'));
            if (ontologyJsonld) {
                dvm.selectedOntology = {
                    jsonld: ontologyJsonld,
                    recordId: ontologyJsonld['@id'],
                    ontologyIRI: dvm.getOntologyIRI(ontologyJsonld),
                    title: dvm.util.getDctermsValue(ontologyJsonld, 'title'),
                    selected: true
                };
                var stateObj = {
                    recordId: dvm.selectedOntology.recordId
                };
                var versionObj = {};
                cm.getRecordMasterBranch(dvm.selectedOntology.recordId, catalogId).then(branch => {
                    stateObj.branchId = branch['@id'];
                    versionObj.ontologies = dvm.state.sourceOntologies;
                    versionObj.classes = dvm.state.getClasses(versionObj.ontologies);
                    dvm.classes = versionObj.classes;
                    var latestCommitId = dvm.util.getPropertyId(branch, prefixes.catalog + 'head');
                    var savedCommitId = _.get(mm.getSourceOntologyInfo(dvm.state.mapping.jsonld), 'commitId');
                    if (savedCommitId === latestCommitId) {
                        stateObj.latest = _.set(versionObj, 'commitId', latestCommitId);
                    } else {
                        stateObj.saved = _.set(versionObj, 'commitId', savedCommitId);
                        dvm.selectedVersion = 'saved';
                    }
                    dvm.ontologyStates.push(stateObj);
                    dvm.selectedOntologyState = stateObj;
                }, onError);
            }
            dvm.setOntologies();
        }
        
        dvm.getOntologyIRI = function(record) {
            return dvm.util.getPropertyId(record, prefixes.ontologyEditor + 'ontologyIRI');
        }
        dvm.setOntologies = function() {
            httpService.cancel(dvm.spinnerId);
            cm.getRecords(catalogId, dvm.recordsConfig, dvm.spinnerId).then(parseRecordResults, onRecordsError);
        }
        dvm.toggleOntology = function(ontology) {
            if (ontology.selected) {
                _.forEach(dvm.ontologies, record => {
                    if (record.recordId !== ontology.recordId) {
                        record.selected = false;
                    }
                });
                dvm.selectOntology(ontology);
            } else {
                if (_.get(dvm.selectedOntology, 'recordId') === ontology.recordId) {
                    dvm.selectedOntology = undefined;
                    dvm.selectedVersion = 'latest';
                    dvm.selectedOntologyState = undefined;
                    dvm.classes = [];
                }
            }
        }
        dvm.selectOntology = function(ontology) {
            dvm.selectedOntology = ontology;
            var ontologyState = _.find(dvm.ontologyStates, {recordId: dvm.selectedOntology.recordId});
            if (ontologyState && !_.isEqual(ontologyState, dvm.selectedOntologyState)) {
                dvm.selectedOntologyState = ontologyState;
                dvm.selectedVersion = _.has(dvm.selectedOntologyState, 'latest') ? 'latest' : 'saved';
                dvm.classes = dvm.selectedOntologyState[dvm.selectedVersion].classes;
                dvm.errorMessage = '';
            } else if (!ontologyState) {
                ontologyState = {
                    recordId: dvm.selectedOntology.recordId
                };
                var versionObj = {};
                cm.getRecordMasterBranch(dvm.selectedOntology.recordId, catalogId).then(branch => {
                    ontologyState.branchId = branch['@id'];
                    versionObj.commitId = dvm.util.getPropertyId(branch, prefixes.catalog + 'head');
                    var ontologyInfo = {
                        recordId: dvm.selectedOntology.recordId,
                        branchId: ontologyState.branchId,
                        commitId: versionObj.commitId
                    };
                    return mm.getOntology(ontologyInfo);
                }, $q.reject).then(ontology => {
                    versionObj.ontologies = [ontology];
                    return dvm.om.getImportedOntologies(ontologyState.recordId, ontologyState.branchId, versionObj.commitId);
                }, $q.reject).then(imported => {
                    _.forEach(imported, obj => {
                        var ontology = {id: obj.id, entities: obj.ontology};
                        versionObj.ontologies.push(ontology);
                    });
                    versionObj.classes = dvm.state.getClasses(versionObj.ontologies);
                    dvm.classes = versionObj.classes;
                    ontologyState.latest = versionObj;
                    dvm.selectedVersion = 'latest';
                    dvm.ontologyStates.push(ontologyState);
                    dvm.selectedOntologyState = ontologyState;
                    dvm.errorMessage = '';
                }, onError);
            }
        }
        dvm.selectVersion = function() {
            if (dvm.selectedOntologyState) {
                if (_.has(dvm.selectedOntologyState, dvm.selectedVersion)) {
                    dvm.classes = dvm.selectedOntologyState[dvm.selectedVersion].classes;
                    dvm.errorMessage = '';
                } else {
                    var versionObj = {};
                    if (dvm.selectedVersion === 'latest') {
                        cm.getRecordBranch(dvm.selectedOntologyState.branchId, dvm.selectedOntologyState.recordId, catalogId).then(branch => {
                            versionObj.commitId = dvm.util.getPropertyId(branch, prefixes.catalog + 'head');
                            var ontologyInfo = {
                                recordId: dvm.selectedOntologyState.recordId,
                                branchId: dvm.selectedOntologyState.branchId,
                                commitId: versionObj.commitId
                            };
                            return mm.getOntology(ontologyInfo);
                        }, $q.reject).then(ontology => {
                            versionObj.ontologies = [ontology];
                            return dvm.om.getImportedOntologies(dvm.selectedOntologyState.recordId, dvm.selectedOntologyState.branchId, versionObj.commitId);
                        }, $q.reject).then(imported => {
                            _.forEach(imported, obj => {
                                var ontology = {id: obj.id, entities: obj.ontology};
                                versionObj.ontologies.push(ontology);
                            });
                            versionObj.classes = dvm.state.getClasses(versionObj.ontologies);
                            dvm.classes = versionObj.classes;
                            dvm.selectedOntologyState.latest = versionObj;
                            dvm.errorMessage = '';
                        }, onError);
                    } else {
                        var ontologyInfo = mm.getSourceOntologyInfo(dvm.state.mapping.jsonld);
                        versionObj.commitId = ontologyInfo.commitId;
                        mm.getOntology(ontologyInfo).then(ontology => {
                            versionObj.ontologies = [ontology];
                            return dvm.om.getImportedOntologies(ontologyInfo.recordId, ontologyInfo.branchId, ontologyInfo.commitId);
                        }, $q.reject).then(imported => {
                            _.forEach(imported, obj => {
                                var ontology = {id: obj.id, entities: obj.ontology};
                                versionObj.ontologies.push(ontology);
                            });
                            versionObj.classes = dvm.state.getClasses(versionObj.ontologies);
                            dvm.classes = versionObj.classes;
                            dvm.selectedOntologyState.saved = versionObj;
                            dvm.errorMessage = '';
                        }, onError);
                    }
                }
            }
        }
        dvm.set = function() {
            var selectedOntologyInfo = {
                recordId: dvm.selectedOntologyState.recordId,
                branchId: dvm.selectedOntologyState.branchId,
                commitId: dvm.selectedOntologyState[dvm.selectedVersion].commitId
            };
            var originalOntologyInfo = mm.getSourceOntologyInfo(dvm.state.mapping.jsonld);
            if (!_.isEqual(originalOntologyInfo, selectedOntologyInfo)) {
                dvm.state.sourceOntologies = dvm.selectedOntologyState[dvm.selectedVersion].ontologies;
                var incompatibleEntities = mm.findIncompatibleMappings(dvm.state.mapping.jsonld, dvm.state.sourceOntologies);
                _.forEach(incompatibleEntities, entity => {
                    if (_.find(dvm.state.mapping.jsonld, {'@id': entity['@id']})) {
                        if (mm.isPropertyMapping(entity)) {
                            var parentClassMapping = mm.isDataMapping(entity) ? mm.findClassWithDataMapping(dvm.state.mapping.jsonld, entity['@id']) : mm.findClassWithObjectMapping(dvm.state.mapping.jsonld, entity['@id']);
                            dvm.state.deleteProp(entity['@id'], parentClassMapping['@id']);
                        } else if (mm.isClassMapping(entity)) {
                            dvm.state.deleteClass(entity['@id']);
                        }
                    }
                });
                mm.setSourceOntologyInfo(dvm.state.mapping.jsonld, selectedOntologyInfo.recordId, selectedOntologyInfo.branchId, selectedOntologyInfo.commitId);
                var mappingId = mm.getMappingEntity(dvm.state.mapping.jsonld)['@id'];
                dvm.state.changeProp(mappingId, prefixes.delim + 'sourceRecord', selectedOntologyInfo.recordId, originalOntologyInfo.recordId, true);
                dvm.state.changeProp(mappingId, prefixes.delim + 'sourceBranch', selectedOntologyInfo.branchId, originalOntologyInfo.branchId, true);
                dvm.state.changeProp(mappingId, prefixes.delim + 'sourceCommit', selectedOntologyInfo.commitId, originalOntologyInfo.commitId, true);
                dvm.state.mapping.ontology = dvm.selectedOntology.jsonld;
                dvm.state.resetEdit();
                var classMappings = mm.getAllClassMappings(dvm.state.mapping.jsonld);
                _.forEach(_.uniq(_.map(classMappings, mm.getClassIdByMapping)), id => {
                    dvm.state.setProps(id);
                });
                dvm.state.availableClasses = dvm.classes;
            }
            dvm.close();
        }
        dvm.cancel = function() {
            dvm.dismiss();
        }

        function parseRecordResults(response) {
            dvm.ontologies = _.map(response.data, record => ({
                recordId: record['@id'],
                ontologyIRI: dvm.getOntologyIRI(record),
                title: dvm.util.getDctermsValue(record, 'title'),
                selected: false,
                jsonld: record
            }));
            _.set(_.find(dvm.ontologies, {recordId: _.get(dvm.selectedOntology, 'recordId')}), 'selected', true);
            dvm.recordsErrorMessage = '';
        }
        function onError() {
            dvm.errorMessage = 'Error retrieving ontology';
            dvm.selectedOntology = undefined;
            dvm.selectedOntologyState = undefined;
            dvm.classes = [];
        }
        function onRecordsError() {
            dvm.recordsErrorMessage = 'Error retrieving ontologies';
        }
    }

    angular
        /**
         * @ngdoc overview
         * @name mappingConfigOverlay
         *
         * @description
         * The `mappingConfigOverlay` module only provides the `mappingConfigOverlay` component which creates content
         * for a modal to edit the configuration of a mapping.
         */
        .module('mappingConfigOverlay', [])
        .component('mappingConfigOverlay', mappingConfigOverlayComponent);
})();
