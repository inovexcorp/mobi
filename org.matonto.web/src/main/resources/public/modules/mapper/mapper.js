(function() {
    'use strict';

    angular
        .module('mapper', ['csvManager', 'file-input', 'ontologyManager', 'prefixes', 'mappingManager', 'stepThroughSidebar', 
            'fileForm', 'filePreviewTable', 'mappingSelectOverlay', 'ontologySelectOverlay', 'ontologyPreview', 
            'startingClassSelectOverlay', 'classPreview', 'classList', 'propForm', 'propSelect', 'columnForm', 'columnSelect',
            'rangeClassDescription', 'editPropForm', 'editClassForm', 'availablePropList', 'finishOverlay', 'ontologyPreviewOverlay',
            'rdfPreview', 'previousCheckOverlay'])
        .controller('MapperController', MapperController);

    MapperController.$inject = ['$window', '$q', 'FileSaver', 'Blob', 'prefixes', 'csvManagerService', 'ontologyManagerService', 'mappingManagerService'];

    function MapperController($window, $q, FileSaver, Blob, prefixes, csvManagerService, ontologyManagerService, mappingManagerService) {
        var vm = this;
        var previousOntologyId;
        var originalMappingName;
        var defaultMapping = {
            name: '',
            jsonld: []
        };
        var onError = function(response) {
            console.error(response);
        }

        vm.areOntologies = function() {
            return ontologyManagerService.getList().length > 0;
        }
        vm.steps = ['Choose File', 'Choose Mapping', 'Choose Ontology', 'Choose Starting Class', 'Build Mapping', 'Upload as RDF'];
        vm.deleteEntity = undefined;

        // These get initialized in vm.intitialize()
        vm.mappedColumns;
        vm.activeStep;
        vm.delimitedFile;
        vm.delimitedSeparator;
        vm.delimitedContainsHeaders;
        vm.delimitedFileName;
        vm.filePreview;
        vm.tableHeight;
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

        vm.initialize = function() {
            vm.mappedColumns = [];
            vm.activeStep = 0;
            vm.delimitedFile = undefined;
            vm.delimitedSeparator = ',';
            vm.delimitedContainsHeaders = true;
            vm.delimitedFileName = '';
            vm.filePreview = undefined;
            vm.tableHeight = 0;
            vm.mapping = defaultMapping;
            vm.saveToServer = true;
            vm.rdfPreview = '';
            vm.invalidPropMappings = [];
            vm.isPreviousMapping = false;

            originalMappingName = '';
            vm.resetEditingVars();
        }

        // Handler for uploading delimited file
        vm.submitFileUpload = function() {
            var csvError = function(response) {
                onError(response);
                vm.filePreview = undefined;
            }
            var csvSuccess = function(data) {
                vm.delimitedFileName = data;
                vm.getPreview();
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
                deferred.resolve(vm.mapping,jsonld);
            }
            deferred.promise.then(function(data) {
                var mapping = new Blob([angular.toJson(data)], {type: 'application/json'});
                FileSaver.saveAs(mapping, vm.mapping.name + '.jsonld');
            }, onError);
        }

        /* Public helper methods */
        vm.isDatatypeProperty = function(propId) {
            var propObj = ontologyManagerService.getClassProperty(vm.getOntologyId(), vm.getClassId(vm.editingClassMappingId), propId);
            return propObj ? !ontologyManagerService.isObjectProperty(_.get(propObj, '@type', []), prefixes.owl) : false;
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
            return ontologyManagerService.getEntityName(ontologyManagerService.getOntologyById(vm.getOntologyId()));
        }
        vm.getOntologyId = function() {
            return mappingManagerService.getSourceOntologyId(vm.mapping);
        }
        vm.getClassId = function(classMappingId) {
            return mappingManagerService.getClassIdByMappingId(vm.mapping, classMappingId);
        }

        /* Private helper methods */
        function getAvailableColumns(columnsToRemove) {
            return _.difference(vm.filePreview.headers, columnsToRemove);
        }
        function getAvailableProps(classMappingId) {
            var mappedProps = _.map(mappingManagerService.getPropMappingsByClass(vm.mapping, classMappingId), "['" + prefixes.delim + "hasProperty'][0]['@id']");
            var classId = vm.getClassId(classMappingId);
            return _.filter(ontologyManagerService.getClassProperties(vm.getOntologyId(), classId), function(prop) {
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
            vm.mapping = defaultMapping;
        }
        vm.closeMappingSelect = function() {
            vm.activeStep = 0;
        }
        vm.closeOntologyChange = function() {
            vm.activeStep = 4;
            vm.mapping = mappingManagerService.setSourceOntology(vm.mapping, previousOntologyId);
            previousOntologyId = '';
            vm.changeOntology = false;
        }
        vm.displayOntologySelect = function(mappingType, mappingName) {
            switch (mappingType) {
                case 'new':
                    vm.mapping = mappingManagerService.createNewMapping(mappingName, vm.delimitedSeparator);
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
                            vm.displayPreviousCheck = true;
                        }, onError);
                    break;
                default:
                    previousOntologyId = previousOntologyId ? previousOntologyId : vm.getOntologyId();
                    vm.mapping = mappingManagerService.setSourceOntology(vm.mapping, '');
                    vm.activeStep = 2;
                    vm.displayPreviousCheck = false;
            }
        }
        vm.displayStartingClassSelect = function(ontologyId) {
            vm.mapping = mappingManagerService.setSourceOntology(vm.mapping, ontologyId);
            previousOntologyId = vm.changeOntology ? previousOntologyId : '';
            vm.activeStep = 3;
        }
        vm.displayFinish = function() {
            var deferred = $q.defer();
            var reject = function(error) {
                deferred.reject(error);
            }

            if (vm.saveToServer) {
                mappingManagerService.upload(vm.mapping.jsonld, vm.mapping.name)
                    .then(function(uuid) {
                        return csvManagerService.mapByFile(vm.delimitedFileName, uuid, vm.delimitedContainsHeaders);
                    })
                    .then(function(mappedData) {
                        deferred.resolve(mappedData);
                    }, reject);
            } else {
                csvManagerService.mapByString(vm.delimitedFileName, vm.mapping.jsonld, vm.delimitedContainsHeaders)
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
            if (vm.changeOntology) {
                var ontologyId = vm.getOntologyId();
                vm.mapping = mappingManagerService.createNewMapping(vm.mapping.name, vm.delimitedSeparator);
                vm.mapping = mappingManagerService.setSourceOntology(vm.mapping, ontologyId);
                vm.changeOntology = false;
                changedMapping();
            }
            if (classId) {
                vm.mapping = mappingManagerService.addClass(vm.mapping, classId, '${UUID}');
            } else {
                vm.isPreviousMapping = true;
                vm.saveToServer = false;
                var mappedCols = mappingManagerService.getMappedColumns(vm.mapping);
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
            vm.activeStep = 4;
            vm.resetEditingVars();
            vm.clearSelectedColumn();
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
        vm.displayEditClassForm = function(classMappingId) {
            vm.resetEditingVars();
            vm.editingClassMappingId = classMappingId;
            vm.availableProps = getAvailableProps(vm.editingClassMappingId);
            vm.numMappedClasses = mappingManagerService.getMappedClassIds(vm.mapping.jsonld).length;
        }
        vm.openAvailableProp = function(propId) {
            vm.displayPropForm(vm.editingClassMappingId);
            vm.selectedPropId = propId;
        }
        vm.displayDeleteConfirmation = function(classMappingId, propMappingId) {
            if (!classMappingId) {
                throw new Error('Not enough information to delete mapping entity');
            }
            vm.displayDeleteConfirm = true;
            vm.deleteEntity = {classMappingId};
            var classId = vm.getClassId(classMappingId);
            if (propMappingId) {
                var propId = mappingManagerService.getPropIdByMappingId(vm.mapping, propMappingId);
                vm.deleteEntity.name = ontologyManagerService.getEntityName(
                    ontologyManagerService.getClassProperty(vm.getOntologyId(), classId, propId)
                );
                vm.deleteEntity.propMappingId = propMappingId;
            } else {
                vm.deleteEntity.name = ontologyManagerService.getEntityName(ontologyManagerService.getClass(vm.getOntologyId(), classId));
            }
        }
        vm.generateRdfPreview = function(format) {
            csvManagerService.previewMap(vm.delimitedFileName, vm.mapping.jsonld, vm.delimitedContainsHeaders, format)
                .then(function(preview) {
                    vm.rdfPreview = preview;
                }, onError);
        }

        /** Set and Delete methods **/
        vm.setDatatypeProp = function(column) {
            var columnIdx = vm.filePreview.headers.indexOf(column);
            if (!vm.newProp) {
                var propMapping = mappingManagerService.getDataMappingFromClass(vm.mapping.jsonld, vm.editingClassMappingId, vm.selectedPropId);
                var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                var originalColumn = vm.filePreview.headers[index];
                _.pull(vm.mappedColumns, originalColumn);
            }
            vm.mapping = mappingManagerService.addDataProp(vm.mapping, vm.editingClassMappingId, vm.selectedPropId, columnIdx);
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
            vm.mapping = mappingManagerService.addObjectProp(vm.mapping, vm.editingClassMappingId, vm.selectedPropId, '${UUID}');
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
                    vm.mapping = mappingManagerService.removeProp(vm.mapping, vm.deleteEntity.classMappingId, propMapping['@id']);
                } else {
                    vm.mapping = mappingManagerService.removeClass(vm.mapping, vm.deleteEntity.classMappingId);
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
