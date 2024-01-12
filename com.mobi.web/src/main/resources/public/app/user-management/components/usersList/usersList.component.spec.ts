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
import { By } from '@angular/platform-browser';
import { MockPipe, MockProvider } from 'ng-mocks';
import { cloneDeep } from 'lodash';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { User } from '../../../shared/models/user.class';
import { HighlightTextPipe } from '../../../shared/pipes/highlightText.pipe';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { FOAF, USER } from '../../../prefixes';
import { UsersListComponent } from './usersList.component';

describe('Users List component', function() {
    let component: UsersListComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<UsersListComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let user: User;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [
                UsersListComponent,
                MockPipe(HighlightTextPipe)
            ],
            providers: [
                MockProvider(UserManagerService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UsersListComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;

        user = new User({
            '@id': 'batman',
            '@type': [`${USER}User`],
            [`${USER}username`]: [{ '@value': 'batman' }],
            [`${FOAF}firstName`]: [{ '@value': 'BATMAN' }],
            [`${FOAF}lastName`]: [{ '@value': 'DUH' }],
            [`${FOAF}mbox`]: [{ '@id': 'mailto:iambatman@test.com' }],
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        user = null;
    });

    describe('controller methods', function() {
        it('provide tracking info for the list', function() {
            expect(component.trackByFn(0, user)).toEqual(user.username);
        });
        it('should handle clicking a group', function() {
            spyOn(component.clickEvent, 'emit');
            component.clickUser(user);
            expect(component.clickEvent.emit).toHaveBeenCalledWith(user);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.users-list')).length).toEqual(1);
        });
        it('depending on how many users there are', function() {
            expect(element.queryAll(By.css('li')).length).toEqual(0);

            component.users = [user];
            fixture.detectChanges();
            expect(element.queryAll(By.css('li')).length).toEqual(component.users.length);
        });
        it('depending on which user is selected', function() {
            component.users = [user];
            fixture.detectChanges();
            const userLink = element.query(By.css('li a'));
            expect(userLink.classes.active).toBeFalsy();

            component.selectedUser = user;
            fixture.detectChanges();
            expect(userLink.classes.active).toEqual(true);
        });
        it('depending on whether the user in the list is an admin', function() {
            component.users = [user];
            userManagerStub.isAdmin.and.returnValue(false);
            fixture.detectChanges();
            expect(element.queryAll(By.css('li .admin')).length).toBe(0);

            userManagerStub.isAdmin.and.returnValue(true);
            fixture.detectChanges();
            expect(element.queryAll(By.css('li .admin')).length).toBe(1);
        });
        it('depending on whether a user is external', function() {
            const copyUser = cloneDeep(user.jsonld);
            copyUser['@type'].push(`${USER}ExternalUser`);
            component.users = [new User(copyUser)];
            fixture.detectChanges();
            const item = element.query(By.css('li'));
            expect(item.classes.external).toEqual(true);
        });
    });
    it('should call clickUser when a group is clicked', function() {
        component.users = [user];
        fixture.detectChanges();
        spyOn(component, 'clickUser');

        const userLink = element.query(By.css('li a'));
        userLink.triggerEventHandler('click', null);
        expect(component.clickUser).toHaveBeenCalledWith(user);
    });
});
