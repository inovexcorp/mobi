(function() {
    'use strict';

    angular
        .module('mapper', ['etl', 'file-input', 'mapping', 'stepThroughSidebar', 'fileForm', 'filePreviewTable'])
        .controller('MapperController', MapperController);

    MapperController.$inject = ['etlService', 'mappingService'];

    // TODO: make the overlay a directive to clear, show, and hide
    function MapperController(etlService, mappingService) {
        var vm = this;

        vm.activeStep = 0;
        vm.delimitedFile = undefined;
        vm.delimitedSeparator = 'comma';
        vm.delimitedContainsHeaders = true;
        vm.delimitedFileName = '';
        vm.filePreview = undefined;

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
        vm.displayChooseMapping = function() {
            console.log("Choosing mapping");
            vm.activeStep = 1;
        }
    }
})();
