
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordIcon
     * @requires catalogState.service:catalogStateService
     *
     * @description
     * `recordIcon` is a component that creates a Font Awesome Icon stack for the provided catalog Record using the
     * {@link catalogState.service:catalogStateService}.
     *
     * @param {object} Record A catalog Record JSON-LD object
     */
    const recordIconComponent = {
        templateUrl: 'catalog/components/recordIcon/recordIcon.component.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: recordIconComponentCtrl
    };

    recordIconComponentCtrl.$inject = ['catalogStateService'];

    function recordIconComponentCtrl(catalogStateService) {
        var dvm = this;
        var state = catalogStateService;
        dvm.icon = '';

        dvm.$onInit = function() {
            dvm.icon = state.getRecordIcon(dvm.record);
        }
        dvm.$onChanges = function(changesObj) {
            dvm.icon = state.getRecordIcon(changesObj.record.currentValue);
        }
    }

    angular.module('catalog')
        .component('recordIcon', recordIconComponent);
})();
