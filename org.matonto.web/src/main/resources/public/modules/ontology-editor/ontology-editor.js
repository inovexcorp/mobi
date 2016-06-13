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
        'stateManager', 'prefixManager', 'annotationManager', 'responseObj', 'leftNavItem', 'serializationSelect',
        'ontologyOpenOverlay', 'ngMessages', 'errorDisplay', 'createAnnotationOverlay', 'createOntologyOverlay',
        'createClassOverlay', 'createPropertyOverlay', 'defaultTab', 'tabButtonContainer'])
        .controller('OntologyEditorController', OntologyEditorController);

    OntologyEditorController.$inject = ['ontologyManagerService', 'stateManagerService', 'prefixManagerService', 'annotationManagerService', 'responseObj', 'prefixes'];

    function OntologyEditorController(ontologyManagerService, stateManagerService, prefixManagerService, annotationManagerService, responseObj, prefixes) {
        var vm = this;

        vm.ontologies = ontologyManagerService.getList();
        vm.ontologyIds = ontologyManagerService.getOntologyIds();
        vm.propertyTypes = ontologyManagerService.getPropertyTypes();
        vm.state = stateManagerService.getState();
        vm.selected = ontologyManagerService.getObject(vm.state);
        vm.rdfs = prefixes.rdfs;
        vm.owl = prefixes.owl;

        function initialize() {
            if(vm.state) {
                setVariables(vm.state.oi);
            }
        }

        /* State Management */
        vm.setTreeTab = function(tab) {
            stateManagerService.setTreeTab(tab);
            vm.state = stateManagerService.getState();
            if(tab !== 'annotation') {
                vm.selected = ontologyManagerService.getObject(vm.state);
            } else {
                vm.selected = _.get(vm.ontologies, '[' + vm.state.oi + '].matonto.jsAnnotations[' + vm.state.pi + ']');
            }
            vm.serialization = '';
        }

        vm.setEditorTab = function(tab) {
            stateManagerService.setEditorTab(tab);
            vm.state = stateManagerService.getState();
        }

        /* Ontology Management */
        function setVariables(oi) {
            if(oi === undefined) {
                vm.selected = vm.ontology = undefined;
            } else {
                vm.selected = ontologyManagerService.getObject(vm.state);
                vm.ontology = ontologyManagerService.getOntology(oi);
            }
            vm.preview = 'Please select a serialization and hit refresh.';
            vm.serialization = '';
        }

        function onCreateSuccess(type) {
            var oi = stateManagerService.setStateToNew(vm.state, vm.ontologies, type);
            vm.state = stateManagerService.getState();
            setVariables(oi);
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
            ontologyManagerService.delete(vm.ontology.matonto.originalId, vm.selected.matonto.originalId, vm.state)
                .then(function(response) {
                    vm.showDeleteConfirmation = false;
                    if(response.selectOntology) {
                        stateManagerService.setTreeTab('everything');
                        vm.selectItem('ontology-editor', vm.state.oi);
                    } else {
                        vm.selectItem('default');
                    }
                });
        }

        vm.selectItem = function(editor, oi, ci, pi) {
            stateManagerService.setState(editor, oi, ci, pi);
            vm.state = stateManagerService.getState();
            setVariables(oi);
        }

        vm.selectAnnotation = function(oi, index) {
            stateManagerService.setState('annotation-display', oi, undefined, index);
            vm.state = stateManagerService.getState();
            vm.ontology = ontologyManagerService.getOntology(oi);
            vm.selected = vm.ontology.matonto.jsAnnotations[index];
        }

        vm.disableSave = function() {
            return !_.get(vm.ontology, 'matonto.isValid', false) || !ontologyManagerService.getChangedListForOntology(_.get(vm.ontology, 'matonto.originalId')).length;
        }

        vm.save = function() {
            ontologyManagerService.edit(vm.ontology.matonto.originalId, vm.state)
                .then(function(state) {
                    vm.showSaveOverlay = false;
                    vm.state = state;
                });
        }

        vm.editIRI = function(iriBegin, iriThen, iriEnd) {
            vm.entityChanged();
            ontologyManagerService.editIRI(iriBegin, iriThen, iriEnd, vm.selected, vm.ontologies[vm.state.oi]);
            vm.showIriOverlay = false;
        }

        vm.isObjectProperty = function() {
            return ontologyManagerService.isObjectProperty(vm.selected['@type']);
        }

        vm.entityChanged = function() {
            vm.selected.matonto.unsaved = true;
            ontologyManagerService.addToChangedList(vm.ontology.matonto.originalId, vm.selected.matonto.originalId, vm.state);
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

        vm.openDownloadOverlay = function() {
            vm.downloadFileName = ontologyManagerService.getBeautifulIRI(angular.copy(vm.ontology['@id'])).replace(' ', '_');
            vm.downloadSerialization = '';
            vm.showDownloadOverlay = true;
        }

        vm.createOntology = function(ontologyIri, label, description) {
            ontologyManagerService.createOntology(ontologyIri, label, description)
                .then(function(response) {
                    vm.createOntologyError = '';
                    vm.showCreateOntologyOverlay = false;
                    onCreateSuccess('ontology');
                }, function(errorMessage) {
                    vm.createOntologyError = errorMessage;
                });
        }

        vm.createClass = function(classIri, label, description) {
            ontologyManagerService.createClass(vm.ontology, classIri, label, description)
                .then(function(response) {
                    vm.createClassError = '';
                    vm.showCreateClassOverlay = false;
                    onCreateSuccess('class');
                }, function(errorMessage) {
                    vm.createClassError = errorMessage;
                });
        }

        vm.createProperty = function(propertyIri, label, type, range, domain, description) {
            ontologyManagerService.createProperty(vm.ontology, propertyIri, label, type, range, domain, description)
                .then(function(classIndex) {
                    vm.state.ci = classIndex;
                    vm.createPropertyError = '';
                    vm.showCreatePropertyOverlay = false;
                    onCreateSuccess('property');
                }, function(errorMessage) {
                    vm.createPropertyError = errorMessage;
                });
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
                    setVariables(vm.state.oi);
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
            ontologyManagerService.closeOntology(vm.state.oi, vm.ontology['@id']);
            stateManagerService.clearState(vm.state.oi);
            vm.selected = {};
            vm.ontology = {};
            vm.showCloseOverlay = false;
        }

        vm.isThisType = function(property, propertyType) {
            var lowerCasePropertyTypeIRI = (prefixes.owl + propertyType).toLowerCase();
            return _.findIndex(_.get(property, '@type', []), function(type) {
                return type.toLowerCase() === lowerCasePropertyTypeIRI;
            }) !== -1;
        }

        /* Annotation Management */
        function resetAnnotationVariables() {
            vm.annotationSelect = undefined;
            vm.annotationValue = '';
            vm.annotationIndex = 0;
        }

        vm.addAnnotation = function(select, value) {
            annotationManagerService.add(vm.selected, vm.getItemIri(select), value);
            resetAnnotationVariables();
            vm.showAnnotationOverlay = false;
            vm.entityChanged();
        }

        vm.editClicked = function(annotation, index) {
            vm.editingAnnotation = true;
            vm.annotationSelect = annotation;
            vm.annotationValue = vm.selected[vm.getItemIri(annotation)][index]['@value'];
            vm.annotationIndex = index;
            vm.showAnnotationOverlay = true;
        }

        vm.editAnnotation = function(select, value) {
            annotationManagerService.edit(vm.selected, vm.getItemIri(select), value, vm.annotationIndex);
            resetAnnotationVariables();
            vm.showAnnotationOverlay = false;
            vm.entityChanged();
        }

        vm.openRemoveAnnotationOverlay = function(key, index) {
            vm.key = key;
            vm.index = index;
            vm.showRemoveAnnotationOverlay = true;
        }

        vm.removeAnnotation = function() {
            annotationManagerService.remove(vm.selected, vm.key, vm.index);
            vm.entityChanged();
            vm.showRemoveAnnotationOverlay = false;
        }

        vm.getItemNamespace = function(item) {
            return ontologyManagerService.getItemNamespace(item);
        }

        vm.openAddAnnotationOverlay = function() {
            resetAnnotationVariables();
            vm.editingAnnotation = false;
            vm.showAnnotationOverlay = true;
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
