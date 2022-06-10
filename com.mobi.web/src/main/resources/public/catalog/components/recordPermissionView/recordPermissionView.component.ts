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
import { map, find, chain, sortBy, isNull, forEach, some } from 'lodash';

import './recordPermissionView.component.scss';

import { Policy } from '../../../shared/models/policy.interface';

const template = require('./recordPermissionView.component.html');

/**
 * @ngdoc component
 * @name recordPermissionView.component:recordPermissionView
 * @requires shared.service:catalogStateService
 * @requires shared.service:utilService
 * @requires shared.service:userManagerService
 * @requires shared.service:recordPermissionsManagerService
 *
 * @description
 * `recordPermissionView` is a component that creates a form to contain a `userAccessControls` module that will
 * control the access controls for a record policy.
 */
const recordPermissionViewComponent = {
    template,
    bindings: {
        resolve: '<',
        close: '&',
        dismiss: '&'
    },
    controllerAs: 'dvm',
    controller: recordPermissionViewComponentCtrl
};

recordPermissionViewComponentCtrl.$inject = ['catalogStateService', 'utilService', 'userManagerService', 'recordPermissionsManagerService']

function recordPermissionViewComponentCtrl(catalogStateService, utilService, userManagerService, recordPermissionsManagerService) {
    const dvm = this;
    dvm.recordId = undefined;
    dvm.policies = [];
    dvm.title = '';

    dvm.$onInit = function() {
        dvm.title = utilService.getDctermsValue(catalogStateService.selectedRecord, 'title');
        dvm.getPolicy(catalogStateService.selectedRecord['@id']);
    }
    dvm.getPolicy = function(recordId: string) {
        recordPermissionsManagerService.getRecordPolicy(recordId)
            .then(responsePolicy => {
                dvm.recordId = recordId;
                return convertResponsePolicy(responsePolicy);
            }, utilService.createErrorToast).then(policies => {
                dvm.policies = policies;
            });
    }
    dvm.hasChanges = function() {
        return some(dvm.policies, 'changed');
    }
    dvm.save = function() {
        if (dvm.hasChanges()) {
            const recordPolicyObject = {}
            forEach(dvm.policies, currentPolicy =>{
                recordPolicyObject[currentPolicy.id] = {
                    everyone: currentPolicy.everyone,
                    users: map(currentPolicy.selectedUsers, user => user.iri),
                    groups: map(currentPolicy.selectedGroups, user => user.iri),
                };
            });
            recordPermissionsManagerService.updateRecordPolicy(dvm.recordId, recordPolicyObject)
                .then(() => {
                    dvm.policies = map(dvm.policies, policyItem => {
                        policyItem.changed = false
                        return policyItem;
                    });
                    utilService.createSuccessToast('Permissions updated');
                }, utilService.createErrorToast);
        }
    }
    dvm.goBack = function() {
        catalogStateService.editPermissionSelectedRecord = false;
    }

    function convertResponsePolicy(responsePolicy){
        const policies = [];
        Object.keys(responsePolicy).forEach(key => {
            const ruleTitle = getRuleTitle(key);
            const ruleInfo = responsePolicy[key];

            let policy: Policy = {
                policy: {},
                id: key,
                changed: false,
                everyone: false,
                selectedUsers: [],
                selectedGroups: [],
                title: ruleTitle
            };

            if (ruleInfo.everyone) {
                policy.everyone = true;
            } else {
                policy.selectedUsers = sortUsers(chain(ruleInfo.users)
                    .map(userIri => find(userManagerService.users, {iri: userIri}))
                    .reject(isNull)
                    .value());
                policy.selectedGroups = sortGroups(chain(ruleInfo.groups)
                    .map(userIri => find(userManagerService.groups, {iri: userIri}))
                    .reject(isNull)
                    .value());
            }
            policies.push(policy);
        });
        return policies;
    }
    function sortUsers(users) {
        return sortBy(users, 'username');
    }
    function sortGroups(groups) {
        return sortBy(groups, 'title');
    }
    function getRuleTitle(ruleId): string {
        switch (ruleId) {
            case 'urn:read':
                return 'View Record';
            case 'urn:delete':  
                return 'Delete Record';
            case 'urn:update':
                return 'Manage Record'
            case 'urn:modify':
                return 'Modify Record';
            case 'urn:modifyMaster':
                return 'Modify Master Branch';
        }
    }
}

export default recordPermissionViewComponent;
