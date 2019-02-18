(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:sortOptions
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `sortOptions` is a component which creates a Bootstrap `form-group` with a select containing all sort options
     * from the {@link catalogManager.service:catalogManagerService}. The `sortOption` will be the value of the select,
     * but is one way bound. The `changeSort` function is expected to update the `sortOption` binding.
     *
     * @param {Function} changeSort A function that expects a parameter called `sortOption` and will be called when
     * the value of the select is changed. This function should update the `sortOption` binding.
     * @param {Object} sortOption A value from the `sortOptions` array in the
     * {@link catalogManager.service:catalogManagerService}
     */
    const sortOptionsComponent = {
        templateUrl: 'catalog/components/sortOptions/sortOptions.component.html',
        bindings: {
            sortOption: '<',
            changeSort: '&'
        },
        controllerAs: 'dvm',
        controller: sortOptionsComponentCtrl
    };

    sortOptionsComponentCtrl.$inject = ['catalogManagerService'];

    function sortOptionsComponentCtrl(catalogManagerService) {
        var dvm = this;
        dvm.cm = catalogManagerService;

        dvm.sort = function() {
            dvm.changeSort({sortOption: dvm.sortOption});
        }
    }
    angular.module('catalog')
        .component('sortOptions', sortOptionsComponent);
})();
