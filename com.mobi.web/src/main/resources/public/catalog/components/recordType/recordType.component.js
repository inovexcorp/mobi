(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordType
     * @requires catalogManager.service:catalogManagerService
     * @requires utilService.service:utilService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `recordType` is a directive that creates a span with the main type of the provided catalog Record. This type is
     * determined by removing the core Record types from the full list of Record types supported from the
     * {@link catalogManager.service:catalogManagerService} and finding the first one of those types that is present on
     * the provided Record JSON-LD object.
     *
     * @param {Object} record A JSON-LD object for a catalog Record
     */
    const recordTypeComponent = {
        templateUrl: 'catalog/components/recordType/recordType.component.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: recordTypeComponentCtrl
    };

    recordTypeComponentCtrl.$inject = ['catalogManagerService', 'utilService', 'prefixes'];

    function recordTypeComponentCtrl(catalogManagerService, utilService, prefixes) {
        var dvm = this;
        var util = utilService;
        var cm = catalogManagerService;
        dvm.type = '';

        dvm.$onInit = function() {
            dvm.type = getType();
        }
        dvm.$onChanges = function() {
            dvm.type = getType();
        }
        function getType() {
            var type = _.find(_.difference(cm.recordTypes, cm.coreRecordTypes), type => _.includes(_.get(dvm.record, '@type', []), type));
            return util.getBeautifulIRI(type || prefixes.catalog + 'Record');
        }
    }

    angular.module('catalog') 
        .component('recordType', recordTypeComponent);
})();
