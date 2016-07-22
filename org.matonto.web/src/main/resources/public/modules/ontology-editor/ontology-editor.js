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
        vm.sm.ontologyIds = ontologyManagerService.getOntologyIds();

        /* Ontology Management */
        vm.deleteEntity = function() {
            ontologyManagerService.delete(vm.sm.ontology.matonto.originalId, vm.sm.selected.matonto.originalId, vm.sm.currentState)
                .then(function(response) {
                    vm.sm.showDeleteConfirmation = false;
                    if(response.selectOntology) {
                        stateManagerService.setTreeTab('everything');
                        vm.sm.selectItem('ontology-editor', vm.sm.currentState.oi);
                    } else {
                        stateManagerService.clearState(vm.sm.currentState.oi);
                    }
                });
        }

        vm.disableSave = function() {
            return !_.get(vm.sm.ontology, 'matonto.isValid', false) || !ontologyManagerService.getChangedListForOntology(_.get(vm.sm.ontology, 'matonto.originalId')).length;
        }

        vm.save = function() {
            ontologyManagerService.edit(vm.sm.ontology.matonto.originalId, vm.sm.currentState)
                .then(function(state) {
                    vm.showSaveOverlay = false;
                    vm.sm.currentState = state;
                });
        }

        vm.getPreview = function() {
            ontologyManagerService.getPreview(vm.sm.ontology['@id'], vm.serialization)
                .then(function(response) {
                    vm.preview = response;
                }, function(response) {
                    vm.preview = response;
                });
        }

        vm.closeOntology = function() {
            ontologyManagerService.closeOntology(vm.sm.currentState.oi, vm.sm.ontology['@id']);
            stateManagerService.clearState(vm.sm.currentState.oi);
            vm.sm.selected = {};
            vm.sm.ontology = {};
            vm.showCloseOverlay = false;
        }

        /* Annotation Management */
        vm.removeAnnotation = function() {
            annotationManagerService.remove(vm.sm.selected, vm.key, vm.index);
            vm.entityChanged();
            vm.showRemoveAnnotationOverlay = false;
        }
    }
})();
