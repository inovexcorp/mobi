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
        vm.selected = ontologyManagerService.getObject(vm.state.oi, vm.state.ci, vm.state.pi);

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
        vm.changeTreeTab = function(tab) {
            stateManagerService.changeTreeTab(tab);
            vm.state = stateManagerService.getState();
            vm.selected = ontologyManagerService.getObject(vm.state.oi, vm.state.ci, vm.state.pi);
        }

        vm.changeEditorTab = function(tab) {
            stateManagerService.changeEditorTab(tab);
            vm.state = stateManagerService.getState();
        }

        /* Ontology Management */
        vm.uploadOntology = function(isValid, file, namespace, localName) {
            ontologyManagerService.uploadThenGet(isValid, file, namespace, localName);
        }

        vm.edit = function(editor, oi, ci, pi) {
            stateManagerService.setState(editor, oi, ci, pi);
            stateManagerService.changeEditorTab('basic');
            vm.state = stateManagerService.getState();
            vm.selected = ontologyManagerService.getObject(vm.state.oi, vm.state.ci, vm.state.pi);
        }

        vm.submitEdit = function(isValid) {
            ontologyManagerService.edit(isValid, vm.state.oi, vm.state.ci, vm.state.pi, vm.selected);
        }

        vm.create = function(editor, oi, ci, pi) {
            stateManagerService.setState(editor, oi, ci, pi);
            vm.state = stateManagerService.getState();
            // TODO: figure out what to set vm.selected to
        }

        vm.submitCreate = function(isValid) {
            ontologyManagerService.create(isValid, vm.state.oi, vm.state.ci, vm.state.pi, vm.selected);
        }

        /* Prefix (Context) Management */
        vm.editPrefix = function(edit, old, index, value) {
            prefixManagerService.editPrefix(edit, old, index, value, vm.ontologies[vm.state.oi]);
        }

        vm.addPrefix = function(key, value) {
            prefixManagerService.addPrefix(key, value, vm.ontologies[vm.state.oi]);
        }

        vm.removePrefix = function(key) {
            prefixManagerService.removePrefix(key, vm.ontologies[vm.state.oi]);
        }
    }
})();
