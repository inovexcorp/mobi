(function() {
    'use strict';

    angular
        .module('catalog', ['resourcePreview', 'resultList', 'filterList', 'resourceType'])
        .controller('CatalogController', CatalogController);

    function CatalogController() {
        var vm = this;
    }
})();