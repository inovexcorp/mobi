(function() {
    'use strict';

    angular
        .module('ontology-editor', ['file-input', 'staticIri', 'getThisType', 'annotationTab', 'annotationOverlay',
        'ontologyUploadOverlay', 'ontologyDownloadOverlay', 'iriOverlay', 'tabButton', 'treeItem', 'treeItemWithSub',
        'everythingTree', 'classTree', 'propertyTree', 'ontologyEditor', 'classEditor', 'propertyEditor',
        'removeIriFromArray', 'ontologyManager', 'stateManager', 'prefixManager', 'annotationManager', 'responseObj',
        'serializationSelect', 'ontologyOpenOverlay', 'ngMessages', 'createError'])
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
            vm.selected = ontologyManagerService.getObject(vm.state);
        }

        vm.setEditorTab = function(tab) {
            stateManagerService.setEditorTab(tab);
            vm.state = stateManagerService.getState();
        }

        /* Ontology Management */
        function setVariables(oi) {
            vm.selected = ontologyManagerService.getObject(vm.state);
            vm.ontology = ontologyManagerService.getOntology(oi);
            vm.preview = 'Please select a serialization and hit refresh.';
            vm.serialization = '';
        }

        function submitEdit() {
            if(_.has(vm.ontology, 'matonto.originalId')) {
                ontologyManagerService.edit(vm.ontology.matonto.originalId);
            }
        }

        function submitCreate() {
            delete vm.selected.matonto.createError;
            ontologyManagerService.create(vm.selected, vm.state)
                .then(function() {
                    var oi = stateManagerService.setStateToNew(vm.state, vm.ontologies);
                    vm.state = stateManagerService.getState();
                    setVariables(oi);
                }, function(response) {
                    vm.selected.matonto.createError = response.statusText;
                });
        }

        vm.setValidity = function(isValid) {
            vm.ontology.matonto.isValid = isValid;
        }

        vm.uploadOntology = function(isValid, file, namespace, localName) {
            vm.uploadError = false;
            ontologyManagerService.uploadThenGet(file)
                .then(function(response) {
                    vm.selectItem('ontology-editor', vm.ontologies.length - 1, undefined, undefined);
                    vm.showUploadOverlay = false;
                }, function(response) {
                    vm.uploadError = response.data.error;
                });
        }

        vm.deleteEntity = function() {
            ontologyManagerService.delete(vm.ontology.matonto.originalId, vm.selected.matonto.originalId, vm.state)
                .then(function(response) {
                    vm.showDeleteConfirmation = false;
                    stateManagerService.clearState(vm.state.oi);
                    vm.selectItem('default', undefined, undefined, undefined);
                });
        }

        vm.selectItem = function(editor, oi, ci, pi) {
            stateManagerService.setState(editor, oi, ci, pi);
            vm.state = stateManagerService.getState();
            setVariables(oi);
        }

        vm.save = function() {
            if(vm.state.oi === -1 || vm.state.ci === -1 || vm.state.pi === -1) {
                submitCreate();
            } else {
                submitEdit();
            }
        }

        vm.editIRI = function() {
            ontologyManagerService.editIRI(vm.iriBegin, vm.iriThen, vm.iriEnd, vm.selected, vm.ontologies[vm.state.oi]);
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
            ontologyManagerService.download(vm.ontology['@id'], vm.downloadSerialization)
                .then(function(response) {
                    vm.showDownloadOverlay = false;
                    vm.downloadSerialization = '';
                    vm.downloadError = false;
                }, function(response) {
                    vm.downloadError = _.get(response, 'statusText', 'Error downloading ontology. Please try again later.');
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
                    vm.showOpenOverlay = false;
                    vm.openError = '';
                    vm.ontologyIdToOpen = undefined;
                }, function(errorMessage) {
                    vm.openError = errorMessage;
                });
        }

        vm.closeOntology = function() {
            ontologyManagerService.closeOntology(vm.state.oi, vm.selected['@id']);
            stateManagerService.clearState(vm.state.oi);
            vm.selected = {};
            vm.ontology = {};
            vm.showCloseOverlay = false;
        }

        /* Annotation Management */
        function resetAnnotationOverlay() {
            vm.showAnnotationOverlay = false;
            vm.selected.matonto.currentAnnotationKey = '';
            vm.selected.matonto.currentAnnotationValue = '';
            vm.selected.matonto.currentAnnotationSelect = null;
        }

        vm.addAnnotation = function() {
            annotationManagerService.add(vm.selected, vm.ontologies[vm.state.oi].matonto.annotations);
            resetAnnotationOverlay();
            vm.entityChanged();
        }

        vm.editClicked = function(key, index) {
            vm.editingAnnotation = true;
            vm.showAnnotationOverlay = true;
            vm.selected.matonto.currentAnnotationKey = key;
            vm.selected.matonto.currentAnnotationValue = vm.selected[key][index]['@value'];
            vm.selected.matonto.currentAnnotationIndex = index;
        }

        vm.editAnnotation = function() {
            annotationManagerService.edit(vm.selected, vm.selected.matonto.currentAnnotationKey, vm.selected.matonto.currentAnnotationValue, vm.selected.matonto.currentAnnotationIndex);
            resetAnnotationOverlay();
            vm.entityChanged();
        }

        vm.removeAnnotation = function(key, index) {
            annotationManagerService.remove(vm.selected, key, index);
            vm.entityChanged();
        }

        vm.getItemNamespace = function(item) {
            return ontologyManagerService.getItemNamespace(item);
        }

        vm.getAnnotationLocalNameLowercase = function(item) {
            return annotationManagerService.getLocalNameLowercase(item);
        }

        initialize();
    }
})();
