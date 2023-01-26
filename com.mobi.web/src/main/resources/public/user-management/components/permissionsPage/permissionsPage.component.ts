/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, OnInit } from '@angular/core';
import { get, map, filter, some, chain, find, sortBy, isNull, isUndefined} from 'lodash';
import { forkJoin } from 'rxjs';

import { FOAF, USER } from '../../../prefixes';
import { Group } from '../../../shared/models/group.interface';
import { Policy } from '../../../shared/models/policy.interface';
import { User } from '../../../shared/models/user.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UtilService } from '../../../shared/services/util.service';

import './permissionsPage.component.scss';

/**
 * @class user-management.PermissionsPageComponent
 *
 * A component that creates a Bootstrap `row` div with functionality to view and update overall permissions from
 * policies retrieved through the {@link shared.PolicyManagerService}. The list is refreshed every time this component
 * is rendered for the first time so any changes made to the policies will reset when navigating away and back.
 * Currently, the list of displayed policies is hardcoded.
 */
@Component({
    selector: 'permissions-page',
    templateUrl: './permissionsPage.component.html'
})
export class PermissionsPageComponent implements OnInit {
    catalogId = '';
    systemRepoId = 'http://mobi.com/system-repo';
    groupAttributeId = 'http://mobi.com/policy/prop-path(' + encodeURIComponent('^<' + FOAF + 'member' + '>') + ')';
    userRole = 'http://mobi.com/roles/user';
    policies: Policy[] = [];

    constructor(private pm: PolicyManagerService, private cm: CatalogManagerService, private util: UtilService,
        private um: UserManagerService) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.setPolicies();
    }
    saveChanges(): void {
        const changedPolicies = filter(this.policies, 'changed');
        forkJoin(map(changedPolicies, item => this.pm.updatePolicy(item.policy)))
            .subscribe(() => {
                changedPolicies.forEach(item => item.changed = false);
                this.util.createSuccessToast('Permissions updated');
            }, error => this.util.createErrorToast(error));
    }
    hasChanges(): boolean {
        return some(this.policies, 'changed');
    }

    private setPolicies(): void {
        this.policies = [];
        this.pm.getPolicies(undefined, undefined, undefined, true)
            .subscribe(results => {
                this.policies = this.policies.concat(chain(results)
                    .map(policy => ({
                        policy,
                        id: policy.PolicyId,
                        title: policy.Description,
                        changed: false,
                        everyone: false,
                        selectedUsers: [],
                        selectedGroups: []
                    }))
                    .filter('title')
                    .forEach(item => this.setInfo(item))
                    .value());
            }, error => this.util.createErrorToast(error));
    }
    private setInfo(item: Policy): void {
        const rules = get(item.policy, 'Rule[0].Target.AnyOf[0].AllOf', []);
        const matches = chain(rules) 
            .map('Match[0]')
            .map(match => ({
                id: get(match, 'AttributeDesignator.AttributeId'),
                value: get(match, 'AttributeValue.content[0]')
            }))
            .value();
        if ( find( matches, { id: USER + 'hasUserRole', value: this.userRole } )) {
            item.everyone = true;
        } else {
            item.selectedUsers = this.sortUsers(chain(matches)
                .filter({ id: this.pm.subjectId })
                .map(obj => find(this.um.users, { iri: obj.value }))
                .reject(isNull)
                .reject(isUndefined)
                .value());
            item.selectedGroups = this.sortGroups(chain(matches)
                .filter({ id: this.groupAttributeId })
                .map(obj => find(this.um.groups, { iri: obj.value }))
                .reject(isNull)
                .reject(isUndefined)
                .value());
        }
    }
    private sortUsers(users: User[]): User[] {
        return sortBy(users, 'username');
    }
    private sortGroups(groups: Group[]): Group[] {
        return sortBy(groups, 'title');
    }
}
