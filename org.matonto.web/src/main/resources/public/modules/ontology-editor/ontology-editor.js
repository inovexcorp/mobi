(function() {
    'use strict';

    angular
        .module('ontology-editor', ['file-input', 'ontologyManager', 'stateManager', 'prefixManager', 'annotationManager', 'ngTagsInput'])
        .controller('OntologyEditorController', OntologyEditorController);

    OntologyEditorController.$inject = ['$scope', '$timeout', 'ontologyManagerService', 'stateManagerService', 'prefixManagerService', 'annotationManagerService'];

    function OntologyEditorController($scope, $timeout, ontologyManagerService, stateManagerService, prefixManagerService, annotationManagerService) {
        var vm = this;

        vm.ontologies = ontologyManagerService.getList();
        vm.state = stateManagerService.getState();
        vm.selected = ontologyManagerService.getObject(vm.state);

        /* State Management */
        vm.setTreeTab = function(tab) {
            stateManagerService.setTreeTab(tab);
            vm.state = stateManagerService.getState();
            vm.selected = ontologyManagerService.getObject(vm.state);
        }

        vm.setEditorTab = function(tab) {
            stateManagerService.setEditorTab(tab);
            vm.state = stateManagerService.getState();
        }

        /* Ontology Management */
        vm.uploadOntology = function(isValid, file, namespace, localName) {
            ontologyManagerService.uploadThenGet(isValid, file)
                .then(function(response) {
                    vm.selectItem('ontology-editor', vm.ontologies.length - 1, undefined, undefined);
                    vm.showUploadOverlay = false;
                }, function(response) {
                    vm.uploadError = response.data.error;
                });
        }

        vm.deleteOntology = function() {
            ontologyManagerService.delete(vm.selected['@id'], vm.state)
                .then(function(response) {
                    stateManagerService.clearState(vm.state.oi);
                    vm.selectItem('default', undefined, undefined, undefined);
                });
        }

        vm.selectItem = function(editor, oi, ci, pi) {
            stateManagerService.setState(editor, oi, ci, pi);
            stateManagerService.setEditorTab('basic');
            vm.state = stateManagerService.getState();
            vm.selected = ontologyManagerService.getObject(vm.state);
        }

        vm.submitEdit = function(isValid) {
            ontologyManagerService.edit(isValid, vm.selected, vm.state);
        }

        vm.submitCreate = function(isValid) {
            ontologyManagerService.create(isValid, vm.selected, vm.state);
            stateManagerService.setStateToNew(vm.state, vm.ontologies);
            stateManagerService.setEditorTab('basic');
            vm.state = stateManagerService.getState();
        }

        /* Prefix (Context) Management */
        vm.editPrefix = function(edit, old, index, value) {
            prefixManagerService.edit(edit, old, index, value, vm.selected);
        }

        vm.addPrefix = function(key, value) {
            prefixManagerService.add(key, value, vm.selected);
        }

        vm.removePrefix = function(key) {
            prefixManagerService.remove(key, vm.selected);
        }

        /* Annotation Management */
        vm.addAnnotation = function(key, value, select) {
            annotationManagerService.add(vm.selected, key, value, select);
        }

        vm.removeAnnotation = function(key) {
            annotationManagerService.remove(vm.selected, key);
        }
    }
})();
