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
         * @requires  ontologyManager.service:ontologyManagerService
         * @requires  mappingManager.service:mappingManagerService
         * @requires  mapperState.service:mapperStateService
         *
         * @description
         * `mappingConfigOverlay` is a directive that creates an overlay with functionality to edit the
         * configuration of the current {@link mapperState.service:mapperStateService#mapping mapping}.
         * The configuration consists of the source ontology and the base class. If editing a mapping that already
         * has those two set, a new mapping will be created with the new settings. The directive is replaced by
         * the contents of its template.
         */
        .directive('mappingConfigOverlay', mappingConfigOverlay);

        mappingConfigOverlay.$inject = ['$q', 'utilService', 'ontologyManagerService', 'mapperStateService', 'mappingManagerService', 'catalogManagerService'];

        function mappingConfigOverlay($q, utilService, ontologyManagerService, mapperStateService, mappingManagerService, catalogManagerService) {
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

                    dvm.ontologyRecords = [];
                    dvm.ontologies = {};
                    dvm.selectedOntologyInfo = undefined;
                    dvm.classes = [];
                    dvm.selectedBaseClass = undefined;
                    dvm.om.getAllOntologyRecords().then(response => {
                        dvm.ontologyRecords = _.map(response.data, record => {
                            return {title: dvm.util.getDctermsValue(record, 'title'), recordId: record['@id'], ontologyId: dvm.util.getDctermsValue(record, 'identifier')};
                        });
                        return $q.all(_.map(dvm.ontologyRecords, record => dvm.cm.getRecordMasterBranch(record.recordId, dvm.cm.localCatalog['@id'])));
                    }, error => $q.reject('Could not retrieve ontologies')).then(responses => {
                        _.forEach(responses, (branch, idx) => {
                            dvm.ontologyRecords[idx].branchId = branch['@id'];
                        });
                        return $q.all(_.map(dvm.ontologyRecords, record => dvm.cm.getBranchHeadCommit(record.branchId, record.recordId, dvm.cm.localCatalog['@id'])));
                    }, $q.reject).then(responses => {
                        _.forEach(responses, (commit, idx) => {
                            dvm.ontologyRecords[idx].commitId = commit.commit[0]['@graph'][0]['@id'];
                        });
                        if (dvm.state.sourceOntologies.length) {
                            var sourceOntologyInfo  = dvm.mm.getSourceOntologyInfo(dvm.state.mapping.jsonld);
                            var recordIndex = _.findIndex(dvm.ontologyRecords, {recordId: sourceOntologyInfo.recordId});
                            if (dvm.ontologyRecords[recordIndex].commitId !== sourceOntologyInfo.commitId) {
                                dvm.selectedOntologyInfo = _.assign(angular.copy(dvm.ontologyRecords[recordIndex]), sourceOntologyInfo);
                                dvm.ontologyRecords.splice(recordIndex, 0, dvm.selectedOntologyInfo);
                            } else {
                                dvm.selectedOntologyInfo = dvm.ontologyRecords[recordIndex];
                            }
                            var sourceOntology = dvm.mm.getSourceOntology(dvm.state.mapping.jsonld, dvm.state.sourceOntologies);
                            _.set(dvm.ontologies, encodeURIComponent(dvm.selectedOntologyInfo.commitId), dvm.state.sourceOntologies);
                            dvm.classes = getClasses(dvm.state.sourceOntologies);
                            var classId = dvm.mm.getClassIdByMapping(dvm.mm.getBaseClass(dvm.state.mapping.jsonld));
                            dvm.selectedBaseClass = _.get(_.find(dvm.classes, {classObj: {'@id': classId}}), 'classObj');
                        }
                    }, dvm.util.createErrorToast);

                    dvm.selectOntology = function(ontologyInfo) {
                        if (_.has(dvm.ontologies, encodeURIComponent(ontologyInfo.commitId))) {
                            dvm.selectedOntologyInfo = ontologyInfo;
                            dvm.classes = getClasses(dvm.getOntologyClosure(dvm.selectedOntologyInfo.commitId));
                            dvm.selectedBaseClass = undefined;
                        } else {
                            dvm.mm.getOntology(ontologyInfo).then(ontology => {
                                dvm.selectedOntologyInfo = ontologyInfo;
                                _.set(dvm.ontologies, encodeURIComponent(dvm.selectedOntologyInfo.commitId), [ontology]);
                                return dvm.om.getImportedOntologies(dvm.selectedOntologyInfo.ontologyId, dvm.selectedOntologyInfo.branchId, dvm.selectedOntologyInfo.commitId);
                            }, $q.reject).then(imported => {
                                _.forEach(imported, obj => {
                                    var ontology = {id: obj.id, entities: obj.ontology};
                                    dvm.getOntologyClosure(dvm.dvm.selectedOntologyInfo.commitId).push(ontology);
                                });
                                dvm.classes = getClasses(dvm.getOntologyClosure(dvm.selectedOntologyInfo.commitId));
                                dvm.selectedBaseClass = undefined;
                            }, onError);
                        }
                    }
                    dvm.getOntology = function(ontologyInfo) {
                        return _.find(dvm.getOntologyClosure(_.get(ontologyInfo, 'commitId')), {'id': _.get(ontologyInfo, 'ontologyId')});
                    }
                    dvm.getOntologyClosure = function(commitId) {
                        return _.get(dvm.ontologies, encodeURIComponent(commitId));
                    }
                    dvm.set = function() {
                        var selectedOntologyInfo = _.pick(dvm.selectedOntologyInfo, ['ontologyId', 'recordId', 'branchId', 'commitId']);
                        var originalSourceOntologyInfo = dvm.mm.getSourceOntologyInfo(dvm.state.mapping.jsonld);
                        if (!_.isEqual(originalSourceOntologyInfo, selectedOntologyInfo) || _.get(dvm.selectedBaseClass, '@id', '') !== dvm.mm.getClassIdByMapping(dvm.mm.getBaseClass(dvm.state.mapping.jsonld))) {
                            dvm.state.sourceOntologies = dvm.getOntologyClosure(dvm.selectedOntologyInfo.commitId);
                            var incompatibleEntities = dvm.mm.findIncompatibleMappings(dvm.state.mapping.jsonld, dvm.state.sourceOntologies);
                            _.forEach(incompatibleEntities, entity => {
                                if (dvm.mm.isPropertyMapping(entity)) {
                                    var parentClassMapping = dvm.mm.isDataMapping(entity) ? dvm.mm.findClassWithDataMapping(dvm.mm.mapping.jsonld, entity['@id']) : dvm.mm.findClassWithObjectMapping(dvm.mm.mapping.jsonld, entity['@id']);
                                    dvm.mm.removeProp(dvm.state.mapping.jsonld, parentClassMapping['@id'], entity['@id']);
                                    _.remove(dvm.state.invalidProps, {'@id': entity['@id']});
                                } else if (dvm.mm.isClassMapping(entity)) {
                                    dvm.mm.removeClass(dvm.state.mapping.jsonld, entity['@id']);
                                }
                            });
                            dvm.mm.setSourceOntologyInfo(dvm.state.mapping.jsonld, dvm.selectedOntologyInfo.ontologyId, dvm.selectedOntologyInfo.recordId, dvm.selectedOntologyInfo.branchId, dvm.selectedOntologyInfo.commitId);
                            var selectedBaseClassMapping = dvm.mm.getClassMappingsByClassId(dvm.state.mapping.jsonld, dvm.selectedBaseClass['@id']);
                            if (_.isEmpty(selectedBaseClassMapping)) {
                                var ontology = dvm.mm.findSourceOntologyWithClass(dvm.selectedBaseClass['@id'], dvm.state.sourceOntologies);
                                dvm.state.selectedClassMappingId = dvm.mm.addClass(dvm.state.mapping.jsonld, ontology.entities, dvm.selectedBaseClass['@id'])['@id'];
                            } else {
                                dvm.state.selectedClassMappingId = _.get(selectedBaseClassMapping, "[0]['@id']");
                            }
                            dvm.state.resetEdit();
                            dvm.state.setAvailableProps(dvm.state.selectedClassMappingId);
                        }

                        dvm.state.displayMappingConfigOverlay = false;
                    }
                    dvm.cancel = function() {
                        dvm.state.displayMappingConfigOverlay = false;
                    }
                    function getClasses(ontologies) {
                        var classes = [];
                        _.forEach(ontologies, ontology => {
                            classes = _.concat(classes, _.map(dvm.om.getClasses(ontology.entities), classObj => {
                                return {ontologyId: ontology.id, classObj};
                            }));
                        });
                        return classes;
                    }
                    function onError(errorMessage) {
                        dvm.errorMessage = errorMessage;
                    }
                },
                templateUrl: 'modules/mapper/directives/mappingConfigOverlay/mappingConfigOverlay.html'
            }
        }
})();
