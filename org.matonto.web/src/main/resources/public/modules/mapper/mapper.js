(function() {
    'use strict';

    angular
        .module('mapper', ['etl', 'file-input', 'mapping'])
        .controller('MapperController', MapperController);

    MapperController.$inject = ['etlService', 'mappingService'];

    // TODO: make the overlay a directive to clear, show, and hide
    function MapperController(etlService, mappingService) {
        var vm = this;

        vm.files = mappingService.files;
        vm.submitUpload = submitUpload;

        // handles the upload file submission
        function submitUpload(isValid, inputStream, fileName) {
            etlService.uploadThenPreview(isValid, inputStream, fileName)
                .then(function(data) {
                    mappingService.addFile(data);
                    vm.showUploadOverlay = false;
                    vm.index = vm.files.length - 1;
                },
                function(data) {
                    // TODO: handle error elegantly
                });
        }
    }
})();
