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
                    dvm.mm = mappingManagerService;
                    dvm.om = ontologyManagerService;
                    dvm.cm = catalogManagerService;
                    dvm.errorMessage = '';

                    dvm.ontologyStates = [];
                    dvm.recordsConfig = {
                        pageIndex: 0,
                        sortOption: _.find(dvm.cm.sortOptions, {field: prefixes.dcterms + 'title', ascending: true}),
                        recordType: prefixes.catalog + 'OntologyRecord',
                        limit: 10,
                        searchText: ''
                    };
                    dvm.totalSize = 0;
                    dvm.links = {
                        next: '',
                        prev: ''
                    };
                    dvm.records = [];
                    dvm.selectedRecord = angular.copy(_.get(dvm.state.mapping, 'record'));
                    dvm.selectedVersion = 'latest';
                    dvm.selectedOntologyState = undefined;
                    dvm.classes = [];

                    if (dvm.selectedRecord) {
                        var stateObj = {
                            recordId: dvm.selectedRecord['@id']
                        };
                        var versionObj = {};
                        dvm.cm.getRecordMasterBranch(dvm.selectedRecord['@id'], dvm.cm.localCatalog['@id']).then(branch => {
                            stateObj.branchId = branch['@id'];
                            return dvm.cm.getBranchHeadCommit(branch['@id'], dvm.selectedRecord['@id'], dvm.cm.localCatalog['@id']);
                        }, $q.reject).then(commit => {
                            versionObj.commitId = commit.commit['@id'];
                            versionObj.ontologies = dvm.state.sourceOntologies;
                            versionObj.classes = dvm.state.getClasses(versionObj.ontologies);
                            dvm.classes = versionObj.classes;
                            if (_.get(dvm.mm.getSourceOntologyInfo(dvm.state.mapping.jsonld), 'commitId') === versionObj.commitId) {
                                stateObj.latest = versionObj;
                            } else {
                                stateObj.saved = versionObj;
                                dvm.selectedVersion = 'saved';
                            }
                            dvm.ontologyStates.push(stateObj);
                            dvm.selectedOntologyState = stateObj;
                        }, onError);
                    }

                    dvm.getRecords = function() {
                        dvm.recordsConfig.pageIndex = 0;
                        dvm.cm.getRecords(dvm.cm.localCatalog['@id'], dvm.recordsConfig).then(parseRecordResults, onError);
                    }
                    dvm.getRecordPage = function(direction) {
                        if (direction === 'prev') {
                            dvm.util.getResultsPage(dvm.links.prev).then(response => {
                                dvm.recordsConfig.pageIndex -= 1;
                                parseRecordResults(response);
                            }, onError);
                        } else {
                            dvm.util.getResultsPage(dvm.links.next).then(response => {
                                dvm.recordsConfig.pageIndex += 1;
                                parseRecordResults(response);
                            }, onError);
                        }
                    }
                    dvm.selectOntology = function(record) {
                        dvm.selectedRecord = record;
                        var ontologyState = _.find(dvm.ontologyStates, {recordId: dvm.selectedRecord['@id']});
                        if (ontologyState) {
                            dvm.selectedOntologyState = ontologyState;
                            dvm.selectedVersion = 'latest';
                            dvm.classes = dvm.selectedOntologyState.latest.classes;
                            dvm.errorMessage = '';
                        } else {
                            ontologyState = {
                                recordId: dvm.selectedRecord['@id']
                            };
                            var versionObj = {};
                            dvm.cm.getRecordMasterBranch(dvm.selectedRecord['@id'], dvm.cm.localCatalog['@id']).then(branch => {
                                ontologyState.branchId = branch['@id'];
                                return dvm.cm.getBranchHeadCommit(branch['@id'], dvm.selectedRecord['@id'], dvm.cm.localCatalog['@id']);
                            }, $q.reject).then(commit => {
                                versionObj.commitId = commit.commit['@id'];
                                var ontologyInfo = {
                                    recordId: dvm.selectedRecord['@id'],
                                    branchId: ontologyState.branchId,
                                    commitId: versionObj.commitId
                                };
                                return dvm.mm.getOntology(ontologyInfo);
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
                                    dvm.cm.getBranchHeadCommit(dvm.selectedOntologyState.branchId, dvm.selectedOntologyState.recordId, dvm.cm.localCatalog['@id']).then(commit => {
                                        versionObj.commitId = commit.commit['@id'];
                                        var ontologyInfo = {
                                            recordId: dvm.selectedOntologyState.recordId,
                                            branchId: dvm.selectedOntologyState.branchId,
                                            commitId: versionObj.commitId
                                        };
                                        return dvm.mm.getOntology(ontologyInfo);
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
                                    var ontologyInfo = dvm.mm.getSourceOntologyInfo(dvm.state.mapping.jsonld);
                                    versionObj.commitId = ontologyInfo.commitId;
                                    dvm.mm.getOntology(ontologyInfo).then(ontology => {
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
                        if (!_.isEqual(dvm.mm.getSourceOntologyInfo(dvm.state.mapping.jsonld), selectedOntologyInfo)) {
                            dvm.state.sourceOntologies = dvm.selectedOntologyState[dvm.selectedVersion].ontologies;
                            var incompatibleEntities = dvm.mm.findIncompatibleMappings(dvm.state.mapping.jsonld, dvm.state.sourceOntologies);
                            _.forEach(incompatibleEntities, entity => {
                                if (_.find(dvm.state.mapping.jsonld, {'@id': entity['@id']})) {
                                    if (dvm.mm.isPropertyMapping(entity)) {
                                        var parentClassMapping = dvm.mm.isDataMapping(entity) ? dvm.mm.findClassWithDataMapping(dvm.state.mapping.jsonld, entity['@id']) : dvm.mm.findClassWithObjectMapping(dvm.state.mapping.jsonld, entity['@id']);
                                        dvm.mm.removeProp(dvm.state.mapping.jsonld, parentClassMapping['@id'], entity['@id']);
                                        _.remove(dvm.state.invalidProps, {'@id': entity['@id']});
                                    } else if (dvm.mm.isClassMapping(entity)) {
                                        dvm.mm.removeClass(dvm.state.mapping.jsonld, entity['@id']);
                                        dvm.state.removeAvailableProps(entity['@id']);
                                    }
                                }
                            });
                            dvm.mm.setSourceOntologyInfo(dvm.state.mapping.jsonld, selectedOntologyInfo.recordId, selectedOntologyInfo.branchId, selectedOntologyInfo.commitId);
                            dvm.state.mapping.record = dvm.selectedRecord;
                            dvm.state.resetEdit();
                            var classMappings = dvm.mm.getAllClassMappings(dvm.state.mapping.jsonld);
                            _.forEach(classMappings, classMapping => dvm.state.setAvailableProps(classMapping['@id']));
                            dvm.state.availableClasses = _.filter(dvm.classes, clazz => !_.find(classMappings, classMapping => dvm.mm.getClassIdByMapping(classMapping) === clazz['@id']));
                            dvm.state.changedMapping = true;
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
                        dvm.errorMessage = '';
                    }
                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                    }

                    dvm.getRecords();
                },
                templateUrl: 'modules/mapper/directives/mappingConfigOverlay/mappingConfigOverlay.html'
            }
        }
})();
