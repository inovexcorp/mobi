(function() {
    'use strict';

    angular
        .module('discover', [
            /* Services */
            'explore',
            'exploreUtils',
            'search',

            /* Common */
            'datasetFormGroup',
            'datasetSelect',
            'discoverTabset',
            'sparqlResultTable',

            /* Explore tab */
            'classBlock',
            'classBlockHeader',
            'classCards',
            'exploreTab',
            'instanceBlock',
            'instanceCards',
            'instanceCreator',
            'instanceEditor',
            'instanceForm',
            'instanceView',
            'newInstanceClassOverlay',
            'newInstancePropertyOverlay',
            'propertyValueOverlay',

            /* Search tab */
            'discoverSearchTab',
            'filterSelector',
            'propertyFilterOverlay',
            'propertySelector',
            'searchForm',

            /* Query tab */
            'downloadQueryOverlay',
            'queryTab',
            'sparqlEditor',
            'sparqlResultBlock'
        ]);
})();
