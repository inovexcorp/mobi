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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { UnmaskPasswordComponent } from '../../../shared/components/unmaskPassword/unmaskPassword.component';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { User } from '../../../shared/models/user.class';
import { FOAF, USER } from '../../../prefixes';
import { PasswordTabComponent } from './passwordTab.component';

describe('Password Tab component', function() {
    let component: PasswordTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PasswordTabComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatButtonModule,
                MatInputModule,
                MatFormFieldModule,
                NoopAnimationsModule
             ],
            declarations: [
                PasswordTabComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(UnmaskPasswordComponent)
            ],
            providers: [
                MockProvider(LoginManagerService),
                MockProvider(UserManagerService),
                MockProvider(ToastService)
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PasswordTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

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
        toastStub = null;
    });

    describe('should initialize with the current user', function() {
        it('and form values', function() {
            component.ngOnInit();
            expect(component.currentUser).toEqual(userManagerStub.users[0]);
            expect(component.passwordForm.controls.currentPassword).toBeTruthy();
            expect(component.passwordForm.controls.unmaskPassword).toBeTruthy();
        });
        it('if user is external', function() {
            const copyUser = cloneDeep(userManagerStub.users[0].jsonld);
            copyUser['@type'].push(`${USER}ExternalUser`);
            userManagerStub.users[0] = new User(copyUser);
            component.ngOnInit();
            expect(component.passwordForm.controls.currentPassword.disabled).toEqual(true);
            expect(component.passwordForm.controls.unmaskPassword.disabled).toEqual(true);
        });
    });
    describe('controller methods', function() {
        it('should reset the form', function() {
            Object.keys(component.passwordForm.controls).forEach(key => {
                const control = component.passwordForm.get(key);
                control.markAsDirty();
                control.setValue('test');
            });
            Object.keys(component.passwordForm.controls).forEach(key => {
                const control = component.passwordForm.get(key);
                expect(control.value).toEqual('test');
                expect(control.dirty).toBeTrue();
            });
            component.reset();
            Object.keys(component.passwordForm.controls).forEach(key => {
                const control = component.passwordForm.get(key);
                expect(control.value).toBeFalsy();
                expect(control.dirty).toBeFalse();
            });
        });
        describe('should save changes to the user password', function() {
            beforeEach(function() {
                component.passwordForm.controls.currentPassword.setValue('test');
                component.passwordForm.controls.unmaskPassword.setValue('new');
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.changePassword.and.returnValue(throwError({error: '', errorMessage: 'Error message', errorDetails: []}));
                component.save();
                tick();
                expect(userManagerStub.changePassword).toHaveBeenCalledWith(loginManagerStub.currentUser, component.passwordForm.controls.currentPassword.value, component.passwordForm.controls.unmaskPassword.value);
                expect(component.errorMessage).toEqual('Error message');
            }));
            it('unless an current password error occurs', fakeAsync(function() {
                userManagerStub.changePassword.and.returnValue(throwError({error: '', errorMessage: 'Current password is invalid', errorDetails: []}));
                component.save();
                tick();
                expect(userManagerStub.changePassword).toHaveBeenCalledWith(loginManagerStub.currentUser, component.passwordForm.controls.currentPassword.value, component.passwordForm.controls.unmaskPassword.value);
                expect(component.errorMessage).toEqual('');
                expect(component.currentPasswordErrorMessage).toEqual('Current password is invalid');
                expect(component.passwordForm.controls.currentPassword.errors).toEqual({'currentPasswordInvalid': true});
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.changePassword.and.returnValue(of(null));
                const currentPassword = component.passwordForm.controls.currentPassword.value;
                const password = component.passwordForm.controls.unmaskPassword.value;
                component.save();
                tick();
                expect(userManagerStub.changePassword).toHaveBeenCalledWith(loginManagerStub.currentUser, currentPassword, password);
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(component.errorMessage).toEqual('');
                expect(component.passwordForm.controls.currentPassword.value).toBeFalsy();
                expect(component.passwordForm.controls.unmaskPassword.value).toBeFalsy();
                expect(component.passwordForm.pristine).toEqual(true);
            }));
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            component.ngOnInit();
            fixture.detectChanges();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.password-tab')).length).toEqual(1);
            expect(element.queryAll(By.css('.row')).length).toEqual(1);
            expect(element.queryAll(By.css('.col-6')).length).toEqual(1);
            expect(element.queryAll(By.css('.offset-3')).length).toEqual(1);
        });
        it('depending on whether an error has occurred', function() {
            expect(element.query(By.css('error-display'))).toBeFalsy();

            component.errorMessage = 'Test';
            fixture.detectChanges();
            expect(element.query(By.css('error-display'))).toBeTruthy();
        });
        it('with the correct classes based on the confirm password field dirty flag', function() {
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();

            component.passwordForm.controls.currentPassword.setValue(null);
            component.passwordForm.updateValueAndValidity();
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();
            
            component.passwordForm.controls['currentPassword'].setValue('test');
            component.passwordForm.controls['unmaskPassword'].setValue('test');
            component.passwordForm.markAsDirty();
            component.passwordForm.updateValueAndValidity();
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeFalsy();
        });
        it('with an unmaskPassword', function() {
            expect(element.queryAll(By.css('unmask-password')).length).toEqual(1);
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
