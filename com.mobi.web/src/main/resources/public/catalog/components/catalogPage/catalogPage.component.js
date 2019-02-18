(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:catalogPage
     * @requires catalogState.service:catalogStateService
     *
     * @description
     * `catalogPage` is a component which creates the main page of the Catalog module. The component contains different
     * content depending on whether a catalog Record has been selected.
     */
    const catalogPageComponent = {
        templateUrl: 'catalog/components/catalogPage/catalogPage.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: catalogPageComponentCtrl
    };

    catalogPageComponentCtrl.$inject = ['catalogStateService'];

    function catalogPageComponentCtrl(catalogStateService) {
        var dvm = this;
        dvm.state = catalogStateService;
    }

    angular.module('catalog')
        .component('catalogPage', catalogPageComponent);
})();
