
(function() {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordViewTabset
     * @requires catalogManager.service:catalogManagerService
     *
     * @description
     * `recordViewTabset` is a component which creates a {@link materialTabset.directive:materialTabset} with tabs
     * displaying information about the provided catalog Record. These tabs contain a
     * {@link catalog.component.recordMarkdown} and a {@link catalog.component:branchList} if the Record is a 
     * `VersionedRDFRecord`.
     * 
     * @param {Object} record A JSON-LD object for a catalog Record
     * @param {boolean} canEdit Whether the Record can be edited by the current user
     * @param {Function} updateRecord A method to update the Record. Expects a parameter called `record`
     */
    const recordViewTabsetComponent = {
        templateUrl: 'catalog/components/recordViewTabset/recordViewTabset.component.html',
        bindings: {
            record: '<',
            canEdit: '<',
            updateRecord: '&'
        },
        controllerAs: 'dvm',
        controller: recordViewTabsetComponentCtrl
    };

    recordViewTabsetComponentCtrl.$inject = ['catalogManagerService'];

    function recordViewTabsetComponentCtrl(catalogManagerService) {
        var dvm = this;
        var cm = catalogManagerService;
        dvm.isVersionedRDFRecord = false;
        dvm.tabs = {
            overview: true,
            branches: false
        };

        dvm.$onInit = function() {
            dvm.isVersionedRDFRecord = cm.isVersionedRDFRecord(dvm.record);
        }
        dvm.$onChanges = function(changesObj) {
            if (changesObj.record) {
                dvm.isVersionedRDFRecord = cm.isVersionedRDFRecord(changesObj.record.currentValue);
            }
        }
        dvm.updateRecordCall = function(record) {
            return dvm.updateRecord({record});
        }
    }

    angular.module('catalog')
        .component('recordViewTabset', recordViewTabsetComponent);
})();
