/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import { MockComponent } from 'ng-mocks';
import { configureTestSuite } from 'ng-bullet';

import {
    mockUserManager,
    mockLoginManager,
    mockUtil,
    cleanStylesFromDOM
} from '../../../../../../test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { PasswordTabComponent } from './passwordTab.component';
import { By } from '@angular/platform-browser';

describe('Password Tab component', function() {
    let component: PasswordTabComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<PasswordTabComponent>;
    let userManagerStub;
    let loginManagerStub;
    let utilStub;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ SharedModule ],
            declarations: [
                PasswordTabComponent
            ],
            providers: [
                { provide: 'loginManagerService', useClass: mockLoginManager },
                { provide: 'userManagerService', useClass: mockUserManager },
                { provide: 'utilService', useClass: mockUtil },
                { provide: 'ErrorDisplayComponent', useClass: MockComponent(ErrorDisplayComponent) }
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(PasswordTabComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        loginManagerStub = TestBed.get('loginManagerService');
        userManagerStub = TestBed.get('userManagerService');
        utilStub = TestBed.get('utilService');

        loginManagerStub.currentUser = 'user';
        userManagerStub.users = [{ username: 'user' }];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        loginManagerStub = null;
        utilStub = null;
    });

    describe('should initialize with the current user', function() {
        it('and form values', function() {
            component.ngOnInit();
            expect(component.currentUser).not.toBe(userManagerStub.users[0]);
            expect(component.currentUser).toEqual(userManagerStub.users[0]);
            expect(component.passwordForm.controls.currentPassword).toBeTruthy();
            expect(component.passwordForm.get('newPassword.password')).toBeTruthy();
            expect(component.passwordForm.get('newPassword.confirmPassword')).toBeTruthy();
        });
        it('if user is external', function() {
            userManagerStub.users[0].external = true;
            component.ngOnInit();
            expect(component.passwordForm.controls.currentPassword.disabled).toEqual(true);
            expect(component.passwordForm.get('newPassword.password').disabled).toEqual(true);
            expect(component.passwordForm.get('newPassword.confirmPassword').disabled).toEqual(true);
        });
    });
    describe('controller methods', function() {
        describe('should save changes to the user password', function() {
            beforeEach(function() {
                component.passwordForm.controls.currentPassword.setValue('test');
                component.passwordForm.get('newPassword.password').setValue('new');
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.changePassword.and.returnValue(Promise.reject('Error message'));
                component.save();
                tick();
                expect(userManagerStub.changePassword).toHaveBeenCalledWith(loginManagerStub.currentUser, component.passwordForm.controls.currentPassword.value, component.passwordForm.get('newPassword.password').value);
                expect(component.errorMessage).toEqual('Error message');
            }));
            it('successfully', fakeAsync(function() {
                let currentPassword = component.passwordForm.controls.currentPassword.value;
                let password = component.passwordForm.get('newPassword.password').value;
                component.save();
                tick();
                expect(userManagerStub.changePassword).toHaveBeenCalledWith(loginManagerStub.currentUser, currentPassword, password);
                expect(utilStub.createSuccessToast).toHaveBeenCalled();
                expect(component.errorMessage).toEqual('');
                expect(component.passwordForm.controls.currentPassword.value).toBeFalsy();
                expect(component.passwordForm.get('newPassword.password').value).toBeFalsy();
                expect(component.passwordForm.get('newPassword.confirmPassword').value).toBeFalsy();
                expect(component.passwordForm.pristine).toEqual(true);
            }));
        });
    });
    describe('contains the correct html', function() {
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
            let currentPassword = element.query(By.css('.current-password input'));
            expect(currentPassword.classes['is-invalid']).toBeFalsy();

            component.passwordForm.controls.currentPassword.markAsDirty();
            fixture.detectChanges();
            expect(currentPassword.classes['is-invalid']).toBeTruthy();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();
        });
        it('depending on the new password field values', function() {
            let password = element.query(By.css('.password input'));
            let confirmPassword = element.query(By.css('.confirm-password input'));
            let passwordControl = component.passwordForm.get('newPassword.password');
            let confirmPasswordControl = component.passwordForm.get('newPassword.confirmPassword');
            component.passwordForm.setValue({
                currentPassword: 'test',
                newPassword: {
                    password: 'new',
                    confirmPassword: 'what'
                }
            });
            passwordControl.updateValueAndValidity();
            passwordControl.markAsDirty();
            confirmPasswordControl.updateValueAndValidity();
            confirmPasswordControl.markAsDirty();
            fixture.detectChanges();
            expect(password.classes['is-invalid']).toBeTruthy();
            expect(confirmPassword.classes['is-invalid']).toBeTruthy();
            expect(element.query(By.css('.invalid-feedback'))).toBeTruthy();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();

            component.passwordForm.patchValue({
                newPassword: {
                    confirmPassword: 'new'
                }
            });
            passwordControl.updateValueAndValidity();
            confirmPasswordControl.updateValueAndValidity();
            fixture.detectChanges();
            expect(password.classes['is-invalid']).toBeFalsy();
            expect(confirmPassword.classes['is-invalid']).toBeFalsy();
            expect(element.query(By.css('.invalid-feedback'))).toBeFalsy();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeFalsy();
        });
        it('depending on whether the current user is external', function() {
            component.passwordForm.setValue({
                currentPassword: 'test',
                newPassword: {
                    password: 'new',
                    confirmPassword: 'new'
                }
            });
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeFalsy();

            component.currentUser.external = true;
            fixture.detectChanges();
            expect(element.query(By.css('button[type="submit"]')).properties.disabled).toBeTruthy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        spyOn(component, 'save');
        let button = element.query(By.css('form'));
        button.triggerEventHandler('ngSubmit', null);
        fixture.detectChanges();
        expect(component.save).toHaveBeenCalled();
    });
});