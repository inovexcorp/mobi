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
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { FOAF, USER } from '../../../prefixes';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { User } from '../../../shared/models/user.class';
import { ProfileTabComponent } from './profileTab.component';

describe('Profile Tab component', function() {
    let component: ProfileTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ProfileTabComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                ProfileTabComponent,
                MockComponent(ErrorDisplayComponent)
            ],
            providers: [
                MockProvider(LoginManagerService),
                MockProvider(UserManagerService),
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ProfileTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;

        loginManagerStub.currentUser = 'user';
        userManagerStub.users = [new User({
            '@id': 'user',
            '@type': [`${USER}User`],
            [`${USER}username`]: [{'@value': 'user'}],
            [`${FOAF}firstName`]: [{'@value': 'John'}],
            [`${FOAF}lastName`]: [{'@value': 'Doe'}],
            [`${FOAF}mbox`]: [{'@id': 'mailto:john.doe@test.com'}]
        })];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        loginManagerStub = null;
    });

    describe('should initialize with the current user', function() {
        it('and form values', function() {
            component.ngOnInit();
            expect(component.currentUser).not.toBe(userManagerStub.users[0]);
            expect(component.currentUser).toEqual(userManagerStub.users[0]);
            expect(component.profileForm.controls.firstName.value).toEqual(userManagerStub.users[0].firstName);
            expect(component.profileForm.controls.lastName.value).toEqual(userManagerStub.users[0].lastName);
            expect(component.profileForm.controls.email.value).toEqual(userManagerStub.users[0].email.replace('mailto:', ''));
        });
        it('if user is external', function() {
            const copyUser = cloneDeep(userManagerStub.users[0].jsonld);
            copyUser['@type'].push(`${USER}ExternalUser`);
            userManagerStub.users[0] = new User(copyUser);
            component.ngOnInit();
            expect(component.profileForm.controls.firstName.disabled).toEqual(true);
            expect(component.profileForm.controls.lastName.disabled).toEqual(true);
            expect(component.profileForm.controls.email.disabled).toEqual(true);
        });
    });
    describe('controller methods', function() {
        it('should reset the form', function() {
            Object.keys(component.profileForm.controls).forEach(key => {
                component.profileForm.get(key).markAsDirty();
            });
            Object.keys(component.profileForm.controls).forEach(key => {
                expect(component.profileForm.get(key).dirty).toBeTrue();
            });
            component.reset();
            Object.keys(component.profileForm.controls).forEach(key => {
                expect(component.profileForm.get(key).dirty).toBeFalse();
            });
        });
        describe('should save changes to the user profile', function() {
            beforeEach(function() {
                component.currentUser = userManagerStub.users[0];
                spyOn(component, 'reset');
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.updateUser.and.returnValue(throwError('Error message'));
                component.save();
                tick();
                expect(userManagerStub.updateUser).toHaveBeenCalledWith(loginManagerStub.currentUser, userManagerStub.users[0]);
                expect(component.success).toEqual(false);
                expect(component.errorMessage).toEqual('Error message');
                expect(component.reset).not.toHaveBeenCalled();
            }));
            it('with new values', fakeAsync(function() {
                component.profileForm.setValue({
                    firstName: 'Mal',
                    lastName: 'Reynolds',
                    email: 'mal@serenity.com'
                });
                userManagerStub.updateUser.and.returnValue(of(null));
                component.save();
                tick();
                expect(component.currentUser.jsonld).toEqual(jasmine.objectContaining({
                    [`${FOAF}firstName`]: [{'@value': 'Mal'}],
                    [`${FOAF}lastName`]: [{'@value': 'Reynolds'}],
                    [`${FOAF}mbox`]: [{'@id': 'mailto:mal@serenity.com'}]
                }));
                expect(userManagerStub.updateUser).toHaveBeenCalledWith(loginManagerStub.currentUser, userManagerStub.users[0]);
                expect(component.success).toEqual(true);
                expect(component.errorMessage).toEqual('');
                expect(component.reset).toHaveBeenCalledWith();
            }));
            it('with no values', fakeAsync(function() {
                userManagerStub.updateUser.and.returnValue(of(null));
                component.save();
                tick();
                expect(component.currentUser.jsonld).toEqual({
                    '@id': 'user',
                    '@type': [`${USER}User`],
                    [`${USER}username`]: [{'@value': 'user'}],
                });
                expect(userManagerStub.updateUser).toHaveBeenCalledWith(loginManagerStub.currentUser, userManagerStub.users[0]);
                expect(component.success).toEqual(true);
                expect(component.errorMessage).toEqual('');
                expect(component.reset).toHaveBeenCalledWith();
            }));
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            component.currentUser = userManagerStub.users[0];
            fixture.detectChanges();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.profile-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-6')).length).toEqual(1);
            expect(element.queryAll(By.css('.offset-3')).length).toEqual(1);
        });
        it('with inputs', function() {
            expect(element.queryAll(By.css('input')).length).toEqual(3);
        });
        it('depending on whether the password was saved successfully', function() {
            expect(element.queryAll(By.css('.text-success')).length).toEqual(0);

            component.success = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('.text-success')).length).toEqual(1);
        });
        it('depending on the form validity and dirtiness', function() {
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();

            component.profileForm.controls.email.markAsDirty();
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeFalsy();
            
            component.profileForm.controls.email.setValue('test');
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();
        });
        it('depending on whether the current user is external', function() {
            component.profileForm.controls.firstName.markAsDirty();
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeFalsy();

            const copyUser = cloneDeep(component.currentUser.jsonld);
            copyUser['@type'].push(`${USER}ExternalUser`);
            component.currentUser = new User(copyUser);
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        spyOn(component, 'save');
        const button = element.query(By.css('form'));
        button.triggerEventHandler('ngSubmit', null);
        fixture.detectChanges();
        expect(component.save).toHaveBeenCalledWith();
    });
});
