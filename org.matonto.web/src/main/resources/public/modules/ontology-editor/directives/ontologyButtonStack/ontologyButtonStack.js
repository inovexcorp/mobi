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
        .module('ontologyButtonStack', [])
        .directive('ontologyButtonStack', ontologyButtonStack);

        ontologyButtonStack.$inject = ['$q', '$filter', '$http', 'ontologyStateService', 'ontologyManagerService',
            'catalogManagerService', 'utilService', 'updateRefsService'];

        function ontologyButtonStack($q, $filter, $http, ontologyStateService, ontologyManagerService,
            catalogManagerService, utilService, updateRefsService) {
            return {
                restrict: 'E',
                replace: true,
                templateUrl: 'modules/ontology-editor/directives/ontologyButtonStack/ontologyButtonStack.html',
                scope: {},
                controllerAs: 'dvm',
                controller: function() {
                    var dvm = this;
                    var om = ontologyManagerService;
                    var cm = catalogManagerService;
                    var util = utilService;
                    var update = updateRefsService;
                    var catalogId = _.get(cm.localCatalog, '@id', '');

                    dvm.os = ontologyStateService;
                    dvm.showDeleteOverlay = false;
                    dvm.error = '';

                    dvm.delete = function() {
                        cm.deleteInProgressCommit(dvm.os.listItem.recordId, catalogId)
                            .then(() => {
                                /*var ontology = om.getOntologyByRecordId(dvm.os.listItem.recordId);
                                _.forEach(dvm.os.listItem.inProgressCommit.additions, statements => {
                                    var entityIRI = statements['@id'];
                                    var entity = om.getEntity(ontology, entityIRI);
                                    if (_.isEqual(statements, $filter('removeMatonto')(entity))) {
                                        om.removeEntity(ontology, entityIRI);
                                        dvm.os.unsetEntityByIRI(entityIRI);
                                        if (dvm.os.state.type === 'vocabulary') {
                                            dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.conceptHierarchy,
                                                entityIRI, dvm.os.listItem.conceptIndex);
                                        } else if (om.isClass(entity)) {
                                            dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.classHierarchy,
                                                entityIRI, dvm.os.listItem.classIndex);
                                        } else if (om.isDataTypeProperty(entity)) {
                                            dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.dataPropertyHierarchy,
                                                entityIRI, dvm.os.listItem.dataPropertyIndex);
                                        } else if (om.isObjectProperty(entity)) {
                                            dvm.os.deleteEntityFromHierarchy(dvm.os.listItem.objectPropertyHierarchy,
                                                entityIRI, dvm.os.listItem.objectPropertyIndex);
                                        }
                                    } else {
                                        _.unset(statements, '@id');
                                        _.forOwn(statements, (value, key) => update.remove(entity[key], value));
                                    }
                                });
                                _.forEach(dvm.os.listItem.inProgressCommit.deletions, statements => {
                                    var entity = om.getEntity(ontology, statements['@id']);
                                    if (_.isEmpty(entity)) {
                                        om.addEntity(ontology, statements);
                                    } else {
                                        _.mergeWith(entity, statements, util.mergingArrays);
                                    }
                                });*/
                                var config = {
                                    params: {
                                        branchId: dvm.os.listItem.branchId,
                                        commitId: dvm.os.listItem.commitId
                                    }
                                }
                                var onSuccess = function() {
                                    dvm.os.clearInProgressCommit();
                                    dvm.showDeleteOverlay = false;
                                }
                                var listItem = om.getListItemByRecordId(dvm.os.listItem.recordId);
                                if (dvm.os.state.type === 'ontology') {
                                    $q.all([
                                        om.getOntology(dvm.os.listItem.ontologyId, dvm.os.listItem.recordId)
                                            .then(response => {
                                                listItem.ontology = response.ontology;
                                            }),
                                        om.getClassHierarchies(dvm.os.listItem.ontologyId, dvm.os.listItem.branchId,
                                            dvm.os.listItem.commitId).then(response => {
                                                listItem.classHierarchy = response.data.hierarchy;
                                                listItem.classIndex = response.data.index;
                                            }),
                                        om.getDataPropertyHierarchies(dvm.os.listItem.ontologyId,
                                            dvm.os.listItem.branchId, dvm.os.listItem.commitId).then(response => {
                                                listItem.dataPropertyHierarchy = response.data.hierarchy;
                                                listItem.dataPropertyIndex = response.data.index;
                                            }),
                                        om.getObjectPropertyHierarchies(dvm.os.listItem.ontologyId,
                                            dvm.os.listItem.branchId, dvm.os.listItem.commitId).then(response => {
                                                listItem.objectPropertyHierarchy = response.data.hierarchy;
                                                listItem.objectPropertyIndex = response.data.index;
                                            })
                                    ]).then(onSuccess);
                                } else if (dvm.os.state.type === 'vocabulary') {
                                    $q.all([
                                        om.getOntology(dvm.os.listItem.ontologyId, dvm.os.listItem.recordId)
                                            .then(response => {
                                                listItem.ontology = response.ontology;
                                            }),
                                        om.getConceptHierarchies(dvm.os.listItem.ontologyId, dvm.os.listItem.branchId,
                                            dvm.os.listItem.commitId).then(response => {
                                                listItem.conceptHierarchy = response.data.hierarchy;
                                                listItem.conceptIndex = response.data.index;
                                            })
                                    ]).then(onSuccess);
                                }
                            }, errorMessage => dvm.error = errorMessage);
                    }
                }
            }
        }
})();
