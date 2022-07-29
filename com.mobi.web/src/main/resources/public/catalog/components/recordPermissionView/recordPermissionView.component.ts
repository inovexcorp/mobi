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
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.interface';
import { Component, Inject, Input, OnInit, Output } from '@angular/core';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';

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
@Component({
   templateUrl: './recordPermissionView.component.html',
   selector: 'record-permission-view'
})
export class RecordPermissionViewComponent implements OnInit {
    @Input() resolve;
    @Output() close;
    @Output() dismiss;
    recordId = undefined;
    policies = [];
    title = '';

    constructor(public state: CatalogStateService,
        public ums: UserManagerService,
        @Inject('recordPermissionsManagerService') public rps, 
        @Inject('utilService') public utilService){}

    ngOnInit() {
        this.title = this.utilService.getDctermsValue(this.state.selectedRecord, 'title');
        this.getPolicy(this.state.selectedRecord['@id']);
    }

    getPolicy(recordId: string) {
        this.rps.getRecordPolicy(recordId)
            .then(responsePolicy => {
                this.recordId = recordId;
                return this.convertResponsePolicy(responsePolicy);
            }, this.utilService.createErrorToast).then(policies => {
                this.policies = policies;
            });
    }
    public hasChanges() {
        return some(this.policies, 'changed');
    }
    public save() {
        if (this.hasChanges()) {
            const recordPolicyObject = {}
            forEach(this.policies, currentPolicy =>{
                recordPolicyObject[currentPolicy.id] = {
                    everyone: currentPolicy.everyone,
                    users: map(currentPolicy.selectedUsers, user => user.iri),
                    groups: map(currentPolicy.selectedGroups, user => user.iri),
                };
            });
            this.rps.updateRecordPolicy(this.recordId, recordPolicyObject)
                .then(() => {
                    this.policies = map(this.policies, policyItem => {
                        policyItem.changed = false;
                        return policyItem;
                    });
                    this.utilService.createSuccessToast('Permissions updated');
                }, this.utilService.createErrorToast);
        }
    }
    goBack() {
        this.state.editPermissionSelectedRecord = false;
    }
    private convertResponsePolicy(responsePolicy: [any]) {
        const policies = [];
        Object.keys(responsePolicy).forEach(key => {
            const ruleTitle = this.getRuleTitle(key);
            const ruleInfo = responsePolicy[key];

            const policy: Policy = {
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
                policy.selectedUsers = this.sortUsers(chain(ruleInfo.users)
                    .map(userIri => find(this.ums.users, {iri: userIri}))
                    .reject(isNull)
                    .value());
                policy.selectedGroups  = this.sortGroups(chain(ruleInfo.groups)
                    .map(userIri => find(this.ums.groups, {iri: userIri}))
                    .reject(isNull)
                    .value());
            }
            policies.push(policy);
        });
        return policies;
    }
    private sortUsers(users) {
        return sortBy(users, 'username');
    }
    private sortGroups(groups) {
        return sortBy(groups, 'title');
    }
    private getRuleTitle(ruleId): string {
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
