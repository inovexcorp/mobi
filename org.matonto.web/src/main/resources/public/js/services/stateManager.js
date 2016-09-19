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
            self.newState = {
                tab: 'open',
                active: true,
                open: {
                    active: true
                },
                create: {
                    active: false
                },
                upload: {
                    active: false
                }
            }
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
            self.addState = function(ontologyId, entityIRI, tab) {
                var newState = {
                    ontologyId: ontologyId,
                    active: false,
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
            self.deleteEntityFromHierarchy = function(hierarchy, entityIRI) {
                var deletedEntity;
                function removeHierarchyItem(hierarchy) {
                    _.forEach(hierarchy, hierarchyItem => {
                        _.remove(hierarchy, hierarchyItem => {
                            if (hierarchyItem.entityIRI === entityIRI) {
                                deletedEntity = angular.copy(hierarchyItem);
                                return true;
                            }
                        });
                        if (_.has(hierarchyItem, 'subEntities')) {
                            removeHierarchyItem(hierarchyItem.subEntities);
                        }
                    });
                }
                removeHierarchyItem(hierarchy);
            }
            self.getPathsTo = function(index, entityIRI) {
                var paths = [];
                if (_.has(index, entityIRI)) {
                    _.forEach(index[entityIRI], parentIRI => {
                        paths.push(getPathTo(index, parentIRI) + '.' + entityIRI);
                    });
                }
                return paths;
            }
            /*function updatePath(path, parentIRI) {
                if (path) {
                    return {
                        entityIRI: parentIRI,
                        subEntities: [path]
                    }
                } else {
                    return {
                        entityIRI: parentIRI
                    }
                }
            }
            function getPathTo(index, entityIRI, path) {
                if (_.has(index, entityIRI)) {
                    return getPathTo(index, index[entityIRI][0], updatePath(path, entityIRI));
                } else {
                    return updatePath(path, entityIRI);
                }
            }
            self.getPathsTo = function(index, entityIRI) {
                var paths = [];
                if (_.has(index, entityIRI)) {
                    _.forEach(index[entityIRI], parentIRI => {
                        paths.push(getPathTo(index, parentIRI, {entityIRI}));
                    });
                }
                return paths;
            }*/
            function updatePath(path, parentIRI) {
                return path ? parentIRI + '.' + path : parentIRI;
            }
            function getPathTo(index, entityIRI, path) {
                if (_.has(index, entityIRI)) {
                    return getPathTo(index, index[entityIRI][0], updatePath(path, entityIRI));
                } else {
                    return updatePath(path, entityIRI);
                }
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