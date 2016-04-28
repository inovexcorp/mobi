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
        var limit = 10;
        vm.results = {};
        vm.filters = {
            Resources: []
        };
        vm.errorMessage = '';
        vm.selectedResource = undefined;
        vm.orderBy = 'modified';
        vm.resourceType = undefined;
        vm.currentPage = 0;

        activate();

        function activate() {
            getResources();
            catalogManagerService.getResourceTypes()
                .then(function(types) {
                    vm.filters.Resources = _.map(types, function(type) {
                        return {
                            value: type,
                            formatter: getType,
                            applied: false
                        };
                    });
                });
        }

        vm.downloadResource = function(resource) {
            catalogManagerService.getResourceDistributions(resource.id)
                .then(function(distributions) {
                    var latest = _.last(_.sortBy(distributions, function(dist) {
                        return catalogManagerService.getDate(dist.modified);
                    }));
                    console.log('Downloading ' + latest.title);
                }, onError);
        }

        vm.getNextPage = function(direction, link) {
            catalogManagerService.getResultsPage(link)
                .then(function(results) {
                    if (direction === 'next') {
                        vm.currentPage += 1;
                    } else {
                        vm.currentPage -= 1;
                    }
                    vm.results = results
                }, onError);
        }

        vm.setSelectedResource = function(resource) {
            vm.selectedResource = resource;
        }

        vm.getUpdatedList = function() {
            _.forEach(vm.filters, function(options, type) {
                if (type === 'Resources') {
                    var selectedType = options[0];
                    if (vm.resourceType !== selectedType) {
                        vm.currentPage = 0;
                        vm.resourceType = selectedType;                        
                    }
                }
            });
            getResources();
        }

        function getType(type) {
            return catalogManagerService.getType(type);
        }
        function getResources() {
            catalogManagerService.getResources(limit, vm.currentPage, vm.resourceType, vm.orderBy)
                .then(function(results) {
                    vm.results = results;
                }, onError);
        }
    }
})();