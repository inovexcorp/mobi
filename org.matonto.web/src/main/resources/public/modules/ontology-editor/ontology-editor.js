(function() {
    'use strict';

    angular
        .module('ontology-editor', ['file-input', 'ontologyManager', 'stateManager', 'prefixManager'])
        .controller('OntologyEditorController', OntologyEditorController);

    OntologyEditorController.$inject = ['$scope', '$timeout', 'ontologyManagerService', 'stateManagerService', 'prefixManagerService'];

    function OntologyEditorController($scope, $timeout, ontologyManagerService, stateManagerService, prefixManagerService) {
        var vm = this;

        vm.ontologies = ontologyManagerService.getList();
        vm.state = stateManagerService.getState();
        vm.selected = ontologyManagerService.getObject(vm.state);

        initialize();

        function initialize() {
            $scope.$watch(function() {
                $timeout(function() {
                    return ontologyManagerService.getList();
                }, 0);
            }, function(fresh, old) {
                vm.ontologies = ontologyManagerService.getList();
            }, true);
        }

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
            ontologyManagerService.uploadThenGet(isValid, file, namespace, localName);
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
            prefixManagerService.editPrefix(edit, old, index, value, vm.selected);
        }

        vm.addPrefix = function(key, value) {
            prefixManagerService.addPrefix(key, value, vm.selected);
        }

        vm.removePrefix = function(key) {
            prefixManagerService.removePrefix(key, vm.selected);
        }
    }
})();
