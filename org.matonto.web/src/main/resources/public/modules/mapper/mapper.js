(function() {
    'use strict';

    angular
        .module('mapper', ['csvManager', 'file-input', 'ontologyManager', 'prefixes', 'mappingManager', 'stepThroughSidebar', 
            'fileForm', 'filePreviewTable', 'mappingSelectOverlay', 'ontologySelectOverlay', 'ontologyPreview', 
            'startingClassSelectOverlay', 'classPreview', 'classList', 'propForm', 'propSelect', 'columnForm', 'columnSelect',
            'rangeClassDescription', 'editPropForm', 'editClassForm', 'availablePropList', 'finishOverlay', 'ontologyPreviewOverlay',
            'rdfPreview', 'previousCheckOverlay', 'iriTemplateOverlay','mappingNameOverlay', 'mappingNameInput'])
        .controller('MapperController', MapperController);

    MapperController.$inject = ['$rootScope', '$scope', '$element', '$state', '$window', '$q', 'FileSaver', 'Blob', 'prefixes', 'csvManagerService', 'ontologyManagerService', 'mappingManagerService'];

    function MapperController($rootScope, $scope, $element, $state, $window, $q, FileSaver, Blob, prefixes, csvManagerService, ontologyManagerService, mappingManagerService) {
        var vm = this;
        var confirmChange = false;
        var previousSourceOntologyId;
        var previousOntologies;
        var originalMappingName;
        var defaultMapping = {
            name: '',
            jsonld: []
        };
        var onError = function(response) {
            console.error(response);
        }

        vm.nextState = '';
        vm.steps = ['Choose File', 'Choose Mapping', 'Choose Ontology', 'Choose Starting Class', 'Build Mapping', 'Upload as RDF'];
        vm.deleteEntity = undefined;

        // These get initialized in vm.intitialize()
        vm.sourceOntology;
        vm.ontologies;
        vm.mappedColumns;
        vm.activeStep;
        vm.delimitedFile;
        vm.delimitedSeparator;
        vm.delimitedContainsHeaders;
        vm.delimitedFileName;
        vm.filePreview;
        vm.mapping;
        vm.saveToServer;
        vm.rdfPreview;
        vm.invalidPropMappings;
        vm.isPreviousMapping;
        vm.editingClassMappingId;
        vm.selectedPropId;
        vm.selectedPropMappingId;
        vm.selectedColumn;
        vm.newProp;
        vm.errorMessage;

        var changePageHandler = $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            if (_.includes(fromState.name, 'mapper') && !_.includes(toState.name, 'mapper') 
                && !angular.equals(vm.mapping, defaultMapping) && !confirmChange) {
                vm.displayPageChangeConfirm = true;
                vm.nextState = toState.name;
                event.preventDefault();
            }
        });

        $scope.$on('$destroy', changePageHandler);

        vm.initialize = function() {
            vm.sourceOntology = undefined;
            vm.ontologies = [];
            vm.mappedColumns = [];
            vm.activeStep = 0;
            vm.delimitedFile = undefined;
            vm.delimitedSeparator = ',';
            vm.delimitedContainsHeaders = true;
            vm.delimitedFileName = '';
            vm.filePreview = undefined;
            vm.mapping = angular.copy(defaultMapping);
            vm.saveToServer = true;
            vm.rdfPreview = '';
            vm.invalidPropMappings = [];
            vm.isPreviousMapping = false;
            vm.errorMessage = '';

            originalMappingName = '';
            vm.resetEditingVars();
        }

        // Handler for uploading delimited file
        vm.submitFileUpload = function() {
            var csvError = function(response) {
                onError(response);
                vm.filePreview = undefined;
                vm.errorMessage = response.statusText;
            }
            var csvSuccess = function(data) {
                vm.delimitedFileName = data;
                vm.getPreview();
                vm.errorMessage = '';
            }
            if (vm.delimitedFileName) {
                csvManagerService.update(vm.delimitedFileName, vm.delimitedFile)
                    .then(csvSuccess, csvError);
            } else {
                csvManagerService.upload(vm.delimitedFile)
                    .then(csvSuccess, csvError);
            }
        }

        // Handler for downloading mapping file
        vm.saveMapping = function() {
            var deferred = $q.defer();
            if (vm.saveToServer) {
                mappingManagerService.downloadMapping(vm.mapping.name)
                    .then(function(response) {
                        deferred.resolve(response);
                    }, function(error) {
                        deferred.reject(error);
                    });
            } else {
                deferred.resolve(vm.mapping.jsonld);
            }
            deferred.promise.then(function(data) {
                var mapping = new Blob([angular.toJson(data)], {type: 'application/json'});
                FileSaver.saveAs(mapping, vm.mapping.name + '.jsonld');
                vm.initialize();
            }, onError);
        }

        /* Public helper methods */
        vm.confirmPageChange = function() {
            confirmChange = true;
            $state.go(vm.nextState);
        }
        vm.areOntologies = function() {
            return ontologyManagerService.getList().length + ontologyManagerService.getOntologyIds().length > 0;
        }
        vm.isDatatypeProperty = function(propId) {
            var classId = vm.getClassId(vm.editingClassMappingId);
            var propObj = ontologyManagerService.getClassProperty(ontologyManagerService.findOntologyWithClass(vm.ontologies, classId), classId, propId);
            return propObj ? !ontologyManagerService.isObjectProperty(_.get(propObj, '@type', [])) : false;
        }
        vm.resetEditingVars = function() {
            vm.editingClassMappingId = '';
            vm.selectedColumn = '';
            vm.selectedPropId = '';
            vm.selectedPropMappingId = '';
            vm.newProp = false;
        }
        vm.clearSelectedColumn = function() {
            vm.selectedColumn = '';
        }
        vm.getOntologyName = function() {
            return ontologyManagerService.getEntityName(vm.sourceOntology);
        }
        vm.getClassId = function(classMappingId) {
            return mappingManagerService.getClassIdByMappingId(vm.mapping.jsonld, classMappingId);
        }

        /* Private helper methods */
        function getAvailableColumns(columnsToRemove) {
            return _.difference(vm.filePreview.headers, columnsToRemove);
        }
        function getAvailableProps(classMappingId) {
            var mappedProps = _.map(mappingManagerService.getPropMappingsByClass(vm.mapping.jsonld, classMappingId), "['" + prefixes.delim + "hasProperty'][0]['@id']");
            var classId = vm.getClassId(classMappingId);
            return _.filter(ontologyManagerService.getClassProperties(ontologyManagerService.findOntologyWithClass(vm.ontologies, classId), classId), function(prop) {
                return mappedProps.indexOf(prop['@id']) < 0;
            });
        }
        function changedMapping() {
            if (vm.isPreviousMapping) {
                vm.saveToServer = true;
                if (!originalMappingName) {
                    originalMappingName = vm.mapping.name;
                    vm.mapping.name = originalMappingName + "_" + Math.floor(Date.now() / 1000);
                }
            }
        }

        /* File Preview Table Methods */
        vm.getPreview = function() {
            csvManagerService.previewFile(vm.delimitedFileName, 100, vm.delimitedSeparator, vm.delimitedContainsHeaders)
                .then(function(data) {
                    vm.filePreview = data;
                }, function(error) {
                    console.log(error);
                    vm.filePreview = undefined;
                });
        }
        vm.clickColumn = function(colIndex) {
            if (vm.selectedPropId) {
                vm.selectedColumn = vm.filePreview.headers[colIndex];
            }
        }

        /* Overlay Methods */
        vm.displayMappingSelect = function() {
            vm.displayPreviousCheck = false;
            vm.activeStep = 1;
            vm.mapping = angular.copy(defaultMapping);
            vm.sourceOntology = undefined;
            vm.ontologies = [];
        }
        vm.closeMappingSelect = function() {
            vm.activeStep = 0;
        }
        vm.closeOntologyChange = function() {
            vm.activeStep = 4;
            vm.mapping.jsonld = mappingManagerService.setSourceOntology(vm.mapping.jsonld, previousSourceOntologyId);
            vm.ontologies = previousOntologies;
            vm.sourceOntology = _.find(vm.ontologies, {'@id': previousSourceOntologyId});
            previousOntologies = undefined;
            previousSourceOntologyId = '';
            vm.changeOntology = false;
        }
        vm.displayOntologySelect = function(mappingType, mappingName) {
            switch (mappingType) {
                case 'new':
                    vm.mapping.jsonld = mappingManagerService.createNewMapping(mappingName);
                    vm.mapping.name = mappingName;
                    vm.activeStep = 2;
                    vm.displayPreviousCheck = false;
                    break;
                case 'previous':
                    mappingManagerService.getMapping(mappingName)
                        .then(function(data) {
                            vm.mapping = {
                                jsonld: data,
                                name: mappingName
                            };
                            var ontologyId = mappingManagerService.getSourceOntologyId(vm.mapping.jsonld);
                            var ontology = _.find(ontologyManagerService.getList(), {'@id': ontologyId});
                            if (ontology) {
                                return $q.resolve(ontology);
                            } else {
                                return ontologyManagerService.getThenRestructure(ontologyId);
                            }
                        }, onError).then(function(ontology) {
                            ontologyManagerService.getImportedOntologies(ontology['@id']).then(function(imported) {
                                vm.ontologies = _.concat(ontology, imported);
                                vm.sourceOntology = ontology;
                                vm.displayPreviousCheck = true;
                            }, onError);
                        }, function(error) {
                            console.error(error.statusText);
                            vm.sourceOntology = undefined;
                            vm.displayPreviousCheck = true;
                        });
                    break;
                default:
                    previousSourceOntologyId = previousSourceOntologyId ? previousSourceOntologyId : mappingManagerService.getSourceOntologyId(vm.mapping.jsonld);
                    previousOntologies = previousOntologies ? previousOntologies : vm.ontologies;
                    vm.mapping.jsonld = mappingManagerService.setSourceOntology(vm.mapping.jsonld, '');
                    vm.activeStep = 2;
                    vm.displayPreviousCheck = false;
            }
        }
        vm.displayStartingClassSelect = function(ontology) {
            vm.mapping.jsonld = mappingManagerService.setSourceOntology(vm.mapping.jsonld, ontology['@id']);
            vm.sourceOntology = ontology;

            if (ontology['@id'] !== previousSourceOntologyId) {
                vm.ontologies = [ontology];
                ontologyManagerService.getImportedOntologies(ontology['@id']).then(function(response) {
                    vm.ontologies = _.concat(vm.ontologies, response);
                }, onError);
            }

            vm.activeStep = 3;
        }
        vm.displayFinish = function() {
            var deferred = $q.defer();
            var reject = function(error) {
                deferred.reject(error);
            }

            if (vm.saveToServer) {
                mappingManagerService.uploadPut(vm.mapping.jsonld, vm.mapping.name)
                    .then(function(response) {
                        return csvManagerService.mapByUploaded(vm.delimitedFileName, vm.mapping.name, vm.delimitedContainsHeaders, vm.delimitedSeparator);
                    })
                    .then(function(mappedData) {
                        deferred.resolve(mappedData);
                    }, reject);
            } else {
                csvManagerService.mapByString(vm.delimitedFileName, vm.mapping.jsonld, vm.delimitedContainsHeaders, vm.delimitedSeparator)
                    .then(function(mappedData) {
                        deferred.resolve(mappedData);
                    }, reject);
            }
            deferred.promise.then(function(data) {
                var blob = new Blob([angular.toJson(data)], {type: 'application/json'});
                FileSaver.saveAs(blob, vm.delimitedFileName + '.jsonld');
                vm.activeStep = 5;
            }, onError);
        }
        vm.toggleOntologyPreview = function() {
            vm.displayOntologyPreview = !vm.displayOntologyPreview;
        }

        /* Edit Mapping methods */
        /** Display methods **/
        vm.displayEditMapping = function(classId) {
            var sourceOntologyId = mappingManagerService.getSourceOntologyId(vm.mapping.jsonld);
            vm.sourceOntology = _.find(vm.ontologies, {'@id': sourceOntologyId});
            if (vm.changeOntology) {
                vm.mapping.jsonld = mappingManagerService.createNewMapping(vm.mapping.name);
                vm.mapping.jsonld = mappingManagerService.setSourceOntology(vm.mapping.jsonld, sourceOntologyId);
                vm.changeOntology = false;
                previousOntologies = undefined;
                previousSourceOntologyId = '';
                changedMapping();
            }
            vm.activeStep = 4;
            vm.resetEditingVars();
            vm.clearSelectedColumn();
            if (classId) {
                var ontology = ontologyManagerService.findOntologyWithClass(vm.ontologies, classId);
                vm.mapping.jsonld = mappingManagerService.addClass(vm.mapping.jsonld, ontology, classId);
                vm.displayEditClassForm(_.get(_.find(vm.mapping.jsonld, {'@type': [prefixes.delim + 'ClassMapping']}), '@id'));
            } else {
                vm.isPreviousMapping = true;
                vm.saveToServer = false;
                var mappedCols = mappingManagerService.getMappedColumns(vm.mapping.jsonld);
                _.forEach(mappedCols, function(obj) {
                    if (vm.filePreview.headers[obj.index]) {
                        vm.mappedColumns.push(vm.filePreview.headers[obj.index]);
                    } else {
                        vm.invalidPropMappings.push(obj.propId);
                    }
                });
                if (vm.invalidPropMappings.length > 0) {
                    changedMapping();
                }
                vm.displayPreviousCheck = false;
            }
        }
        vm.displayPropForm = function(classMappingId) {
            vm.resetEditingVars();
            vm.editingClassMappingId = classMappingId;
            vm.availableProps = getAvailableProps(vm.editingClassMappingId);
            vm.newProp = true;
        }
        vm.displayColumnForm = function(extraHeader) {
            vm.clearSelectedColumn();
            var columnsToRemove = _.without(vm.mappedColumns, extraHeader) ;
            vm.availableColumns = getAvailableColumns(columnsToRemove);
        }
        vm.displayEditPropForm = function(classMappingId, propMappingId) {
            vm.resetEditingVars();
            vm.editingClassMappingId = classMappingId;
            vm.selectedPropMappingId = propMappingId;
            var propMapping = _.find(vm.mapping.jsonld, {'@id': propMappingId});
            vm.selectedPropId = mappingManagerService.getPropIdByMapping(propMapping);
            if (mappingManagerService.isDataMapping(propMapping)) {
                var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                var extraColumn = vm.filePreview.headers[index];
                vm.displayColumnForm(extraColumn);
                vm.selectedColumn = extraColumn;
            }
        }
        vm.displayIriTemplateOverlay = function() {
            vm.displayIriTemplate = true;
            vm.classMapping = _.find(vm.mapping.jsonld, {'@id': vm.editingClassMappingId});
        }
        vm.displayEditClassForm = function(classMappingId) {
            vm.resetEditingVars();
            vm.editingClassMappingId = classMappingId;
            vm.availableProps = getAvailableProps(vm.editingClassMappingId);
            vm.numMappedClasses = mappingManagerService.getAllClassMappings(vm.mapping.jsonld).length;
        }
        vm.openAvailableProp = function(propId) {
            vm.displayPropForm(vm.editingClassMappingId);
            vm.selectedPropId = propId;
            if (vm.isDatatypeProperty(propId)) {
                vm.displayColumnForm();
            }
        }
        vm.displayDeleteConfirmation = function(classMappingId, propMappingId) {
            if (!classMappingId) {
                throw new Error('Not enough information to delete mapping entity');
            }
            vm.displayDeleteConfirm = true;
            vm.deleteEntity = {classMappingId};
            var classId = vm.getClassId(classMappingId);
            var ontology = ontologyManagerService.findOntologyWithClass(vm.ontologies, classId);
            if (propMappingId) {
                var propId = mappingManagerService.getPropIdByMappingId(vm.mapping.jsonld, propMappingId);
                vm.deleteEntity.name = ontologyManagerService.getEntityName(
                    ontologyManagerService.getClassProperty(ontology, classId, propId)
                );
                vm.deleteEntity.propMappingId = propMappingId;
            } else {
                vm.deleteEntity.name = ontologyManagerService.getEntityName(ontologyManagerService.getClass(ontology, classId));
            }
        }
        vm.generateRdfPreview = function(format) {
            csvManagerService.previewMap(vm.delimitedFileName, vm.mapping.jsonld, vm.delimitedContainsHeaders, format, vm.delimitedSeparator)
                .then(function(preview) {
                    vm.rdfPreview = preview;
                }, onError);
        }

        /** Set and Delete methods **/
        vm.setIriTemplate = function(prefixEnd, localName) {
            vm.mapping.jsonld = mappingManagerService.editIriTemplate(vm.mapping.jsonld, vm.editingClassMappingId, prefixEnd, localName);
            changedMapping();
        }
        vm.setMappingName = function(name) {
            vm.mapping.name = name;
        }
        vm.setDatatypeProp = function(column) {
            var columnIdx = vm.filePreview.headers.indexOf(column);
            if (!vm.newProp) {
                var propMapping = mappingManagerService.getDataMappingFromClass(vm.mapping.jsonld, vm.editingClassMappingId, vm.selectedPropId);
                var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                var originalColumn = vm.filePreview.headers[index];
                _.pull(vm.mappedColumns, originalColumn);
            }
            var ontology = ontologyManagerService.findOntologyWithClass(vm.ontologies, vm.getClassId(vm.editingClassMappingId));
            vm.mapping.jsonld = mappingManagerService.addDataProp(vm.mapping.jsonld, ontology, vm.editingClassMappingId, vm.selectedPropId, columnIdx);
            vm.mappedColumns.push(column);
            var propMappingId = _.get(
                mappingManagerService.getDataMappingFromClass(vm.mapping.jsonld, vm.editingClassMappingId, vm.selectedPropId),
                '@id'
            );
            if (vm.invalidPropMappings.indexOf(propMappingId) >= 0) {
                _.pull(vm.invalidPropMappings, propMappingId);
            }
            changedMapping();
            vm.resetEditingVars();
        }
        vm.setNextDatatypeProp = function(column) {
            var editingClassMappingId = vm.editingClassMappingId;
            vm.setDatatypeProp(column);
            vm.displayPropForm(editingClassMappingId);
        }
        vm.setObjectProp = function() {
            vm.mapping.jsonld = mappingManagerService.addObjectProp(vm.mapping.jsonld, vm.ontologies, vm.editingClassMappingId, vm.selectedPropId);
            changedMapping();
            vm.resetEditingVars();
        }
        vm.setNextObjectProp = function() {
            var editingClassMappingId = vm.editingClassMappingId;
            vm.setObjectProp();
            vm.displayPropForm(editingClassMappingId);
        }
        vm.deleteMappingEntity = function() {
            if (vm.deleteEntity) {
                if (_.get(vm.deleteEntity, 'propMappingId')) {
                    var propMapping = _.find(vm.mapping.jsonld, {'@id': vm.deleteEntity.propMappingId});
                    if (mappingManagerService.isDataMapping(propMapping)) {
                        var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                        _.pull(vm.mappedColumns, vm.filePreview.headers[index]);
                    }
                    vm.mapping.jsonld = mappingManagerService.removeProp(vm.mapping.jsonld, vm.deleteEntity.classMappingId, propMapping['@id']);
                } else {
                    vm.mapping.jsonld = mappingManagerService.removeClass(vm.mapping.jsonld, vm.deleteEntity.classMappingId);
                }
            }
            changedMapping();
            vm.resetEditingVars();
            vm.deleteEntity = undefined;
        }

        /* INITIALIZATION */
        vm.initialize();
    }
})();
