(function() {
    'use strict';

    angular
        .module('ontology-editor', ['file-input', 'staticIri', 'annotationTab', 'annotationOverlay', 'annotationTree',
        'ontologyUploadOverlay', 'ontologyDownloadOverlay', 'tabButton', 'treeItem', 'treeItemWithSub',
        'everythingTree', 'classTree', 'propertyTree', 'ontologyEditor', 'classEditor', 'propertyEditor',
        'removeIriFromArray', 'ontologyManager', 'stateManager', 'prefixManager', 'annotationManager', 'responseObj',
        'serializationSelect', 'ontologyOpenOverlay', 'ngMessages', 'errorDisplay', 'createAnnotationOverlay',
        'createOntologyOverlay', 'createClassOverlay', 'createPropertyOverlay'])
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
                vm.iriHasChanged = false;
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

        vm.uploadOntology = function(isValid, file, namespace, localName) {
            vm.uploadError = false;
            ontologyManagerService.uploadThenGet(file)
                .then(function(response) {
                    vm.selectItem('ontology-editor', vm.ontologies.length - 1, undefined, undefined);
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
                        vm.selectItem('ontology-editor', vm.state.oi, undefined, undefined);
                    } else {
                        vm.selectItem('default', undefined, undefined, undefined);
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

        vm.save = function() {
            ontologyManagerService.edit(vm.ontology.matonto.originalId, vm.state)
                .then(function(state) {
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
            ontologyManagerService.download(vm.ontology['@id'], vm.downloadSerialization, vm.downloadFileName)
                .then(function(response) {
                    vm.showDownloadOverlay = false;
                    vm.downloadSerialization = '';
                    vm.downloadFileName = '';
                    vm.downloadError = false;
                }, function(response) {
                    vm.downloadError = _.get(response, 'statusText', 'Error downloading ontology. Please try again later.');
                });
        }

        vm.openDownloadOverlay = function() {
            vm.downloadFileName = ontologyManagerService.getBeautifulIRI(angular.copy(vm.ontology['@id'])).replace(' ', '_');
            vm.downloadError = false;
            vm.downloadSerialization = '';
            vm.showDownloadOverlay = true;
        }

        vm.createOntology = function(ontologyIri, label) {
            ontologyManagerService.createOntology(ontologyIri, label)
                .then(function(response) {
                    vm.createOntologyError = '';
                    vm.showCreateOntologyOverlay = false;
                    onCreateSuccess('ontology');
                }, function(errorMessage) {
                    vm.createOntologyError = errorMessage;
                });
        }

        vm.createClass = function(classIri, label) {
            ontologyManagerService.createClass(vm.ontology, classIri, label)
                .then(function(response) {
                    vm.createClassError = '';
                    vm.showCreateClassOverlay = false;
                    onCreateSuccess('class');
                }, function(errorMessage) {
                    vm.createClassError = errorMessage;
                });
        }

        vm.createProperty = function(propertyIri, label, type, range, domain) {
            ontologyManagerService.createProperty(vm.ontology, propertyIri, label, type, range, domain)
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
            annotationManagerService.add(vm.selected, select, value);
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

        vm.removeAnnotation = function(key, index) {
            annotationManagerService.remove(vm.selected, key, index);
            vm.entityChanged();
        }

        vm.getItemNamespace = function(item) {
            return ontologyManagerService.getItemNamespace(item);
        }

        vm.openAddAnnotationOverlay = function() {
            resetAnnotationVariables();
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
