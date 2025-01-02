/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { filter, remove, set, get, find } from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FOAF, USER, XSD } from '../../../prefixes';

import { Group } from '../../models/group.interface';
import { Policy } from '../../models/policy.interface';
import { User } from '../../models/user.class';
import { LoginManagerService } from '../../services/loginManager.service';
import { PolicyManagerService } from '../../services/policyManager.service';
import { UserManagerService } from '../../services/userManager.service';

/**
 * @class shared.UserAccessControlsComponent
 *
 * A component that creates a Bootstrap `row` div with a container for viewing and updating
 * permissions on a Rule of a Policy. The Rule is represented by the provided {@link Policy item}. A `ruleTitle` can be
 * provided to provide context on the Rule. The IRI of the Rule is set with `ruleId`.
 */
@Component({
    selector: 'user-access-controls',
    templateUrl: './userAccessControls.component.html',
    styleUrls: ['./userAccessControls.component.scss']
})
export class UserAccessControlsComponent implements OnInit {
    /**
     * A representation of the Rule that will be edited by this instance of the component
     * {@link Policy}
     */
    @Input() item: Policy;
    /**
     * A string representing the display title of the Rule
     * @type {string}
     */
    @Input() ruleTitle: string;
    /**
     * The Optional IRI id of the Rule
     * @type {string}
     */
    @Input() ruleId?: string;

    @ViewChild('userInput', { read: MatAutocompleteTrigger, static: true }) userTrigger: MatAutocompleteTrigger;
    @ViewChild('groupInput', { read: MatAutocompleteTrigger, static: true }) groupTrigger: MatAutocompleteTrigger;

    groupAttributeId = `http://mobi.com/policy/prop-path(${encodeURIComponent('^<' + FOAF + 'member>')})`;
    userRole = 'http://mobi.com/roles/user';

    userSearchControl: UntypedFormControl = new UntypedFormControl();
    availableUsers: User[] = [];
    filteredAvailableUsers: Observable<User[]>;
    groupSearchControl: UntypedFormControl = new UntypedFormControl();
    availableGroups: Group[] = [];
    filteredAvailableGroups: Observable<Group[]>;

    constructor(private _pm: PolicyManagerService, public lm: LoginManagerService,
        private _um: UserManagerService) { }

    ngOnInit(): void {
        if (this.item && this.item.everyone) {
            this.userSearchControl.disable();
            this.groupSearchControl.disable();
        }
        this.item.selectedUsers = filter(this.item.selectedUsers, user => user !== undefined);
        this.item.selectedGroups = filter(this.item.selectedGroups, group => group !== undefined);
        this.setUsers();
        this.setGroups();
        this.filteredAvailableUsers = this.userSearchControl.valueChanges.pipe(
            startWith<string | User>(''),
            map(val => {
                const searchText = typeof val === 'string' ? 
                    val : 
                    val ? 
                        val.username :
                        undefined;
                return this._um.filterUsers(this.availableUsers, searchText)
                    .filter(user => !this.item.selectedUsers.includes(user));
            })
        );
        this.filteredAvailableGroups = this.groupSearchControl.valueChanges.pipe(
            startWith<string | Group>(''),
            map(val => {
                const searchText = typeof val === 'string' ? 
                    val : 
                    val ? 
                        val.title :
                        undefined;
                return this._um.filterGroups(this.availableGroups, searchText)
                    .filter(group => !this.item.selectedGroups.includes(group));
            })
        );
    }
    setUsers(): void {
        this.availableUsers = this._um.users.filter(user => this.item.selectedUsers.findIndex(selectedUser => selectedUser.iri === user.iri) < 0);
    }
    setGroups(): void {
        this.availableGroups = filter(this._um.groups, group => !find(this.item.selectedGroups, { iri: group.iri }));
    }
    selectUser(event: MatAutocompleteSelectedEvent, auto: MatAutocomplete): void {
        this.addUser(event.option.value);
        setTimeout(() => {
            auto.options.forEach((item) => {
                item.deselect();
            });
            this.setUsers();
            this.userSearchControl.reset('');
            this.userTrigger.openPanel();
        }, 100);
    }
    addUser(user: User): void {
        this.item.selectedUsers.push(user);
        this.item.selectedUsers.sort((user1: User, user2: User) => user1.username.localeCompare(user2.username));
        if (!this.ruleId) {
            this.addUserMatch(user.iri, this.item.policy);
        }
        this.item.changed = true;
    }
    removeUser(user: User): void {
        remove(this.item.selectedUsers, user);
        if (!this.ruleId) {
            this.removeMatch(user.iri, this.item.policy);
        }
        this.setUsers();
        this.userSearchControl.reset('');
        this.item.changed = true;
    }
    selectGroup(event: MatAutocompleteSelectedEvent, auto: MatAutocomplete): void {
        this.addGroup(event.option.value);
        setTimeout(() => {
            auto.options.forEach((item) => {
                item.deselect();
            });
            this.setGroups();
            this.groupSearchControl.reset('');
            this.groupTrigger.openPanel();
        }, 100);
    }
    addGroup(group: Group): void {
        this.item.selectedGroups.push(group);
        this.item.selectedGroups.sort((group1, group2) => group1.title.localeCompare(group2.title));
        if (!this.ruleId) {
            this.addGroupMatch(group.iri, this.item.policy);
        }
        this.item.changed = true;
    }
    removeGroup(group: Group): void {
        remove(this.item.selectedGroups, group);
        if (!this.ruleId) {
            this.removeMatch(group.iri, this.item.policy);
        }
        this.setGroups();
        this.groupSearchControl.reset('');
        this.item.changed = true;
    }
    toggleEveryone(): void {
        if (this.item.everyone) {
            if (!this.ruleId) {
                set(this.item.policy, 'Rule[0].Target.AnyOf[0].AllOf', []);
                this.addMatch(this.userRole, `${USER}hasUserRole`, this.item.policy);
            }
            this.item.selectedUsers = [];
            this.item.selectedGroups = [];
            this.setUsers();
            this.setGroups();
            this.userSearchControl.reset('');
            this.userSearchControl.disable();
            this.groupSearchControl.reset('');
            this.groupSearchControl.disable();
        } else {
            if (!this.ruleId) {
                this.removeMatch(this.userRole, this.item.policy);
            }
            this.addUser(find(this._um.users, { iri: this.lm.currentUserIRI }));
            this.setUsers();
            this.setGroups();
            this.userSearchControl.reset('');
            this.userSearchControl.enable();
            this.groupSearchControl.reset('');
            this.groupSearchControl.enable();
        }
        this.item.changed = true;
    }
    getTitle(group: Group): string {
        return group && group.title ? group.title : '';
    }
    getName = (user: User): string => { // arrow syntax used to preserve `this` keyword
        return user ? user.displayName : '';
    }

    private removeMatch(value: string, policy: any): void {
        remove(get(policy, 'Rule[0].Target.AnyOf[0].AllOf', []), ['Match[0].AttributeValue.content[0]', value]);
    }
    private addUserMatch(value: string, policy: any) {
        this.addMatch(value, this._pm.subjectId, policy);
    }
    private addGroupMatch(value: string, policy: any) {
        this.addMatch(value, this.groupAttributeId, policy);
    }
    private addMatch(value: string, id: string, policy: any) {
        const newMatch = {
            Match: [{
                AttributeValue: {
                    content: [value],
                    otherAttributes: {},
                    DataType: `${XSD}string`
                },
                AttributeDesignator: {
                    Category: this._pm.subjectCategory,
                    AttributeId: id,
                    DataType: `${XSD}string`,
                    MustBePresent: true
                },
                MatchId: this._pm.stringEqual
            }]
        };
        get(policy, 'Rule[0].Target.AnyOf[0].AllOf', []).push(newMatch);
    }
}
