(function() {
    'use strict';

    angular
        .module('catalog', ['mappingPreview', 'ontologyCatalogPreview'])
        .controller('CatalogController', CatalogController);

    function CatalogController() {
        var vm = this;

        activate();

        function activate() {

        }
    }
})();