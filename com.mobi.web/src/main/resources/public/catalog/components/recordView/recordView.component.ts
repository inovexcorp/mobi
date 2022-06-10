/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import * as angular from 'angular';
import { find } from 'lodash';

import './recordView.component.scss';

const template = require('./recordView.component.html');

/**
 * @ngdoc component
 * @name catalog.component:recordView
 * @requires shared.service:catalogStateService
 * @requires shared.service:catalogManagerService
 * @requires shared.service:ontologyStateService
 * @requires shared.service:policyEnforcementService
 * @requires shared.service:utilService
 * @requires shared.service:prefixes
 *
 * @description
 * `recordView` is a component which creates a div with a Bootstrap `row` containing columns displaying different
 * information about the currently {@link shared.service:catalogStateService selected catalog Record}. The
 * first column just contains a button to go back to the {@link catalog.component:catalogPage}. The second column
 * contains a display of the Record's title, description, and {@link catalog.component:recordIcon icon} along with a
 * {@link catalog.component:recordViewTabset}. The third column contains the Record's
 * {@link catalog.component:entityPublisher publisher}, modified date, issued date, and
 * {@link catalog.component:catalogRecordKeywords keywords}. On initialization of the component, it will re-retrieve
 * the Record to ensure that it still exists.
 */
const recordViewComponent = {
    template,
    bindings: {},
    controllerAs: 'dvm',
    controller: recordViewComponentCtrl
};

recordViewComponentCtrl.$inject = ['$q', 'catalogStateService', 'catalogManagerService', 'ontologyStateService', 'policyEnforcementService', 'utilService', 'prefixes'];

function recordViewComponentCtrl($q, catalogStateService, catalogManagerService, ontologyStateService, policyEnforcementService, utilService, prefixes) {
    const dvm = this;
    const state = catalogStateService;
    const pep = policyEnforcementService;

    dvm.record = undefined;
    dvm.completeRecord = undefined;
    dvm.title = '';
    dvm.description = '';
    dvm.modified = '';
    dvm.issued = '';
    dvm.canEdit = false;
    
    dvm.$onInit = function() {
        const recordCatalogId = utilService.getPropertyId(state.selectedRecord, prefixes.catalog + 'catalog');
        catalogManagerService.getRecord(state.selectedRecord['@id'], recordCatalogId)
            .then(responseRecord => {
                setInfo(responseRecord);
                dvm.setCanEdit();
            }, (errorMessage) => {
                utilService.createErrorToast(errorMessage);
                state.selectedRecord = undefined;
            });
    }
    dvm.goBack = function() {
        state.selectedRecord = undefined;
    }
    dvm.updateRecord = function(newRecord) {
        const indexToUpdate = dvm.completeRecord.findIndex(oldRecord => oldRecord['@id'] === newRecord['@id']);
        if (indexToUpdate !== -1) {
            dvm.completeRecord[indexToUpdate] = newRecord;
        } else {
            utilService.createErrorToast("Could not find record: " + newRecord['@id']);
        }
        
        const recordCatalogId = utilService.getPropertyId(newRecord, prefixes.catalog + 'catalog');
        return catalogManagerService.updateRecord(newRecord['@id'], recordCatalogId, dvm.completeRecord)
            .then((response) => {
                setInfo(response);
                utilService.createSuccessToast('Successfully updated the record');
                state.selectedRecord = newRecord;
            }, errorMessage => {
                utilService.createErrorToast(errorMessage);
                return $q.reject();
            });
    }
    dvm.updateTitle = function(newTitle) {
        const openRecord = find(ontologyStateService.list, item => item.ontologyRecord.title === dvm.title);
        if (openRecord) {
            openRecord.ontologyRecord.title = newTitle;
        }
        utilService.updateDctermsValue(dvm.record, 'title', newTitle);
        return dvm.updateRecord(dvm.record);
    }
    dvm.updateDescription = function(newDescription) {
        utilService.updateDctermsValue(dvm.record, 'description', newDescription);
        return dvm.updateRecord(dvm.record);
    }
    dvm.setCanEdit = function() {
        const request = {
            resourceId: dvm.record['@id'],
            actionId: prefixes.policy + 'Update'
        };
        pep.evaluateRequest(request)
            .then(response => {
                dvm.canEdit = response !== pep.deny;
            }, () => {
                utilService.createWarningToast('Could not retrieve record permissions');
                dvm.canEdit = false;
            });
    }
    dvm.manageEvent = function(){
        state.editPermissionSelectedRecord = true;
    }

    function setInfo(record) {
        dvm.completeRecord = angular.copy(record);
        dvm.record = find(record, ['@id', state.selectedRecord['@id']]);;
        dvm.title = utilService.getDctermsValue(dvm.record, 'title');
        dvm.description = utilService.getDctermsValue(dvm.record, 'description');
        dvm.modified = utilService.getDate(utilService.getDctermsValue(dvm.record, 'modified'), 'short');
        dvm.issued = utilService.getDate(utilService.getDctermsValue(dvm.record, 'issued'), 'short');
    }

}

export default recordViewComponent;
