(function() {
    'use strict';

    angular
        .module('catalog', ['catalogManager', 'resourcePreview', 'resultList', 'filterList', 'resourceType'])
        .controller('CatalogController', CatalogController);

    CatalogController.$inject = ['catalogManagerService'];

    function CatalogController(catalogManagerService) {
        var vm = this;
        var onError = function(errorMessage) {
            vm.errorMessage = errorMessage;
        }
        vm.results = {};
        vm.errorMessage = '';
        vm.selectedResource = undefined;

        activate();

        function activate() {
            catalogManagerService.getResources(10, 0)
                .then(function(results) {
                    vm.results = results;
                }, onError);
        }

        vm.setSelectedResource = function(resource) {
            vm.selectedResource = resource;
        }

        vm.applyFilter = function(type, option) {
            if (type === 'Resources') {
                catalogManagerService.getResources(10, 0, option)
                    .then(function(results) {
                        vm.results = results;
                    }, onError)
            }
        }
    }
})();