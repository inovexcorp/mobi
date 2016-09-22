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
        .module('stateManager', [])
        .service('stateManagerService', stateManagerService);

        stateManagerService.$inject = ['$rootScope', 'ontologyManagerService', 'updateRefsService'];

        function stateManagerService($rootScope, ontologyManagerService, updateRefsService) {
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

            self.setUnsaved = function(ontology, entityIRI, isUnsaved) {
                _.set(self.om.getEntity(ontology, entityIRI), 'matonto.unsaved', isUnsaved);
            }

            self.getUnsaved = function(ontology, entityIRI) {
                return _.get(self.om.getEntity(ontology, entityIRI), 'matonto.unsaved', false);
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

            self.setValid = function(ontology, entityIRI, isValid) {
                _.set(self.om.getEntity(ontology, entityIRI), 'matonto.valid', isValid);
            }

            self.getValid = function(ontology, entityIRI) {
                return _.get(self.om.getEntity(ontology, entityIRI), 'matonto.valid', true);
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
                self.setUnsaved(self.ontology, self.getActiveEntityIRI(), true);
            }
            self.setSelected = function(entityIRI) {
                self.selected = self.om.getEntity(self.ontology, entityIRI);
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
                        schemes: {
                            active: false
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
                    setVariables(ontologyId, self.getActiveEntityIRI());
                    self.listItem = self.om.getListItemById(ontologyId);
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
                return _.findKey(self.state, ['active', true]);
            }
            self.getActivePage = function() {
                return self.state[self.getActiveKey()];
            }
            self.getActiveEntityIRI = function() {
                return self.getActivePage().entityIRI;
            }
            self.selectItem = function(entityIRI) {
                if (entityIRI && entityIRI !== self.getActiveEntityIRI()) {
                    _.set(self.getActivePage(), 'entityIRI', entityIRI);
                    self.setSelected(entityIRI);
                    self.om.getEntityUsages(self.state.ontologyId, entityIRI)
                        .then(bindings => _.set(self.getActivePage(), 'usages', bindings),
                            response => _.set(self.getActivePage(), 'usages', []));
                } else if (!entityIRI) {
                    self.selected = undefined;
                }
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
            function initialize() {
                self.state = self.newState;
            }
            initialize();
        }
})();