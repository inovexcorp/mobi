(function () {
    'use strict';

    /**
     * @ngdoc component
     * @name catalog.component:recordView
     * @requires catalogState.service:cataStateService
     * @requires catalogManager.service:catalogManagerService
     * @requires policyEnforcement.service:policyEnforcementService
     * @requires utilService.service:utilService
     * @requires prefixes.service:prefixes
     *
     * @description
     * `recordView` is a component which creates a div with a Bootstrap `row` containing columns displaying different
     * information about the currently {@link catalogState.service:catalogStateService selected catalog Record}. The
     * first column just contains a button to go back to the {@link catalog.component:catalogPage}. The second column
     * contains a display of the Record's title, description, and {@link catalog.component:recordIcon icon} along with a
     * {@link catalog.component:recordViewTabset}. The third column contains the Record's
     * {@link catalog.component:entityPublisher publisher}, modified date, issued date, and
     * {@link catalog.component:catalogRecordKeywords keywords}. On initialization of the component, it will re-retrieve
     * the Record to ensure that it still exists.
     */
    const recordViewComponent = {
        templateUrl: 'catalog/components/recordView/recordView.component.html',
        bindings: {},
        controllerAs: 'dvm',
        controller: recordViewComponentCtrl
    };

    recordViewComponentCtrl.$inject = ['$q', 'catalogStateService', 'catalogManagerService', 'policyEnforcementService', 'utilService', 'prefixes'];

    function recordViewComponentCtrl($q, catalogStateService, catalogManagerService, policyEnforcementService, utilService, prefixes) {
        var dvm = this;
        var state = catalogStateService;
        var cm = catalogManagerService;
        var pep = policyEnforcementService;
        var util = utilService;
        dvm.record = undefined;
        dvm.title = '';
        dvm.description = '';
        dvm.modified = '';
        dvm.issued = '';
        dvm.canEdit = false;

        dvm.$onInit = function() {
            cm.getRecord(state.selectedRecord['@id'], util.getPropertyId(state.selectedRecord, prefixes.catalog + 'catalog'))
                .then(response => {
                    setInfo(response);
                    dvm.setCanEdit();
                }, () => {
                    util.createWarningToast('The record you were viewing no longer exists');
                    state.selectedRecord = undefined;
                });
        }
        dvm.goBack = function() {
            state.selectedRecord = undefined;
        }
        dvm.updateRecord = function(record) {
            return cm.updateRecord(record['@id'], util.getPropertyId(record, prefixes.catalog + 'catalog'), record)
                .then(() => {
                    util.createSuccessToast('Successfully updated the record');
                    state.selectedRecord = record;
                    setInfo(record);
                }, errorMessage => {
                    util.createErrorToast(errorMessage);
                    return $q.reject();
                });
        }
        dvm.setCanEdit = function() {
            var request = {
                resourceId: dvm.record['@id'],
                actionId: prefixes.policy + 'Update'
            };
            pep.evaluateRequest(request)
                .then(response => {
                    if (response === pep.permit) {
                        dvm.canEdit = true;
                    } else {
                        dvm.canEdit = false;
                    }
                }, () => {
                    util.createWarningToast('Could not retrieve record permissions');
                    dvm.canEdit = false;
                });
        }

        function setInfo(record) {
            dvm.record = angular.copy(record);
            dvm.title = util.getDctermsValue(dvm.record, 'title');
            dvm.description = util.getDctermsValue(dvm.record, 'description') || '(No description)';
            dvm.modified = util.getDate(util.getDctermsValue(dvm.record, 'modified'), 'short');
            dvm.issued = util.getDate(util.getDctermsValue(dvm.record, 'issued'), 'short');
        }
    }

    angular.module('catalog')
        .component('recordView', recordViewComponent);
})();
