(function() {
    'use strict';

    angular
        .module('mapper', ['etl', 'file-input', 'ontologyManager', 'prefixes', 'mappingManager', 'stepThroughSidebar', 
            'fileForm', 'filePreviewTable', 'mappingSelectOverlay', 'ontologySelectOverlay', 'ontologyPreview', 
            'baseClassSelectOverlay', 'classPreview', 'classList', 'propForm', 'propSelect', 'columnForm', 'columnSelect',
            'rangeClassDescription', 'editPropForm', 'editClassForm', 'availablePropList'])
        .controller('MapperController', MapperController);

    MapperController.$inject = ['prefixes', 'etlService', 'ontologyManagerService', 'mappingManagerService'];

    function MapperController(prefixes, etlService, ontologyManagerService, mappingManagerService) {
        var vm = this;

        var defaultMapping = {
            name: '',
            jsonld: []
        };
        var previousOntologyId = '';
        var mappedColumns = [];

        vm.activeStep = 0;
        vm.delimitedFile = undefined;
        vm.delimitedSeparator = 'comma';
        vm.delimitedContainsHeaders = true;
        vm.delimitedFileName = '';
        vm.filePreview = undefined;
        vm.tableHeight = 0;
        vm.mapping = defaultMapping;
        vm.ontologyId = '';
        vm.baseClassId = '';
        vm.saveToServer = true;
        vm.selectedPropId = '';
        vm.selectedColumn = '';
        vm.newProp = false;

        // Handler for uploading delimited file
        vm.submitFileUpload = function() {
            etlService.upload(vm.delimitedFile).then(function(data) {
                vm.delimitedFileName = data;
                vm.getSmallPreview();
            });
        }

        /* File Preview Table Methods */
        vm.togglePreview = function(big) {
            if (big) {
                vm.getBigPreview();
            } else {
                vm.getSmallPreview();
            }
        }
        vm.getBigPreview = function() {
            etlService.preview(vm.delimitedFileName, 100).then(function(data) {
                vm.filePreview = data;
            });
        }
        vm.getSmallPreview = function() {
            etlService.preview(vm.delimitedFileName, 5).then(function(data) {
                vm.filePreview = data;
            });
        }

        /* Setup Overlay Methods */
        vm.displayMappingSelect = function() {
            vm.activeStep = 1;
            vm.mapping = defaultMapping;
        }
        vm.closeMappingSelect = function() {
            vm.activeStep = 0;
        }
        vm.displayOntologySelect = function(mappingType, mappingName) {
            switch (mappingType) {
                case 'new':
                    vm.mapping = mappingManagerService.createNewMapping(mappingName, vm.delimitedSeparator);
                    break;
                case 'previous':
                    console.log("TODO");
                    return;
                    break;
                default:
                    previousOntologyId = vm.ontologyId;
                    vm.ontologyId = '';
            }

            vm.activeStep = 2;
        }
        vm.displayBaseClassSelect = function(ontologyId) {
            vm.ontologyId = ontologyId;
            previousOntologyId = '';
            vm.activeStep = 3;
        }

        /* Edit Mapping methods */
        /** Display methods **/
        vm.displayEditMapping = function(baseClassId) {
            vm.baseClassId = baseClassId
            vm.mapping = mappingManagerService.addClass(vm.mapping, vm.ontologyId, baseClassId, 'UUID');
            vm.activeStep = 4;
        }
        vm.displayPropForm = function(classId) {
            vm.editingClassId = classId;
            vm.availableProps = getAvailableProps(vm.editingClassId);
            vm.lastProp = vm.availableProps.length <= 1;
            vm.newProp = true;
        }
        vm.displayColumnForm = function(extraHeader) {
            var columnsToRemove = _.without(mappedColumns, extraHeader) ;
            vm.availableColumns = getAvailableColumns(columnsToRemove);
        }
        vm.displayEditPropForm = function(classId, propId) {
            vm.resetEditingVars();
            vm.editingClassId = classId;
            vm.selectedPropId = propId;
            var propMapping = _.find(
                mappingManagerService.getPropMappingsByClass(vm.mapping, vm.editingClassId), 
                ["['" + prefixes.delim + "hasProperty'][0]['@id']", propId]
            );
            if (mappingManagerService.isDataMapping(propMapping)) {
                var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                var extraColumn = vm.filePreview.headers[index];
                vm.displayColumnForm(extraColumn);
                vm.selectedColumn = extraColumn;
            }
        }
        vm.displayEditClassForm = function(classId) {
            vm.resetEditingVars();
            vm.editingClassId = classId;
            vm.availableProps = getAvailableProps(vm.editingClassId);
        }
        vm.openAvailableProp = function(propId) {
            vm.displayPropForm(vm.editingClassId);
            vm.selectedPropId = propId;
        }

        /** Set and Delete methods **/
        vm.setDatatypeProp = function(column) {
            var columnIdx = vm.filePreview.headers.indexOf(column);
            if (!vm.newProp) {
                var propMapping = mappingManagerService.getDataMappingFromClass(vm.mapping.jsonld, vm.editingClassId, vm.selectedPropId);
                var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                var originalColumn = vm.filePreview.headers[index];
                _.pull(mappedColumns, originalColumn);
            }
            vm.mapping = mappingManagerService.addDataProp(vm.mapping, vm.ontologyId, vm.editingClassId, vm.selectedPropId, columnIdx);
            mappedColumns.push(column);
            vm.resetEditingVars();
        }
        vm.setNextDatatypeProp = function(column) {
            var editingClassId = vm.editingClassId;
            vm.setDatatypeProp(column);
            vm.displayPropForm(editingClassId);
        }
        vm.setObjectProp = function() {
            vm.mapping = mappingManagerService.addObjectProp(vm.mapping, vm.ontologyId, vm.editingClassId, vm.selectedPropId, 'UUID');
            vm.resetEditingVars();
        }
        vm.setNextObjectProp = function() {
            var editingClassId = vm.editingClassId;
            vm.setObjectProp();
            vm.displayPropForm(editingClassId);
        }
        vm.deleteEntity = function(classId, propId) {
            var entityName;
            if (!classId) {
                throw new Error('Not enough information to delete mapping entity');                
            }
            if (propId) {
                entityName = ontologyManagerService.getEntityName(ontologyManagerService.getClassProperty(vm.ontologyId, classId, propId));
            } else {
                entityName = ontologyManagerService.getEntityName(ontologyManagerService.getClass(vm.ontologyId, classId));
            }

            var confirm = window.confirm('Are you sure you want to delete ' + entityName + '?');
            if (confirm) {
                if (propId) {
                    var propMapping = _.find(vm.mapping.jsonld, ["['" + prefixes.delim + "hasProperty'][0]['@id']", propId]);
                    if (mappingManagerService.isDataMapping(propMapping)) {
                        var index = parseInt(propMapping[prefixes.delim + 'columnIndex'][0]['@value'], 10);
                        _.pull(mappedColumns, vm.filePreview.headers[index]);
                    }
                    vm.mapping = mappingManagerService.removeProp(vm.mapping, classId, propMapping['@id']);                    
                } else {
                    vm.mapping = mappingManagerService.removeClass(vm.mapping, classId);
                }
                vm.resetEditingVars();
            }
        }
        vm.setBaseClass = function() {
            vm.baseClassId = vm.editingClassId;
            vm.resetEditingVars();
        }

        /** Public helper methods **/
        vm.isDatatypeProperty = function(propId) {
            var propObj = ontologyManagerService.getClassProperty(vm.ontologyId, vm.editingClassId, propId);
            return ontologyManagerService.isDatatypeProperty(propObj);
        }
        vm.resetEditingVars = function() {
            vm.editingClassId = '';
            vm.selectedColumn = '';
            vm.selectedPropId = '';
            vm.newProp = false;
        }

        /** Public helper methods**/
        function getAvailableColumns(columnsToRemove) {
            return _.difference(vm.filePreview.headers, columnsToRemove);
        }
        function getAvailableProps(classId) {
            var mappedProps = _.map(mappingManagerService.getPropMappingsByClass(vm.mapping, classId), "['" + prefixes.delim + "hasProperty'][0]['@id']");
            return _.filter(ontologyManagerService.getClassProperties(vm.ontologyId, classId), function(prop) {
                return mappedProps.indexOf(prop['@id']) < 0;
            });
        }
    }
})();
