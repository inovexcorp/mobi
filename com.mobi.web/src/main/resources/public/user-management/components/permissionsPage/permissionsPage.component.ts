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
import { Component, Inject, OnInit } from '@angular/core';
import { get, map, filter, forEach, some, chain, find, sortBy, isNull, head, isUndefined} from 'lodash';

import { FOAF, RDF, USER } from '../../../prefixes';
import { Group } from '../../../shared/models/group.interface';
import { Policy } from '../../../shared/models/policy.interface';
import { User } from '../../../shared/models/user.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { UserManagerService } from '../../../shared/services/userManager.service';

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
    policiesInQuestion = [];

    constructor(private pm: PolicyManagerService, private cm: CatalogManagerService, 
        @Inject('utilService') private util, private um: UserManagerService) {}
    
    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.setPoliciesInQuestion();
        this.setPolicies();
    }
    reset(): void {
        this.ngOnInit();
    }
    saveChanges(): void {
        const changedPolicies = filter(this.policies, 'changed');
        Promise.all(map(changedPolicies, item => this.pm.updatePolicy(item.policy)))
            .then(() => {
                forEach(changedPolicies, item => item.changed = false);
                this.util.createSuccessToast('Permissions updated');
            }, this.util.createErrorToast);
    }
    hasChanges(): boolean {
        return some(this.policies, 'changed');
    }

    private setPoliciesInQuestion(): void {
        this.policiesInQuestion = [];
        this.policiesInQuestion.push({ resourceId: this.catalogId, actionId: this.pm.actionCreate, subjectId: undefined, titleFunc: policy => 'Create ' + this.util.getBeautifulIRI(this.getRecordType(policy)) });
        this.policiesInQuestion.push({ resourceId: this.systemRepoId, actionId: this.pm.actionRead, subjectId: undefined, titleFunc: () => 'Query System Repo' });
    }
    private setPolicies(): void {
        this.policies = [];
        Promise.all(map(this.policiesInQuestion, policy => this.pm.getPolicies(policy.resourceId, policy.subjectId, policy.actionId)))
                .then(results => {
                    results.forEach((response, idx) => {
                        this.policies = this.policies.concat(chain(response)
                            .map(policy => ({
                                policy,
                                id: policy.PolicyId,
                                title: this.policiesInQuestion[idx].titleFunc(policy),
                                changed: false,
                                everyone: false,
                                selectedUsers: [],
                                selectedGroups: []
                            }))
                            .filter('title')
                            .forEach(item => this.setInfo(item))
                            .value());
                    });
                }, this.util.createErrorToast);
    }
    private getRecordType(policy) {
        const target = get(policy, 'Target.AnyOf', []);
        const allOfMatch = chain(target)
            .map('AllOf').flatten()
            .map('Match').flatten()
            .find(['AttributeDesignator.AttributeId', RDF + 'type']).value();
        const attributeValue = get(allOfMatch, 'AttributeValue.content', []);
        const value =  head(attributeValue);
        return value;
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
