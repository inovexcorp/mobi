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
        .module('ontologyState', [])
        .service('ontologyStateService', ontologyStateService);

        ontologyStateService.$inject = ['$rootScope', 'ontologyManagerService', 'updateRefsService'];

        function ontologyStateService($rootScope, ontologyManagerService, updateRefsService) {
            var self = this;
            self.states = [];
            self.newState = {active: true};
            self.om = ontologyManagerService;
            self.ontology = {};
            self.selected = {};

            self.afterSave = function(newId) {
                if (self.state.ontologyId !== newId) {
                    self.state.ontologyId = newId;
                    self.state.project.entityIRI = self.om.getOntologyIRI(self.ontology);
                }
                _.unset(self.state, 'deletedEntities');
            }

            self.setUnsaved = function(ontologyId, entityIRI, isUnsaved) {
                _.set(self.om.getEntityById(ontologyId, entityIRI), 'matonto.unsaved', isUnsaved);
            }

            self.getUnsaved = function(ontologyId, entityIRI) {
                return _.get(self.om.getEntityById(ontologyId, entityIRI), 'matonto.unsaved', false);
            }

            self.hasUnsavedEntities = function(ontology) {
                return _.some(ontology, {matonto:{unsaved: true}});
            }

            self.getUnsavedEntities = function(ontology) {
                return _.filter(ontology, {matonto:{unsaved: true}});
            }

            self.hasCreatedEntities = function(ontology) {
                return _.some(ontology, {matonto:{created: true}});
            }

            self.getCreatedEntities = function(ontology) {
                return _.filter(ontology, {matonto:{created: true}});
            }

            self.setValid = function(ontologyId, entityIRI, isValid) {
                _.set(self.om.getEntityById(ontologyId, entityIRI), 'matonto.valid', isValid);
            }

            self.getValid = function(ontologyId, entityIRI) {
                return _.get(self.om.getEntityById(ontologyId, entityIRI), 'matonto.valid', true);
            }

            self.hasInvalidEntities = function(ontology) {
                return _.some(ontology, {matonto:{valid: false}});
            }

            self.getOpenPath = function(ontologyId, entityIRI) {
                return encodeURIComponent(ontologyId) + '.' + encodeURIComponent(entityIRI);
            }

            self.setOpened = function(ontologyId, entityIRI, isOpened) {
                _.set(self.state, self.getOpenPath(ontologyId, entityIRI), isOpened);
            }

            self.getOpened = function(ontologyId, entityIRI) {
                return _.get(self.state, self.getOpenPath(ontologyId, entityIRI), false);
            }

            self.setNoDomainsOpened = function(ontologyId, isOpened) {
                _.set(self.state, encodeURIComponent(ontologyId) + '.noDomainsOpened', isOpened);
            }

            self.getNoDomainsOpened = function(ontologyId) {
                return _.get(self.state, encodeURIComponent(ontologyId) + '.noDomainsOpened', false);
            }

            self.getIndividualsOpened = function(ontologyId, classIRI) {
                return _.get(self.state, self.getOpenPath(ontologyId, classIRI) + '.individualsOpened', false);
            }

            self.setIndividualsOpened = function(ontologyId, classIRI, isOpened) {
                _.set(self.state, self.getOpenPath(ontologyId, classIRI) + '.individualsOpened', isOpened);
            }

            self.getNoTypeIndividualsOpened = function(ontologyId) {
                return _.get(self.state, encodeURIComponent(ontologyId) + '.noTypeIndividualsOpened', false);
            }

            self.setNoTypeIndividualsOpened = function(ontologyId, isOpened) {
                _.set(self.state, encodeURIComponent(ontologyId) + '.noTypeIndividualsOpened', isOpened);
            }

            self.getDataPropertiesOpened = function(ontologyId) {
                return _.get(self.state, encodeURIComponent(ontologyId) + '.dataPropertiesOpened', false);
            }

            self.setDataPropertiesOpened = function(ontologyId, isOpened) {
                _.set(self.state, encodeURIComponent(ontologyId) + '.dataPropertiesOpened', isOpened);
            }

            self.getObjectPropertiesOpened = function(ontologyId) {
                return _.get(self.state, encodeURIComponent(ontologyId) + '.objectPropertiesOpened', false);
            }

            self.setObjectPropertiesOpened = function(ontologyId, isOpened) {
                _.set(self.state, encodeURIComponent(ontologyId) + '.objectPropertiesOpened', isOpened);
            }

            self.onEdit = function(iriBegin, iriThen, iriEnd) {
                var newIRI = iriBegin + iriThen + iriEnd;
                updateRefsService.update(self.listItem, self.selected['@id'], newIRI);
                self.selected['@id'] = newIRI;
                self.setUnsaved(self.state.ontologyId, self.getActiveEntityIRI(), true);
            }
            self.setSelected = function(entityIRI) {
                self.selected = self.om.getEntityById(self.listItem.ontologyId, entityIRI);
            }
            self.addState = function(ontologyId, entityIRI, type) {
                var tabs = {};
                var newState = {
                    ontologyId: ontologyId,
                    active: false,
                    type: type
                }
                if (type === 'ontology') {
                    tabs = {
                        project: {
                            active: true,
                            entityIRI: entityIRI
                        },
                        overview: {
                            active: false
                        },
                        classes: {
                            active: false
                        },
                        properties: {
                            active: false
                        },
                        individuals: {
                            active: false
                        }
                    }
                } else if (type === 'vocabulary') {
                    tabs = {
                        project: {
                            active: true,
                            entityIRI: entityIRI
                        },
                        concepts: {
                            active: false
                        }
                    }
                }
                _.merge(newState, tabs);
                self.states.push(newState);
            }
            self.setState = function(ontologyId) {
                self.state.active = false;
                if (!ontologyId) {
                    self.state = self.newState;
                } else {
                    self.state = _.find(self.states, {ontologyId});
                    self.listItem = self.om.getListItemById(ontologyId);
                    setVariables(ontologyId, self.getActiveEntityIRI());
                }
                self.state.active = true;
            }
            self.getState = function(ontologyId) {
                if (!ontologyId) {
                    return self.newState;
                } else {
                    return _.find(self.states, {ontologyId});
                }
            }
            self.deleteState = function(ontologyId) {
                if (self.state.ontologyId === ontologyId) {
                    self.state = self.newState;
                    self.state.active = true;
                    self.selected = undefined;
                    self.ontology = undefined;
                }
                _.remove(self.states, {ontologyId});
            }
            self.getActiveKey = function() {
                return _.findKey(self.state, ['active', true], 'project');
            }
            self.getActivePage = function() {
                return self.state[self.getActiveKey()];
            }
            self.setActivePage = function(key) {
                if (_.has(self.state, key)) {
                    self.getActivePage().active = false;
                    self.state[key].active = true;
                }
            }
            self.getActiveEntityIRI = function() {
                return self.getActivePage().entityIRI;
            }
            self.selectItem = function(entityIRI) {
                if (entityIRI && entityIRI !== self.getActiveEntityIRI()) {
                    _.set(self.getActivePage(), 'entityIRI', entityIRI);
                    self.om.getEntityUsages(self.state.ontologyId, entityIRI)
                        .then(bindings => _.set(self.getActivePage(), 'usages', bindings),
                            response => _.set(self.getActivePage(), 'usages', []));
                }
                self.setSelected(entityIRI);
            }
            self.unSelectItem = function() {
                var activePage = self.getActivePage();
                _.unset(activePage, 'entityIRI');
                _.unset(activePage, 'usages');
                self.selected = undefined;
            }
            self.addDeletedEntity = function() {
                if (_.has(self.state, 'deletedEntities')) {
                    self.state.deletedEntities.push(angular.copy(self.selected));
                } else {
                    _.set(self.state, 'deletedEntities', [angular.copy(self.selected)]);
                }
            }
            self.hasChanges = function(ontology, ontologyId) {
                return self.hasUnsavedEntities(ontology) || self.hasCreatedEntities(ontology)
                    || _.get(self.getState(ontologyId), 'deletedEntities', []).length;
            }
            self.isSavable = function(ontology, ontologyId) {
                return self.hasChanges(ontology, ontologyId) && !self.hasInvalidEntities(ontology);
            }
            self.addEntityToHierarchy = function(hierarchy, entityIRI, indexObject, parentIRI) {
                var hierarchyItem = {entityIRI};
                var pathsToEntity = self.getPathsTo(indexObject, entityIRI);
                if (pathsToEntity.length) {
                    if (pathsToEntity[0].length > 1) {
                        var path = pathsToEntity[0];
                        hierarchyItem = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 0) {
                            hierarchyItem = _.find(hierarchyItem.subEntities, {entityIRI: path.shift()});
                        }
                    } else if (_.some(hierarchy, {entityIRI})) {
                        hierarchyItem = _.remove(hierarchy, hierarchyItem)[0];
                    }
                }
                if (parentIRI) {
                    _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent =>
                        parent.subEntities = _.union(_.get(parent, 'subEntities', []), [hierarchyItem]));
                } else {
                    hierarchy.push(hierarchyItem);
                }
                indexObject[entityIRI] = _.union(_.get(indexObject, entityIRI, []), [parentIRI]);
            }
            self.deleteEntityFromParentInHierarchy = function(hierarchy, entityIRI, parentIRI, indexObject) {
                var deletedEntity;
                _.forEach(getEntities(hierarchy, parentIRI, indexObject), parent => {
                    if (_.has(parent, 'subEntities')) {
                        deletedEntity = _.remove(parent.subEntities, {entityIRI})[0];
                        if (!parent.subEntities.length) {
                            _.unset(parent, 'subEntities');
                        }
                    }
                });
                if (_.has(indexObject, entityIRI)) {
                    _.remove(indexObject[entityIRI], item => item === parentIRI);
                    if (!indexObject[entityIRI].length) {
                        _.unset(indexObject, entityIRI);
                        hierarchy.push(deletedEntity);
                    }
                }
            }
            self.deleteEntityFromHierarchy = function(hierarchy, entityIRI, indexObject) {
                var deletedEntity;
                var paths = self.getPathsTo(indexObject, entityIRI);
                _.forEach(paths, path => {
                    if (path.length === 1) {
                        deletedEntity = _.remove(hierarchy, {entityIRI: path.shift()})[0];
                    } else if (path.length > 1) {
                        var current = _.find(hierarchy, {entityIRI: path.shift()});
                        while (path.length > 1) {
                            current = _.find(current.subEntities, {entityIRI: path.shift()});
                        }
                        deletedEntity = _.remove(current.subEntities, {entityIRI: path.shift()})[0];
                        if (!current.subEntities.length) {
                            _.unset(current, 'subEntities');
                        }
                    }
                });
                _.unset(indexObject, entityIRI);
                updateRefsService.remove(indexObject, entityIRI);
                _.forEach(_.get(deletedEntity, 'subEntities', []), hierarchyItem => {
                    var paths = self.getPathsTo(indexObject, hierarchyItem.entityIRI);
                    if (paths.length === 1 && paths[0].length === 1) {
                        hierarchy.push(hierarchyItem);
                        _.unset(indexObject, hierarchyItem.entityIRI);
                    }
                });
            }
            function getEntities(hierarchy, entityIRI, indexObject) {
                var results = [];
                var pathsToEntity = self.getPathsTo(indexObject, entityIRI);
                _.forEach(pathsToEntity, path => {
                    var entity = _.find(hierarchy, {entityIRI: path.shift()});
                    while (path.length > 0) {
                        entity = _.find(entity.subEntities, {entityIRI: path.shift()});
                    }
                    results.push(entity);
                });
                return results;
            }
            self.getPathsTo = function(indexObject, entityIRI) {
                var result = [];
                if (_.has(indexObject, entityIRI)) {
                    _.forEach(indexObject[entityIRI], parentIRI => {
                        var paths = self.getPathsTo(indexObject, parentIRI);
                        _.forEach(paths, path => {
                            path.push(entityIRI);
                            result.push(path);
                        });
                    });
                } else {
                    result.push([entityIRI]);
                }
                return result;
            }
            function setVariables(ontologyId, entityIRI) {
                self.ontology = self.om.getOntologyById(ontologyId);
                self.setSelected(entityIRI);
            }
            self.goTo = function(iri) {
                var entity = self.om.getEntityById(self.listItem.ontologyId, iri);
                if (self.listItem.type === 'vocabulary') {
                    commonGoTo('concepts', iri);
                } else if (self.om.isClass(entity)) {
                    commonGoTo('classes', iri);
                } else if (self.om.isProperty(entity)) {
                    commonGoTo('properties', iri);
                } else if (self.om.isIndividual(entity)) {
                    commonGoTo('individuals', iri);
                }
            }
            function commonGoTo(key, iri) {
                self.setActivePage(key);
                self.selectItem(iri);
            }
            function initialize() {
                self.state = self.newState;
            }
            initialize();
        }
})();