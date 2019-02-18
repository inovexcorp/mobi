(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:catalogRecordKeywords
     * @requires prefixes.service:prefixes
     *
     * @description
     * `catalogRecordKeywords` is a component which creates a div with Bootstrap `badge` spans for the keywords on the
     * provided catalog Record. The keywords will be sorted alphabetically.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     */
    const catalogRecordKeywordsComponent = {
        templateUrl: 'catalog/components/catalogRecordKeywords/catalogRecordKeywords.component.html',
        bindings: {
            record: '<'
        },
        controllerAs: 'dvm',
        controller: catalogRecordKeywordsComponentCtrl
    };

    catalogRecordKeywordsComponentCtrl.$inject = ['prefixes'];

    function catalogRecordKeywordsComponentCtrl(prefixes) {
        var dvm = this;
        dvm.keywords = [];

        dvm.$onInit = function() {
            dvm.keywords = getKeywords();
        }
        dvm.$onChanges = function() {
            dvm.keywords = getKeywords();
        }

        function getKeywords() {
            return _.map(_.get(dvm.record, prefixes.catalog + 'keyword', []), '@value').sort();
        }
    }

    angular.module('catalog')
        .component('catalogRecordKeywords', catalogRecordKeywordsComponent);
})();
