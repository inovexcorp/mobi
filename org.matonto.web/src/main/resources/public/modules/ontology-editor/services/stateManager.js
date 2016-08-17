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

        stateManagerService.$inject = ['ontologyManagerService', 'updateRefsService'];

        function stateManagerService(ontologyManagerService, updateRefsService) {
            var self = this;

            self.states = {
                current: 'everything',
                everything: {
                    tab: 'everything',
                    editor: 'default-tab',
                    editorTab: 'basic'
                },
                class: {
                    tab: 'class',
                    editor: 'default-tab',
                    editorTab: 'basic'
                },
                object: {
                    tab: 'object',
                    editor: 'default-tab',
                    editorTab: 'basic'
                },
                datatype: {
                    tab: 'datatype',
                    editor: 'default-tab',
                    editorTab: 'basic'
                },
                annotation: {
                    tab: 'annotation',
                    editor: 'default-tab',
                    editorTab: 'basic'
                },
                individual: {
                    tab: 'individual',
                    editor: 'default-tab',
                    editorTab: 'basic'
                }
            }

            self.om = ontologyManagerService;
            self.ontology = {};
            self.selected = {};
            self.ontologyIds = self.om.ontologyIds;
            self.state = self.states[self.states.current];


            function setVariables(ontologyId, entityIRI) {
                self.ontology = self.om.getOntologyById(ontologyId);
                self.selected = self.om.getEntity(self.ontology, entityIRI);
            }

            self.setTreeTab = function(tab) {
                self.states.current = tab;
                self.state = self.getState();
                setVariables(self.state.ontologyId, self.state.entityIRI);
            }

            self.setEditorTab = function(tab) {
                self.state.editorTab = tab;
            }

            self.getEditorTab = function() {
                return self.states[self.states.current].editorTab;
            }

            self.afterSave = function(newId) {
                if (!_.isEqual(self.state.ontologyId, newId)) {
                    self.state.ontologyId = newId;
                }
                self.state.entityIRI = self.selected.matonto.originalIRI;
            }

            self.setState = function(editor, entityIRI, listItem) {
                if (editor !== self.state.editor) {
                    self.state.editorTab = 'basic';
                }
                self.state.editor = editor;
                self.state.entityIRI = entityIRI;
                _.assign(self.state, listItem);
            }

            self.getState = function() {
                return self.states[self.states.current];
            }

            self.clearState = function(ontologyId) {
                _.forOwn(self.states, prop => {
                    if (_.isEqual(_.get(self.states, '[' + prop + '].ontologyId'), ontologyId)) {
                        self.state = self.states[prop];
                        self.state.ontologyId = self.state.entityIRI = undefined;
                        self.state.editor = 'default-tab';
                    }
                });
                self.selected = undefined;
                self.ontology = undefined;
                _.unset(self.state, encodeURIComponent(ontologyId));
            }

            self.selectItem = function(editor, entityIRI, listItem) {
                self.setState(editor, entityIRI, listItem);
                setVariables(listItem.ontologyId, entityIRI);
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
                var encodedIRI = '';
                var entity = self.om.getEntity(self.om.getOntologyById(ontologyId), entityIRI);
                if (_.has(entity, 'matonto.originalIRI')) {
                    encodedIRI = encodeURIComponent(entity.matonto.originalIRI);
                } else {
                    encodedIRI = encodeURIComponent(_.get(entity, 'matonto.anonymous', ontologyId));
                }
                return encodeURIComponent(ontologyId) + '.' + encodedIRI;
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
                return _.get(self.state, encodeURIComponent(ontologyId) + '.' + encodeURIComponent(classIRI) + '.individualsOpened', false);
            }

            self.setIndividualsOpened = function(ontologyId, classIRI, isOpened) {
                _.set(self.state, encodeURIComponent(ontologyId) + '.' + encodeURIComponent(classIRI) + '.individualsOpened', isOpened);
            }

            self.onEdit = function(iriBegin, iriThen, iriEnd) {
                var newIRI = iriBegin + iriThen + iriEnd;
                updateRefsService.update(self.ontology, self.selected['@id'], newIRI);
                self.selected['@id'] = newIRI;
                self.setUnsaved(self.ontology, self.state.entityIRI, true);
            }
        }
})();