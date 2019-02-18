(function() {
    'use strict';

    angular
        .module('datasets', [
            /* Custom Directives */
            'datasetsList',
            'datasetsTabset',
            'editDatasetOverlay',
            'newDatasetOverlay',
            'datasetsOntologyPicker',
            'uploadDataOverlay'
        ]);
})();
