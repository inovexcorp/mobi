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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { User } from '../../../shared/models/user.interface';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { UnmaskPasswordComponent } from '../../../shared/components/unmaskPassword/unmaskPassword.component';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { UtilService } from '../../../shared/services/util.service';
import { CreateUserOverlayComponent } from './createUserOverlay.component';

describe('Create User Overlay component', function() {
    let component: CreateUserOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateUserOverlayComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateUserOverlayComponent>>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                MatSlideToggleModule,
                NoopAnimationsModule
            ],
            declarations: [
                CreateUserOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(UnmaskPasswordComponent)
            ],
            providers: [
                MockProvider(UserStateService),
                MockProvider(UserManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateUserOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateUserOverlayComponent>>;
   
        userManagerStub.users = [{ username: 'user', external: false, roles: [], firstName: 'John', lastName: 'Doe', email: '' }];
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        matDialogRef = null;
    });

    describe('controller methods', function() {
        it('should get the list of used usernames', function() {
            const usernames = component.getUsernames();
            expect(usernames.length).toEqual(userManagerStub.users.length);
            usernames.forEach((username, idx) => {
                expect(username).toEqual(userManagerStub.users[idx].username);
            });
        });
        it('should get the correct error message for the username field', function() {
            expect(component.getUsernameErrorMessage()).toEqual('');

            component.createUserForm.controls.username.setErrors({
                uniqueValue: true
            });
            expect(component.getUsernameErrorMessage()).toEqual('This username has already been taken');

            component.createUserForm.controls.username.setErrors({
                pattern: true
            });
            expect(component.getUsernameErrorMessage()).toEqual('Invalid username');
        });
        describe('should add a user with the entered information', function() {
            beforeEach(function() {
                const newUser: User = {
                    username: 'username',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'example@example.com',
                    external: false,
                    roles: ['user', 'admin']
                };
                this.newUser = newUser;
                component.createUserForm.setValue({
                    username: 'username',
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    unmaskPassword: 'pw',
                    admin: true
                });
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.addUser.and.returnValue(throwError('Error Message'));
                component.add();
                tick();
                expect(userManagerStub.addUser).toHaveBeenCalledWith(this.newUser, component.createUserForm.controls.unmaskPassword.value);
                expect(component.errorMessage).toEqual('Error Message');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.addUser.and.returnValue(of(null));
                component.add();
                tick();
                expect(userManagerStub.addUser).toHaveBeenCalledWith(this.newUser, component.createUserForm.controls.unmaskPassword.value);
                expect(component.errorMessage).toEqual('');
                expect(matDialogRef.close).toHaveBeenCalledWith();
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="username"]', 'input[name="lastName"]', 'input[name="email"]', 'unmask-password', 'mat-slide-toggle'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with material form field elements', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(4);
            expect(element.queryAll(By.css('.mat-form-field-label-wrapper')).length).toEqual(4);
        });
        it('with the correct HTML based on the username field validity', function() {
            expect(element.queryAll(By.css('mat-error')).length).toEqual(0);

            component.createUserForm.controls.username.setValue('$');
            component.createUserForm.controls.username.markAsTouched();
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
        });
        it('with the correct HTML based on the email field validity', function() {
            expect(element.queryAll(By.css('mat-error')).length).toEqual(0);

            component.createUserForm.controls.email.setValue('$');
            component.createUserForm.controls.email.markAsTouched();
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
        });
        it('depending on the form validity', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();

            component.createUserForm.controls.username.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.createUserForm.controls.username.setValue('test');
            component.createUserForm.controls.unmaskPassword.setValue('test');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeFalsy();
        });
        it('depending on whether there is an error', function() {
            expect(element.queryAll(By.css('error-display')).length).toEqual(0);
            component.errorMessage = 'Error message';
            fixture.detectChanges();
            expect(element.queryAll(By.css('error-display')).length).toEqual(1);
        });
        it('with buttons to cancel and submit', function() {
            const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
            expect(buttons.length).toEqual(2);
            expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
            expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
        });
    });
    it('should call cancel when the button is clicked', function() {
        const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
        cancelButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call add when the button is clicked', function() {
        spyOn(component, 'add');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.add).toHaveBeenCalledWith();
    });
});
