(function() {
    'use strict';

    angular
        .module('mapper', ['etl', 'file-input', 'ontologyManager', 'prefixes', 'mappingManager', 'stepThroughSidebar', 'fileForm', 'filePreviewTable', 'mappingSelectOverlay', 'ontologySelectOverlay', 'ontologyPreview', 'baseClassSelectOverlay', 'classPreview', 'classList'])
        .controller('MapperController', MapperController);

    MapperController.$inject = ['prefixes', 'etlService', 'ontologyManagerService', 'mappingManagerService'];

    function MapperController(prefixes, etlService, ontologyManagerService, mappingManagerService) {
        var vm = this;

        var defaultMapping = {
            name: '',
            jsonld: []
        };
        var previousOntologyId = '';

        vm.activeStep = 0;
        vm.delimitedFile = undefined;
        vm.delimitedSeparator = 'comma';
        vm.delimitedContainsHeaders = true;
        vm.delimitedFileName = '';
        vm.filePreview = undefined;
        vm.mapping = defaultMapping;
        vm.ontologyId = '';
        vm.baseClassId = '';

        // handles the upload file submission
        vm.submitFileUpload = function() {
            etlService.upload(vm.delimitedFile).then(function(data) {
                vm.delimitedFileName = data;
                vm.getSmallPreview();
            });
        }
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
        vm.displayEditMapping = function(baseClassId) {
            vm.baseClassId = baseClassId
            vm.mapping = mappingManagerService.addClass(vm.mapping, vm.ontologyId, baseClassId, 'UUID');
            vm.activeStep = 4;
        }
    }
})();
