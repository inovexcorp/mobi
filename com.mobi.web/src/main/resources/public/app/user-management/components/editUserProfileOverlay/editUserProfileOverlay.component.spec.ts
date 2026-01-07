/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { FOAF, USER } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../shared/models/user.class';
import { EditUserProfileOverlayComponent } from './editUserProfileOverlay.component';

describe('Edit User Profile Overlay component', function() {
    let component: EditUserProfileOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditUserProfileOverlayComponent>;
    let userStateStub: jasmine.SpyObj<UserStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<EditUserProfileOverlayComponent>>;
    let toastStub: jasmine.SpyObj<ToastService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                EditUserProfileOverlayComponent,
                MockComponent(ErrorDisplayComponent),
            ],
            providers: [
                MockProvider(UserStateService),
                MockProvider(UserManagerService),
                MockProvider(ToastService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        userStateStub = TestBed.inject(UserStateService) as jasmine.SpyObj<UserStateService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as  jasmine.SpyObj<MatDialogRef<EditUserProfileOverlayComponent>>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
        userStateStub.selectedUser = new User({
          '@id': 'batman',
          '@type': [`${USER}User`],
          [`${USER}username`]: [{ '@value': 'batman' }],
          [`${FOAF}firstName`]: [{ '@value': 'BATMAN' }],
          [`${FOAF}lastName`]: [{ '@value': 'user' }],
          [`${FOAF}email`]: [{ '@id': 'mailto:iambatman@test.com' }],
        });
        fixture = TestBed.createComponent(EditUserProfileOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        userStateStub = null;
        matDialogRef = null;
        toastStub = null;
    });

    it('initializes with the correct values', function() {
        expect(component.editProfileForm.controls.firstName.value).toEqual(userStateStub.selectedUser.firstName);
        expect(component.editProfileForm.controls.lastName.value).toEqual(userStateStub.selectedUser.lastName);
        expect(component.editProfileForm.controls.email.value).toEqual(userStateStub.selectedUser.email.replace('mailto:', ''));
    });
    describe('controller methods', function() {
        describe('should save changes to the user profile', function() {
            beforeEach(function() {
                userManagerStub.users = [userStateStub.selectedUser];
                this.newUser = new User(userStateStub.selectedUser.jsonld);
                this.newUser.firstName = 'Bruce';
                this.newUser.lastName = 'Wayne';
                this.newUser.email = 'mailto:test@test.com';
                component.editProfileForm.controls.firstName.setValue(this.newUser.firstName);
                component.editProfileForm.controls.lastName.setValue(this.newUser.lastName);
                component.editProfileForm.controls.email.setValue(this.newUser.email.replace('mailto:', ''));
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.updateUser.and.returnValue(throwError('Error message'));
                component.set();
                tick();
                expect(userManagerStub.updateUser).toHaveBeenCalledWith(userStateStub.selectedUser.username, this.newUser);
                expect(component.errorMessage).toEqual('Error message');
                expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
                expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
            it('successfully with blank values', fakeAsync(function() {
                this.newUser.firstName = '';
                this.newUser.lastName = '';
                this.newUser.email = '';
                delete this.newUser.jsonld[`${FOAF}firstName`];
                delete this.newUser.jsonld[`${FOAF}lastName`];
                delete this.newUser.jsonld[`${FOAF}mbox`];
                component.editProfileForm.controls.firstName.setValue('');
                component.editProfileForm.controls.lastName.setValue('');
                component.editProfileForm.controls.email.setValue('');
                userManagerStub.updateUser.and.returnValue(of(null));
                component.set();
                tick();
                expect(userManagerStub.updateUser).toHaveBeenCalledWith(userStateStub.selectedUser.username, this.newUser);
                expect(component.errorMessage).toEqual('');
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(matDialogRef.close).toHaveBeenCalledWith();
            }));
            it('successfully with values filled in', fakeAsync(function() {
                userManagerStub.updateUser.and.returnValue(of(null));
                component.set();
                tick();
                expect(userManagerStub.updateUser).toHaveBeenCalledWith(userStateStub.selectedUser.username, this.newUser);
                expect(component.errorMessage).toEqual('');
                expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
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
        ['input[name="firstName"]', 'input[name="lastName"]', 'input[name="email"]'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with material form field elements', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(3);
            expect(element.queryAll(By.css('.mat-form-field-label-wrapper')).length).toEqual(3);
        });
        it('with the correct HTML based on the email field validity', function() {
            expect(element.queryAll(By.css('mat-error')).length).toEqual(0);

            component.editProfileForm.controls.email.setValue('$');
            component.editProfileForm.controls.email.markAsTouched();
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
        });
        it('depending on the form validity', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();

            component.editProfileForm.controls.email.setValue('$');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.editProfileForm.controls.email.setValue(userStateStub.selectedUser.email.replace('mailto:', ''));
            component.editProfileForm.updateValueAndValidity();
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
        cancelButton.triggerEventHandler('click', {});
        fixture.detectChanges();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
    });
    it('should call add when the button is clicked', function() {
        spyOn(component, 'set');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.set).toHaveBeenCalledWith();
    });
});
