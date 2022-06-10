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

const template = require('./manageRecordButton.component.html');

/**
 * @ngdoc component
 * @name catalog.component:manageRecordButton
 * @requires shared.service:policyEnforcementService
 * @requires shared.service:policyManagerService
 *
 * @description
 * `manageRecordButton` is a component which creates an Open Record button that will open the provided record in the
 * appropriate module.
 * 
 * @param {Object} record The record to open
 * @param {string} flat Whether the button should be flat. The presence of the attribute is enough to set it
 * @param {string} stopProp Whether propagation should be stopped on click event. The presence of the attribute is enough to set it
 */
const manageRecordButtonComponent = {
    template,
    bindings: {
        record: '<',
        flat: '@',
        stopProp: '@',
        manageEvent: '&'
    },
    controllerAs: 'dvm',
    controller: manageRecordButtonComponentCtrl
};

manageRecordButtonComponentCtrl.$inject = ['policyEnforcementService', 'policyManagerService'];

function manageRecordButtonComponentCtrl(policyEnforcementService, policyManagerService) {
    const dvm = this;

    dvm.record = undefined;
    dvm.stopPropagation = false;
    dvm.recordType = '';
    dvm.isFlat = false;
    dvm.showButton = false;

    dvm.$onInit = function() {
        update();
    }
    dvm.$onChanges = function() {
        update();
    }
    dvm.manageRecord = function(event) {
        if (dvm.stopPropagation) {
            event.stopPropagation();
        }
        dvm.manageEvent();
    }
    function update() {
        dvm.isFlat = dvm.flat !== undefined;
        dvm.stopPropagation = dvm.stopProp !== undefined;
        if (dvm.record !== undefined){
            const managePermissionRequest = {
                resourceId: 'http://mobi.com/policies/record/' + encodeURIComponent(dvm.record['@id']),
                actionId: policyManagerService.actionUpdate
            }
            policyEnforcementService.evaluateRequest(managePermissionRequest).then(decision => {
                dvm.showButton = decision == policyEnforcementService.permit;
            }, () => { 
                dvm.showButton = false;
            });
        } else {
            dvm.showButton = false;
        }
    }
}

export default manageRecordButtonComponent;
