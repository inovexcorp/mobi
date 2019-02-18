
(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordFilters
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `recordFilters` is a component which creates a div with collapsible containers for various filters that can be
     * performed on catalog Records. Each filter option has a checkbox to indicate whether that filter is active. These
     * filter categories currently only include {@link catalogManager.service:catalogManagerService record types}. The
     * `recordType` will be the selected record type filter, but is one way bound. The `changeFilter` function is
     * expected to update the `recordType` binding.
     * 
     * @param {Function} changeFilter A function that expects a parameter called `recordType` and will be called when
     * the value of the select is changed. This function should update the `recordType` binding.
     * @param {string} recordType The selected record type filter. Should be a catalog Record type string.
     */
    const recordFiltersComponent = {
        templateUrl: 'catalog/components/recordFilters/recordFilters.component.html',
        bindings: {
            changeFilter: '&',
            recordType: '<'
        },
        controllerAs: 'dvm',
        controller: recordFiltersComponentCtrl
    };

    recordFiltersComponentCtrl.$inject = ['catalogManagerService'];

    function recordFiltersComponentCtrl(catalogManagerService) {
        var dvm = this;
        dvm.cm = catalogManagerService;
        dvm.hide = false;
        dvm.recordTypes = [];

        dvm.$onInit = function() {
            dvm.recordTypes = _.map(dvm.cm.recordTypes, type => ({
                value: type,
                checked: type === dvm.recordType
            }));
        }
        dvm.filter = function(filter) {
            if (filter.checked) {
                _.forEach(dvm.recordTypes, typeFilter => {
                    if (typeFilter.value !== filter.value) {
                        typeFilter.checked = false;
                    }
                });
                dvm.changeFilter({recordType: filter.value});
            } else {
                if (dvm.recordType === filter.value) {
                    dvm.changeFilter({recordType: ''});
                }
            }
        }
    }

    angular.module('catalog')
        .component('recordFilters', recordFiltersComponent);
})();