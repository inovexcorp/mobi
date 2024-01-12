/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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

import { MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { User } from '../../../shared/models/user.class';
import { FOAF, USER } from '../../../prefixes';
import { AddMemberButtonComponent } from './addMemberButton.component';

describe('Add Member Button Component', function() {
    let component: AddMemberButtonComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<AddMemberButtonComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let testUser: User;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                MatButtonModule,
                MatMenuModule,
                MatAutocompleteModule,
                MatInputModule,
                MatFormFieldModule,
                NoopAnimationsModule
            ],
            declarations: [
                AddMemberButtonComponent
            ],
            providers: [
                MockProvider(UserManagerService),
                MockProvider(UserStateService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AddMemberButtonComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        userManagerStub.users = [];
        testUser = new User({
            '@id': 'user',
            '@type': [`${USER}User`],
            [`${USER}username`]: [{ '@value': 'username' }],
            [`${FOAF}firstName`]: [{ '@value': 'John' }],
            [`${FOAF}lastName`]: [{ '@value': 'Doe' }],
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        testUser = null;
    });

    describe('controller methods', function() {
        it('should emit the adding of a member', function() {
            spyOn(component.addMember, 'emit');
            spyOn(component, 'clearAddMember');
            spyOn(component.trigger, 'closeMenu');
            component.emitAddMember(testUser);
            expect(component.addMember.emit).toHaveBeenCalledWith(testUser);
            expect(component.clearAddMember).toHaveBeenCalledWith();
            expect(component.trigger.closeMenu).toHaveBeenCalledWith();
        });
        it('should set available members to choose from', function() {
            spyOn(component, 'setFilteredUsers');
            const batman: User = new User({
                '@id': 'batman',
                '@type': [`${USER}User`, `${USER}ExternalUser`],
                [`${USER}username`]: [{ '@value': 'batman' }],
                [`${FOAF}firstName`]: [{ '@value': 'BATMAN' }],
                [`${FOAF}lastName`]: [{ '@value': 'DUH' }],
                [`${FOAF}mbox`]: [{ '@id': 'mailto:iambatman@test.com' }],
            });
            userManagerStub.users = [testUser, batman];
            component.existingMembers = [testUser.username];
            component.setAvailableUsers();
            expect(component.availableUsers).toEqual([batman]);
            expect(component.setFilteredUsers).toHaveBeenCalledWith();
        });
        describe('should set the filtered list of users', function() {
            beforeEach(function() {
                component.availableUsers = [testUser];
                userManagerStub.filterUsers.and.returnValue([testUser]);
            });
            it('if the filter is a string', function() {
                component.userFilter = 'test';
                component.setFilteredUsers();
                expect(component.filteredAvailableUsers).toEqual([testUser]);
                expect(userManagerStub.filterUsers).toHaveBeenCalledWith(component.availableUsers, 'test');
            });
            it('if the filter is an object', function() {
                component.userFilter = {username: 'username'};
                component.setFilteredUsers();
                expect(component.filteredAvailableUsers).toEqual([testUser]);
                expect(userManagerStub.filterUsers).toHaveBeenCalledWith(component.availableUsers, 'username');
            });
            it('if the filter is not set', function() {
                component.setFilteredUsers();
                expect(component.filteredAvailableUsers).toEqual([testUser]);
                expect(userManagerStub.filterUsers).toHaveBeenCalledWith(component.availableUsers, undefined);
            });
        });
        it('should select a member', function() {
            component.selectMember(testUser);
            expect(component.selectedMember).toEqual(testUser);
        });
        it('should cancel the add menu', function() {
            spyOn(component, 'clearAddMember');
            spyOn(component.trigger, 'closeMenu');
            component.cancelAdd();
            expect(component.clearAddMember).toHaveBeenCalledWith();
            expect(component.trigger.closeMenu).toHaveBeenCalledWith();
        });
        it('should clear the add member form', function() {
            component.selectedMember = testUser;
            component.userFilter = 'john';
            component.clearAddMember();
            expect(component.selectedMember).toBeUndefined();
            expect(component.userFilter).toBeUndefined();
        });
        it('should retrieve the display name of a user', function() {
            expect(component.getName(testUser)).toEqual('John Doe');
            expect(component.getName(undefined)).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        it('with a button', function() {
            expect(element.queryAll(By.css('button.add-member-button')).length).toEqual(1);
        });
        it('after clicking the button', function() {
            fixture.detectChanges();
            spyOn(component, 'setAvailableUsers');
            expect(element.queryAll(By.css('.mat-menu-panel')).length).toEqual(0);
            const button = element.query(By.css('button.add-member-button'));
            button.triggerEventHandler('click', null);
            fixture.detectChanges();
            expect(component.setAvailableUsers).toHaveBeenCalledWith();
            expect(element.queryAll(By.css('.mat-menu-panel')).length).toEqual(1);
        });
    });
});
