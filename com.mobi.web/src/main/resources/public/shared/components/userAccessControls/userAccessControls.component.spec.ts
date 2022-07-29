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

import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM, mockLoginManager } from '../../../../../../test/ts/Shared';
import { USER, XSD } from '../../../prefixes';
import { Group } from '../../models/group.interface';
import { Policy } from '../../models/policy.interface';
import { User } from '../../models/user.interface';
import { PolicyManagerService } from '../../services/policyManager.service';
import { UserManagerService } from '../../services/userManager.service';
import { UserAccessControlsComponent } from './userAccessControls.component';

describe('User Access Controls component', function() {
    let component: UserAccessControlsComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UserAccessControlsComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let policyManagerStub: jasmine.SpyObj<PolicyManagerService>;
    let loginManagerStub;
    let everyoneMatch;
    let userMatch;
    let groupMatch;
    let user: User;
    let group: Group;
    let policy: Policy;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                ReactiveFormsModule,
                MatSlideToggleModule,
                MatAutocompleteModule,
                MatInputModule,
                MatFormFieldModule,
                NoopAnimationsModule
            ],
            declarations: [
                UserAccessControlsComponent
            ],
            providers: [
                MockProvider(PolicyManagerService),
                MockProvider(UserManagerService),
                { provide: 'loginManagerService', useClass: mockLoginManager }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(UserAccessControlsComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        policyManagerStub = TestBed.get(PolicyManagerService);
        userManagerStub = TestBed.get(UserManagerService);
        loginManagerStub = TestBed.get('loginManagerService');

        everyoneMatch = {
            AttributeDesignator: {
                AttributeId: USER + 'hasUserRole',
                Category: policyManagerStub.subjectCategory,
                DataType: XSD + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['http://mobi.com/roles/user'],
                otherAttributes: {},
                DataType: XSD + 'string'
            },
            MatchId: policyManagerStub.stringEqual
        };
        userMatch = {
            AttributeDesignator: {
                AttributeId: policyManagerStub.subjectId,
                Category: policyManagerStub.subjectCategory,
                DataType: XSD + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['user1'],
                otherAttributes: {},
                DataType: XSD + 'string'
            },
            MatchId: policyManagerStub.stringEqual
        };
        groupMatch = {
            AttributeDesignator: {
                AttributeId: component.groupAttributeId,
                Category: policyManagerStub.subjectCategory,
                DataType: XSD + 'string',
                MustBePresent: true
            },
            AttributeValue: {
                content: ['group1'],
                otherAttributes: {},
                DataType: XSD + 'string'
            },
            MatchId: policyManagerStub.stringEqual
        };

        user = {
            iri: 'user1',
            username: 'user1',
            firstName: 'User',
            lastName: '1',
            email: '',
            roles: [],
            external: false
        };
        userManagerStub.users = [user];
        group = {
            iri: 'group1',
            title: 'group1',
            external: false,
            description: '',
            roles: [],
            members: []
        };
        userManagerStub.groups = [group];
        policy = {
            id: 'policy',
            title: 'Policy',
            changed: false,
            everyone: false,
            selectedUsers: [],
            selectedGroups: [],
            policy: {}
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        policyManagerStub = null;
        userManagerStub = null;
        everyoneMatch = null;
        userMatch = null;
        groupMatch = null;
        user = null;
        group = null;
        policy = null;
    });

    describe('should correctly initialize the component', function() {
        beforeEach(function() {
            spyOn(component, 'setUsers');
            spyOn(component, 'setGroups');
            userManagerStub.filterUsers.and.returnValue([user]);
            userManagerStub.filterGroups.and.returnValue([group]);
            component.item = policy;
        });
        it('if the rule is for everyone', function() {
            policy.everyone = true;
            component.ngOnInit();
            expect(component.userSearchControl).toBeDefined();
            expect(component.userSearchControl.disabled).toBeTrue();
            component.filteredAvailableUsers.subscribe(response => {
                expect(response).toEqual([user]);
            });
            expect(component.groupSearchControl).toBeDefined();
            expect(component.groupSearchControl.disabled).toBeTrue();
            component.filteredAvailableGroups.subscribe(response => {
                expect(response).toEqual([group]);
            });
            expect(component.setUsers).toHaveBeenCalled();
            expect(component.setGroups).toHaveBeenCalled();
        });
        it('if the rule is not for everyone', function() {
            component.ngOnInit();
            expect(component.userSearchControl).toBeDefined();
            expect(component.userSearchControl.disabled).toBeFalse();
            component.filteredAvailableUsers.subscribe(response => {
                expect(response).toEqual([user]);
            });
            expect(component.groupSearchControl).toBeDefined();
            expect(component.groupSearchControl.disabled).toBeFalse();
            component.filteredAvailableGroups.subscribe(response => {
                expect(response).toEqual([group]);
            });
            expect(component.setUsers).toHaveBeenCalled();
            expect(component.setGroups).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should set the users list', function() {
            policy.selectedUsers = [user];
            component.item = policy;
            const batman: User = {
                username: 'batman',
                firstName: 'Bruce',
                lastName: 'Wayne',
                email: '',
                roles: [],
                external: false
            };
            userManagerStub.users.push(batman);
            component.setUsers();
            expect(component.availableUsers).toEqual([batman]);
        });
        it('should set the groups lists', function() {
            policy.selectedGroups = [group];
            component.item = policy;
            const superheroes: Group = {
                title: 'Superheroes',
                description: '',
                roles: [],
                members: [],
                external: false
            };
            userManagerStub.groups.push(superheroes);
            component.setGroups();
            expect(component.availableGroups).toEqual([superheroes]);
        });
        // The following test was intermittently failing. Should be fixed and readded.
        // it('should handle selecting a user', fakeAsync(function() {
        //     spyOn(component, 'addUser');
        //     spyOn(component, 'setUsers');
        //     userManagerStub.filterUsers.and.returnValue([user]);
        //     component.item = policy;
        //     component.ngOnInit();
        //     fixture.detectChanges();
        //     fixture.whenStable();
        //     tick();
        //     component.userTrigger.openPanel();
        //     fixture.detectChanges();
        //     tick();
        //     spyOn(component.userTrigger, 'openPanel').and.callThrough(); // After initial call so test is accurate
        //     const option = document.querySelectorAll('mat-option');
        //     expect(option.length).toEqual(1);
        //     (option[0] as HTMLElement).click();
        //     fixture.detectChanges();
        //     fixture.whenStable();
        //     flush();
        //     expect(component.addUser).toHaveBeenCalledWith(user);
        //     expect(component.setUsers).toHaveBeenCalled();
        //     expect(component.userSearchControl.value).toEqual('');
        //     expect(component.userTrigger.openPanel).toHaveBeenCalled();
           
        // }));
        describe('should add a user to a policy', function() {
            beforeEach(function() {
                component.item = policy;
            });
            it('if a rule ID is provided', function() {
                component.ruleId = policy.id;
                component.addUser(user);
                expect(policy.selectedUsers).toContain(user);
                expect(policy.policy).toEqual({});
                expect(policy.changed).toBeTrue();
            });
            it('if a rule ID is not provided', function() {
                policy.policy = {
                    Rule: [{Target: {AnyOf: [{AllOf: []}]}}]
                };
                component.addUser(user);
                expect(policy.selectedUsers).toContain(user);
                expect(policy.changed).toBeTrue();
                expect(policy.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([{Match: [userMatch]}]);
            });
        });
        describe('should remove a user from a policy', function() {
            beforeEach(function() {
                component.item = policy;
                policy.selectedUsers = [user];
                spyOn(component, 'setUsers');
            });
            it('if a rule ID is provided', function() {
                component.ruleId = policy.id;
                component.removeUser(user);
                expect(policy.selectedUsers).toEqual([]);
                expect(component.setUsers).toHaveBeenCalled();
                expect(policy.policy).toEqual({});
                expect(policy.changed).toBeTrue();
            });
            it('if a rule ID is not provided', function() {
                component.item.policy = {
                    Rule: [{Target: {AnyOf: [{AllOf: [{Match: [userMatch]}]}]}}]
                };
                component.removeUser(user);
                expect(policy.selectedUsers).toEqual([]);
                expect(component.setUsers).toHaveBeenCalled();
                expect(policy.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([]);
                expect(policy.changed).toBeTrue();
            });
        });
        it('should handle selecting a group', async function() {
            spyOn(component, 'addGroup');
            spyOn(component, 'setGroups');
            userManagerStub.filterGroups.and.returnValue([group]);
            component.item = policy;
            component.ngOnInit();
            fixture.detectChanges();
            await fixture.whenStable();

            component.groupTrigger.openPanel();
            fixture.detectChanges();
            spyOn(component.groupTrigger, 'openPanel').and.callThrough(); // After initial call so test is accurate
            const option = document.querySelectorAll('mat-option');
            expect(option.length).toEqual(1);
            (option[0] as HTMLElement).click();
            fixture.whenStable().then(() => {
                expect(component.addGroup).toHaveBeenCalledWith(group);
                expect(component.setGroups).toHaveBeenCalled();
                expect(component.groupSearchControl.value).toEqual('');
                expect(component.groupTrigger.openPanel).toHaveBeenCalled();
            });
        });
        describe('should add a group to a policy', function() {
            beforeEach(function() {
                component.item = policy;
            });
            it('if a rule ID is provided', function() {
                component.ruleId = policy.id;
                component.addGroup(group);
                expect(policy.selectedGroups).toContain(group);
                expect(policy.changed).toBeTrue();
                expect(policy.policy).toEqual({});
            });
            it('if a rule ID is not provided', function() {
                policy.policy = {
                    Rule: [{Target: {AnyOf: [{AllOf: []}]}}]
                };
                component.addGroup(group);
                expect(policy.selectedGroups).toContain(group);
                expect(policy.changed).toBeTrue();
                expect(policy.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([{Match: [groupMatch]}]);
            });
        });
        describe('should remove a group from a policy', function() {
            beforeEach(function() {
                component.item = policy;
                policy.selectedGroups = [group];
                spyOn(component, 'setGroups');
            });
            it('if a rule ID is provided', function() {
                component.ruleId = policy.id;
                component.removeGroup(group);
                expect(policy.selectedGroups).toEqual([]);
                expect(component.setGroups).toHaveBeenCalled();
                expect(policy.policy).toEqual({});
                expect(policy.changed).toBeTrue();
            });
            it('if a rule ID is not provided', function() {
                policy.policy = {
                    Rule: [{Target: {AnyOf: [{AllOf: [{Match: [groupMatch]}]}]}}]
                };
                component.removeGroup(group);
                expect(policy.selectedGroups).toEqual([]);
                expect(component.setGroups).toHaveBeenCalled();
                expect(policy.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([]);
                expect(policy.changed).toBeTrue();
            });
        });
        describe('should properly toggle everyone to', function() {
            beforeEach(function() {
                component.item = policy;
                spyOn(component, 'setUsers');
                spyOn(component, 'setGroups');
                component.userSearchControl.setValue('test');
                component.groupSearchControl.setValue('test');
            });
            describe('true', function() {
                beforeEach(function() {
                    policy.everyone = true;
                    policy.selectedUsers = [user];
                    policy.selectedGroups = [group];
                });
                it('if a rule ID is provided', function() {
                    component.ruleId = policy.id;
                    component.toggleEveryone();
                    expect(component.userSearchControl.value).toEqual('');
                    expect(component.userSearchControl.disabled).toBeTrue();
                    expect(component.groupSearchControl.value).toEqual('');
                    expect(component.groupSearchControl.disabled).toBeTrue();
                    expect(component.item.selectedUsers).toEqual([]);
                    expect(component.item.selectedGroups).toEqual([]);
                    expect(component.setUsers).toHaveBeenCalled();
                    expect(component.setGroups).toHaveBeenCalled();
                    expect(policy.policy).toEqual({});
                    expect(policy.changed).toBeTrue();
                });
                it('if a rule ID is not provided', function() {
                    policy.policy = {
                        Rule: [{Target: { AnyOf: [{AllOf: [{Match: [userMatch]}, {Match: [groupMatch]}]}]}}]
                    };
                    component.toggleEveryone();
                    expect(component.userSearchControl.value).toEqual('');
                    expect(component.userSearchControl.disabled).toBeTrue();
                    expect(component.groupSearchControl.value).toEqual('');
                    expect(component.groupSearchControl.disabled).toBeTrue();
                    expect(component.item.selectedUsers).toEqual([]);
                    expect(component.item.selectedGroups).toEqual([]);
                    expect(component.setUsers).toHaveBeenCalled();
                    expect(component.setGroups).toHaveBeenCalled();
                    expect(policy.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([{Match: [everyoneMatch]}]);
                    expect(policy.changed).toBeTrue();
                });
            });
            describe('false', function() {
                beforeEach(function() {
                    policy.everyone = false;
                    spyOn(component, 'addUser');
                    loginManagerStub.currentUserIRI = user.iri;
                });
                it('if a rule ID is provided', function() {
                    component.ruleId = policy.id;
                    component.toggleEveryone();
                    expect(component.userSearchControl.value).toEqual('');
                    expect(component.userSearchControl.disabled).toBeFalse();
                    expect(component.groupSearchControl.value).toEqual('');
                    expect(component.groupSearchControl.disabled).toBeFalse();
                    expect(component.addUser).toHaveBeenCalledWith(user);
                    expect(component.setUsers).toHaveBeenCalled();
                    expect(policy.policy).toEqual({});
                    expect(policy.changed).toBeTrue();
                });
                it('if a rule ID is not provided', function() {
                    policy.policy = {
                        Rule: [{Target: { AnyOf: [{AllOf: [{Match: [everyoneMatch]}]}]}}]
                    };
                    component.toggleEveryone();
                    expect(component.userSearchControl.value).toEqual('');
                    expect(component.userSearchControl.disabled).toBeFalse();
                    expect(component.groupSearchControl.value).toEqual('');
                    expect(component.groupSearchControl.disabled).toBeFalse();
                    expect(component.addUser).toHaveBeenCalledWith(user);
                    expect(component.setUsers).toHaveBeenCalled();
                    expect(policy.policy.Rule[0].Target.AnyOf[0].AllOf).toEqual([]);
                    expect(policy.changed).toBeTrue();
                });
            });
        });
        it('should get the title of a group to display with', function() {
            expect(component.getTitle(group)).toEqual(group.title);
            expect(component.getTitle(undefined)).toEqual('');
        });
        it('should get the name of a user to display with', function() {
            userManagerStub.getUserDisplay.and.returnValue('test');
            expect(component.getName(user)).toEqual('test');
            userManagerStub.getUserDisplay.and.returnValue('[Not Available]');
            expect(component.getName(user)).toEqual('');
        });
    });
    describe('should set the filtered list of users', function() {
        beforeEach(function() {
            component.availableUsers = [user];
            userManagerStub.filterUsers.and.returnValue([user]);
            spyOn(component, 'setUsers');
            spyOn(component, 'setGroups');
            component.item = policy;
            component.ngOnInit();
            fixture.detectChanges();
        });
        it('if the filter is a string', function() {
            component.userSearchControl.setValue('test');
            fixture.detectChanges();
            expect(userManagerStub.filterUsers).toHaveBeenCalledWith(userManagerStub.users, 'test');
            component.filteredAvailableUsers.subscribe(response => {
                expect(response).toEqual([user]);
            });
        });
        it('if the filter is an object', function() {
            component.userSearchControl.setValue(user);
            fixture.detectChanges();
            expect(userManagerStub.filterUsers).toHaveBeenCalledWith(userManagerStub.users, user.username);
            component.filteredAvailableUsers.subscribe(response => {
                expect(response).toEqual([user]);
            });
        });
    });
    describe('should set the filtered list of groups', function() {
        beforeEach(function() {
            component.availableGroups = [group];
            userManagerStub.filterGroups.and.returnValue([group]);
            spyOn(component, 'setUsers');
            spyOn(component, 'setGroups');
            component.item = policy;
            component.ngOnInit();
            fixture.detectChanges();
        });
        it('if the filter is a string', function() {
            component.groupSearchControl.setValue('test');
            fixture.detectChanges();
            expect(userManagerStub.filterGroups).toHaveBeenCalledWith(userManagerStub.groups, 'test');
            component.filteredAvailableGroups.subscribe(response => {
                expect(response).toEqual([group]);
            });
        });
        it('if the filter is an object', function() {
            component.groupSearchControl.setValue(group);
            fixture.detectChanges();
            expect(userManagerStub.filterGroups).toHaveBeenCalledWith(userManagerStub.groups, group.title);
            component.filteredAvailableGroups.subscribe(response => {
                expect(response).toEqual([group]);
            });
        });
    });
    it('should call removeUser when the link is clicked', function() {
        component.item = policy;
        policy.selectedUsers = [user];
        fixture.detectChanges();
        spyOn(component, 'removeUser');
        const link = element.query(By.css('.row .selected-items .selected-item a'));
        link.triggerEventHandler('click', null);
        expect(component.removeUser).toHaveBeenCalledWith(user);
    });
    it('should call removeGroup when the link is clicked', function() {
        component.item = policy;
        policy.selectedGroups = [group];
        fixture.detectChanges();
        spyOn(component, 'removeGroup');
        const link = element.query(By.css('.row .selected-items .selected-item a'));
        link.triggerEventHandler('click', null);
        expect(component.removeGroup).toHaveBeenCalledWith(group);
    });
});
