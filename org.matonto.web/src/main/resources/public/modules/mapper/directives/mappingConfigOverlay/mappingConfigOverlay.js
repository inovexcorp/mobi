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
        /**
         * @ngdoc overview
         * @name mappingConfigOverlay
         *
         * @description
         * The `mappingConfigOverlay` module only provides the `mappingConfigOverlay` directive which creates
         * an overlay with functionality to edit the configuration of the current
         * {@link mapperState.service:mapperStateService#mapping mapping}.
         */
        .module('mappingConfigOverlay', [])
        /**
         * @ngdoc directive
         * @name mappingConfigOverlay.directive:mappingConfigOverlay
         * @scope
         * @restrict E
         * @requires $q
         * @requires util.service:utilService
         * @requires ontologyManager.service:ontologyManagerService
         * @requires mappingManager.service:mappingManagerService
         * @requires mapperState.service:mapperStateService
         * @requires catalogManager.service:catalogManagerService
         * @requires prefixes.service:prefixes
         *
         * @description
         * `mappingConfigOverlay` is a directive that creates an overlay with functionality to edit the
         * configuration of the current {@link mapperState.service:mapperStateService#mapping mapping}.
         * The configuration consists of the source ontology record, the ontology record version, and the base type
         * class. If editing a mapping that already has those data points set, a new mapping will be created with the
         * new settings and will remove any invalid entity mappings within the mapping. The directive is replaced by
         * the contents of its template.
         */
        .directive('mappingConfigOverlay', mappingConfigOverlay);

        mappingConfigOverlay.$inject = ['$q', 'utilService', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService', 'catalogManagerService', 'prefixes'];

        function mappingConfigOverlay($q, utilService, ontologyManagerService, mapperStateService, mappingManagerService, catalogManagerService, prefixes) {
            return {
                restrict: 'E',
                controllerAs: 'dvm',
                replace: true,
                scope: {},
                controller: function() {
                    var dvm = this;
                    dvm.util = utilService;
                    dvm.state = mapperStateService;
                    dvm.om = ontologyManagerService;
                    var cm = catalogManagerService;
                    var mm = mappingManagerService;

                    dvm.errorMessage = '';
                    dvm.ontologyStates = [];
                    dvm.recordsConfig = {
                        pageIndex: 0,
                        sortOption: _.find(cm.sortOptions, {field: prefixes.dcterms + 'title', asc: true}),
                        recordType: prefixes.ontologyEditor + 'OntologyRecord',
                        limit: 10,
                        searchText: ''
                    };
                    dvm.totalSize = 0;
                    dvm.links = {
                        next: '',
                        prev: ''
                    };
                    dvm.records = [];
                    dvm.selectedRecord = angular.copy(_.get(dvm.state.mapping, 'ontology'));
                    dvm.selectedVersion = 'latest';
                    dvm.selectedOntologyState = undefined;
                    dvm.classes = [];

                    if (dvm.selectedRecord) {
                        var stateObj = {
                            recordId: dvm.selectedRecord['@id']
                        };
                        var versionObj = {};
                        cm.getRecordMasterBranch(dvm.selectedRecord['@id'], cm.localCatalog['@id']).then(branch => {
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

                    dvm.getRecords = function() {
                        dvm.recordsConfig.pageIndex = 0;
                        cm.getRecords(cm.localCatalog['@id'], dvm.recordsConfig).then(parseRecordResults, onRecordsError);
                    }
                    dvm.getRecordPage = function(direction) {
                        if (direction === 'prev') {
                            dvm.util.getResultsPage(dvm.links.prev).then(response => {
                                dvm.recordsConfig.pageIndex -= 1;
                                parseRecordResults(response);
                            }, onRecordsError);
                        } else {
                            dvm.util.getResultsPage(dvm.links.next).then(response => {
                                dvm.recordsConfig.pageIndex += 1;
                                parseRecordResults(response);
                            }, onRecordsError);
                        }
                    }
                    dvm.selectOntology = function(record) {
                        dvm.selectedRecord = record;
                        var ontologyState = _.find(dvm.ontologyStates, {recordId: dvm.selectedRecord['@id']});
                        if (ontologyState && !_.isEqual(ontologyState, dvm.selectedOntologyState)) {
                            dvm.selectedOntologyState = ontologyState;
                            dvm.selectedVersion = 'latest';
                            dvm.classes = dvm.selectedOntologyState.latest.classes;
                            dvm.errorMessage = '';
                        } else if (!ontologyState) {
                            ontologyState = {
                                recordId: dvm.selectedRecord['@id']
                            };
                            var versionObj = {};
                            cm.getRecordMasterBranch(dvm.selectedRecord['@id'], cm.localCatalog['@id']).then(branch => {
                                ontologyState.branchId = branch['@id'];
                                versionObj.commitId = dvm.util.getPropertyId(branch, prefixes.catalog + 'head');
                                var ontologyInfo = {
                                    recordId: dvm.selectedRecord['@id'],
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
                                    cm.getRecordBranch(dvm.selectedOntologyState.branchId, dvm.selectedOntologyState.recordId, cm.localCatalog['@id']).then(branch => {
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
                            dvm.state.changeProp(mappingId, prefixes.delim + 'sourceRecord', selectedOntologyInfo.recordId, originalOntologyInfo.recordId);
                            dvm.state.changeProp(mappingId, prefixes.delim + 'sourceBranch', selectedOntologyInfo.branchId, originalOntologyInfo.branchId);
                            dvm.state.changeProp(mappingId, prefixes.delim + 'sourceCommit', selectedOntologyInfo.commitId, originalOntologyInfo.commitId);
                            dvm.state.mapping.ontology = dvm.selectedRecord;
                            dvm.state.resetEdit();
                            var classMappings = mm.getAllClassMappings(dvm.state.mapping.jsonld);
                            _.forEach(classMappings, classMapping => dvm.state.setAvailableProps(classMapping['@id']));
                            dvm.state.availableClasses = _.filter(dvm.classes, clazz => !_.find(classMappings, classMapping => mm.getClassIdByMapping(classMapping) === clazz.classObj['@id']));
                        }

                        dvm.state.displayMappingConfigOverlay = false;
                    }
                    dvm.cancel = function() {
                        dvm.state.displayMappingConfigOverlay = false;
                    }

                    function parseRecordResults(response) {
                        dvm.records = response.data;
                        var index = _.findIndex(dvm.records, {'@id': _.get(dvm.selectedRecord, '@id')});
                        dvm.selectedRecord = _.get(dvm.records, index, dvm.selectedRecord);
                        var headers = response.headers();
                        dvm.totalSize = _.get(headers, 'x-total-count', 0);
                        var links = dvm.util.parseLinks(_.get(headers, 'link', ''));
                        dvm.links.prev = _.get(links, 'prev', '');
                        dvm.links.next = _.get(links, 'next', '');
                        dvm.recordsErrorMessage = '';
                    }
                    function onError() {
                        dvm.errorMessage = 'Error retrieving ontology';
                        dvm.selectedRecord = undefined;
                        dvm.selectedOntologyState = undefined;
                        dvm.classes = [];
                    }
                    function onRecordsError() {
                        dvm.recordsErrorMessage = 'Error retrieving ontologies';
                    }

                    dvm.getRecords();
                },
                templateUrl: 'modules/mapper/directives/mappingConfigOverlay/mappingConfigOverlay.html'
            }
        }
})();
