(function() {
    'use strict';

    angular
        .module('mapper', ['etl', 'file-input', 'mapping'])
        .controller('MapperController', MapperController);

    MapperController.$inject = ['etlService'];

    function MapperController(etlService) {
        var vm = this;

        vm.setSelected = setSelected;
        vm.uploadClicked = uploadClicked;
        vm.submitUpload = submitUpload;

        // sets the selected value based on index
        function setSelected(index) {
            vm.selected = vm.files[index];
        }

        // handles when they click the upload link
        function uploadClicked() {
            // clears the overlay data
            vm.overlayData = {};
            document.getElementById('inputStream').value = '';
            // shows the overlay
            vm.showUploadOverlay = true;
        }

        // handles the upload file submission
        function submitUpload(isValid, inputStream, fileName) {
            // uploads and then previews the file (defaults to 10)
            etlService.uploadThenPreview(isValid, inputStream, fileName)
                .then(function(data) {
                    console.log('data', data);
                });
        }
    }
})();
