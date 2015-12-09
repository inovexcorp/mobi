(function() {
    'use strict';

    angular
        .module('app')
        .controller('MapperController', MapperController);

    MapperController.$inject = ['$http'];

    function MapperController($http) {
        var vm = this;

        vm.files = [];
        vm.overlayData = {};

        vm.setSelected = setSelected;
        vm.uploadClicked = uploadClicked;
        vm.upload = upload;

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

        // uploads a delimited document to the data/tmp/ directory
        function upload(isValid, inputStream, fileName) {
            // checks to make sure the form is valid before hitting the endpoint
            if(isValid) {
                // shows the spinner
                vm.showSpinner = true;
                // parameters for the http request
                var params = {
                    method: 'POST',
                    url: '/etl/csv/upload',
                    headers: {
                        'File-Name': fileName
                    },
                    data: inputStream
                };
                // uploads the file
                $http(params)
                    .success(function(data) {
                        // once the file is uploaded, get the rows
                        $http.get('/etl/csv/preview/' + fileName)
                            .success(function(data) {
                                // adds the file to vm.files
                                vm.files.push({name: fileName, header: data[0], rows: data.slice(1, data.length)});
                                setSelected(vm.files.length - 1);
                                // hides the overlay and spinner
                                vm.showUploadOverlay = false;
                                vm.showSpinner = false;
                            });
                    })
                    .error(function(data) {
                        console.log('something went wrong, sorry... :(');
                    });
            }
        }
    }
})();
