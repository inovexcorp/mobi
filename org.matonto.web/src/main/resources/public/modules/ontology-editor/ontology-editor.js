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
        .module('ontology-editor', ['file-input', 'staticIri', 'annotationTab', 'annotationOverlay', 'annotationTree',
        'ontologyUploadOverlay', 'ontologyDownloadOverlay', 'tabButton', 'treeItem', 'everythingTree', 'classTree',
        'propertyTree', 'ontologyEditor', 'classEditor', 'propertyEditor', 'removeIriFromArray', 'ontologyManager',
        'stateManager', 'prefixManager', 'annotationManager', 'responseObj', 'serializationSelect',
        'ontologyOpenOverlay', 'ngMessages', 'errorDisplay', 'createAnnotationOverlay', 'createOntologyOverlay',
        'createClassOverlay', 'createPropertyOverlay', 'defaultTab', 'tabButtonContainer'])
        .controller('OntologyEditorController', OntologyEditorController);

    OntologyEditorController.$inject = ['ontologyManagerService', 'stateManagerService', 'prefixManagerService', 'annotationManagerService', 'responseObj', 'prefixes'];

    function OntologyEditorController(ontologyManagerService, stateManagerService, prefixManagerService, annotationManagerService, responseObj, prefixes) {
        var vm = this;

        vm.sm = stateManagerService;
        vm.ontologies = ontologyManagerService.getList();
        vm.ontologyIds = ontologyManagerService.getOntologyIds();
        vm.propertyTypes = ontologyManagerService.getPropertyTypes();
        vm.selected = ontologyManagerService.getObject(vm.sm.currentState);
        vm.sm.selected = vm.selected;
        vm.rdfs = prefixes.rdfs;
        vm.owl = prefixes.owl;

        function initialize() {
            if(vm.sm.currentState) {
                setVariables(vm.sm.currentState.oi);
            }
        }
        
        /* State Management */
        vm.setTreeTab = function(tab) {
            stateManagerService.setTreeTab(tab);
            if(tab !== 'annotation') {
                vm.selected = ontologyManagerService.getObject(vm.sm.currentState);
                vm.sm.selected = vm.selected;
            } else {
                vm.selected = _.get(vm.ontologies, '[' + vm.sm.currentState.oi + '].matonto.jsAnnotations[' + vm.sm.currentState.pi + ']');
                vm.sm.selected = vm.selected;
            }
            vm.ontology = ontologyManagerService.getOntology(vm.sm.currentState.oi);
            vm.sm.ontology = vm.ontology;
            vm.serialization = '';
        }

        vm.setEditorTab = function(tab) {
            stateManagerService.setEditorTab(tab);
        }

        /* Ontology Management */
        function setVariables(oi) {
            if(oi === undefined) {
                vm.selected = vm.ontology = undefined;
                vm.sm.selected = vm.selected;
                vm.sm.ontology = vm.ontology;
            } else {
                vm.selected = ontologyManagerService.getObject(vm.sm.currentState);
                vm.sm.selected = vm.selected;
                vm.ontology = ontologyManagerService.getOntology(oi);
                vm.sm.ontology = vm.ontology;
            }
            vm.preview = 'Please select a serialization and hit refresh.';
            vm.serialization = '';
        }

        vm.prettyPrint = function(entity) {
            return ontologyManagerService.getEntityName(entity);
        }

        vm.setValidity = function(isValid) {
            vm.ontology.matonto.isValid = isValid;
        }

        vm.uploadOntology = function(file, namespace, localName) {
            vm.uploadError = false;
            ontologyManagerService.uploadThenGet(file)
                .then(function(response) {
                    stateManagerService.setTreeTab('everything');
                    vm.selectItem('ontology-editor', vm.ontologies.length - 1);
                    vm.showUploadOverlay = false;
                }, function(response) {
                    vm.uploadError = response.statusText;
                });
        }

        vm.deleteEntity = function() {
            ontologyManagerService.delete(vm.ontology.matonto.originalId, vm.selected.matonto.originalId, vm.sm.currentState)
                .then(function(response) {
                    vm.showDeleteConfirmation = false;
                    if(response.selectOntology) {
                        stateManagerService.setTreeTab('everything');
                        vm.selectItem('ontology-editor', vm.sm.currentState.oi);
                    } else {
                        stateManagerService.clearState(vm.sm.currentState.oi);
                    }
                });
        }

        vm.selectItem = function(editor, oi, ci, pi) {
            stateManagerService.setState(editor, oi, ci, pi);
            setVariables(oi);
        }

        vm.selectAnnotation = function(oi, index) {
            stateManagerService.setState('annotation-display', oi, undefined, index);
            vm.ontology = ontologyManagerService.getOntology(oi);
            vm.sm.ontology = vm.ontology;
            vm.selected = vm.ontology.matonto.jsAnnotations[index];
            vm.sm.selected = vm.selected;
        }

        vm.disableSave = function() {
            return !_.get(vm.ontology, 'matonto.isValid', false) || !ontologyManagerService.getChangedListForOntology(_.get(vm.ontology, 'matonto.originalId')).length;
        }

        vm.save = function() {
            ontologyManagerService.edit(vm.ontology.matonto.originalId, vm.sm.currentState)
                .then(function(state) {
                    vm.showSaveOverlay = false;
                    vm.sm.currentState = state;
                });
        }

        vm.editIRI = function(iriBegin, iriThen, iriEnd) {
            vm.entityChanged();
            ontologyManagerService.editIRI(iriBegin, iriThen, iriEnd, vm.selected, vm.ontologies[vm.sm.currentState.oi]);
            vm.showIriOverlay = false;
        }

        vm.isObjectProperty = function() {
            return ontologyManagerService.isObjectProperty(vm.selected['@type']);
        }

        vm.entityChanged = function() {
            vm.selected.matonto.unsaved = true;
            ontologyManagerService.addToChangedList(vm.ontology.matonto.originalId, vm.selected.matonto.originalId, vm.sm.currentState);
        }

        vm.getPreview = function() {
            ontologyManagerService.getPreview(vm.ontology['@id'], vm.serialization)
                .then(function(response) {
                    vm.preview = response;
                }, function(response) {
                    vm.preview = response;
                });
        }

        vm.downloadOntology = function() {
            ontologyManagerService.download(vm.ontology['@id'], vm.downloadSerialization, vm.downloadFileName);
            vm.showDownloadOverlay = false;
            vm.downloadSerialization = '';
            vm.downloadFileName = '';
        }

        /* Prefix (Context) Management */
        vm.editPrefix = function(edit, old, index) {
            prefixManagerService.editPrefix(edit, old, index, vm.selected);
            vm.entityChanged();
        }

        vm.editValue = function(edit, key, value, index) {
            prefixManagerService.editValue(edit, key, value, index, vm.selected);
            vm.entityChanged();
        }

        vm.addPrefix = function(key, value) {
            prefixManagerService.add(key, value, vm.selected)
                .then(function(response) {
                    setVariables(vm.sm.currentState.oi);
                    vm.key = '';
                    vm.value = '';
                    vm.entityChanged();
                }, function(response) {
                    vm.showDuplicateMessage = true;
                });
        }

        vm.removePrefix = function(key) {
            prefixManagerService.remove(key, vm.selected);
            vm.entityChanged();
        }

        vm.getItemIri = function(item) {
            return responseObj.getItemIri(item);
        }

        vm.openOntology = function() {
            ontologyManagerService.openOntology(vm.ontologyIdToOpen)
                .then(function(response) {
                    stateManagerService.setTreeTab('everything');
                    vm.selectItem('ontology-editor', vm.ontologies.length - 1);
                    vm.showOpenOverlay = false;
                    vm.openError = '';
                    vm.ontologyIdToOpen = undefined;
                }, function(errorMessage) {
                    vm.openError = errorMessage;
                });
        }

        vm.closeOntology = function() {
            ontologyManagerService.closeOntology(vm.sm.currentState.oi, vm.ontology['@id']);
            stateManagerService.clearState(vm.sm.currentState.oi);
            vm.selected = {};
            vm.sm.selected = vm.selected;
            vm.ontology = {};
            vm.sm.ontology = vm.ontology;
            vm.showCloseOverlay = false;
        }

        vm.isThisType = function(property, propertyType) {
            var lowerCasePropertyTypeIRI = (prefixes.owl + propertyType).toLowerCase();
            return _.findIndex(_.get(property, '@type', []), function(type) {
                return type.toLowerCase() === lowerCasePropertyTypeIRI;
            }) !== -1;
        }

        /* Annotation Management */
        vm.removeAnnotation = function() {
            annotationManagerService.remove(vm.selected, vm.key, vm.index);
            vm.entityChanged();
            vm.showRemoveAnnotationOverlay = false;
        }

        vm.getItemNamespace = function(item) {
            return ontologyManagerService.getItemNamespace(item);
        }

        vm.createAnnotation = function(iri) {
            annotationManagerService.create(vm.ontology, vm.createAnnotationIri)
                .then(function(response) {
                    vm.createAnnotationError = '';
                    vm.createAnnotationIri = '';
                    vm.showCreateAnnotationOverlay = false;

                }, function(errorMessage) {
                    vm.createAnnotationError = errorMessage;
                });
        }

        initialize();
    }
})();
