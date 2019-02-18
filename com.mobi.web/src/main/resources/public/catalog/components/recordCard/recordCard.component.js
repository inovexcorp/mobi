(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordCard
     * @requires utilService.service:utilService
     *
     * @description
     * `recordCard` is a component which creates a Material `card` div with information about the provided catalog
     * Record. This information includes its title, limited description, {@link catalog.component:recordType type} with
     * its associated {@link catalog.component:recordIcon icon}, modified date,
     * {@link catalog.component:catalogRecordKeywords keywords}, and
     * {@link catalog.component:entityPublisher publisher}. An optional function can be passed in that will be called
     * when the whole card is clicked.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     * @param {Function} [clickCard=undefined] An optional function that will be called when the whole card is clicked
     */
    const recordCardComponent = {
        templateUrl: 'catalog/components/recordCard/recordCard.component.html',
        bindings: {
            record: '<',
            clickCard: '&?'
        },
        controllerAs: 'dvm',
        controller: recordCardComponentCtrl
    };

    recordCardComponentCtrl.$inject = ['utilService'];

    function recordCardComponentCtrl(utilService) {
        var dvm = this;
        var util = utilService;
        dvm.descriptionLimit = 200;
        dvm.title = '';
        dvm.description = '';
        dvm.modified = '';

        dvm.$onInit = function() {
            dvm.title = util.getDctermsValue(dvm.record, 'title');
            dvm.description = util.getDctermsValue(dvm.record, 'description') || '(No description)';
            dvm.modified = util.getDate(util.getDctermsValue(dvm.record, 'modified'), 'short');
        }
    }

    angular.module('catalog')
        .component('recordCard', recordCardComponent);
})();
