/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { map, find, chain, sortBy, isNull, some } from 'lodash';
import { Component, Input, OnInit, Output } from '@angular/core';

import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Policy } from '../../../shared/models/policy.interface';
import { RecordPermissionsManagerService } from '../../../shared/services/recordPermissionsManager.service';

import { RecordPermissions } from '../../../shared/models/recordPermissions.interface';
import { getDctermsValue } from '../../../shared/utility';

/**
 * @class catalog.RecordPermissionViewComponent
 *
 * @description
 * `recordPermissionView` is a component that creates a form to contain a `userAccessControls` module that will
 * control the access controls for a record policy.
 */
@Component({
   templateUrl: './recordPermissionView.component.html',
   selector: 'record-permission-view',
   styleUrls: ['./recordPermissionView.component.scss']
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
        public rps: RecordPermissionsManagerService, 
        private toast: ToastService) {}

    ngOnInit(): void {
        this.title = getDctermsValue(this.state.selectedRecord, 'title');
        this.getPolicy(this.state.selectedRecord['@id']);
    }

    getPolicy(recordId: string): void {
        this.rps.getRecordPolicy(recordId)
            .subscribe(responsePolicy => {
                this.recordId = recordId;
                this.policies = this.convertResponsePolicy(responsePolicy);
            }, error => this.toast.createErrorToast(error));
    }
    public hasChanges(): boolean {
        return some(this.policies, 'changed');
    }
    public save(): void {
        if (this.hasChanges()) {
            const recordPolicyObject: RecordPermissions = {};
            this.policies.forEach(currentPolicy =>{
                recordPolicyObject[currentPolicy.id] = {
                    everyone: currentPolicy.everyone,
                    users: map(currentPolicy.selectedUsers, user => user.iri),
                    groups: map(currentPolicy.selectedGroups, user => user.iri),
                };
            });
            this.rps.updateRecordPolicy(this.recordId, recordPolicyObject)
                .subscribe(() => {
                    this.policies = map(this.policies, policyItem => {
                        policyItem.changed = false;
                        return policyItem;
                    });
                    this.toast.createSuccessToast('Permissions updated');
                }, error => this.toast.createErrorToast(error));
        }
    }
    goBack(): void {
        this.state.editPermissionSelectedRecord = false;
    }
    private convertResponsePolicy(responsePolicy: RecordPermissions): Policy[] {
        const policies: Policy[] = [];
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
                return 'Manage Record';
            case 'urn:modify':
                return 'Modify Record';
            case 'urn:modifyMaster':
                return 'Modify Master Branch';
        }
    }
}
