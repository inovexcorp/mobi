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
import { MatButtonModule, MatDialogModule, MatDialogRef } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { UnmaskPasswordComponent } from '../../../shared/components/unmaskPassword/unmaskPassword.component';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { UtilService } from '../../../shared/services/util.service';
import { ResetPasswordOverlayComponent } from './resetPasswordOverlay.component';

describe('Reset Password Overlay component', function() {
    let component: ResetPasswordOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ResetPasswordOverlayComponent>;
    let userStateStub: jasmine.SpyObj<UserStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<ResetPasswordOverlayComponent>>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                ResetPasswordOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(UnmaskPasswordComponent),
            ],
            providers: [
                MockProvider(UserManagerService),
                MockProvider(UserStateService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ResetPasswordOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.get(UserManagerService);
        userStateStub = TestBed.get(UserStateService);
        matDialogRef = TestBed.get(MatDialogRef);

        userStateStub.selectedUser = {
            username: 'user',
            firstName: '',
            lastName: '',
            email: '',
            roles: [],
            external: false
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userStateStub = null;
        userManagerStub = null;
        matDialogRef = null;
    });

    describe('controller methods', function() {
        describe('should reset the user password', function() {
            beforeEach(function() {
                this.pw = 'test';
                component.resetPasswordForm.controls.unmaskPassword.setValue(this.pw);
                fixture.detectChanges();
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.resetPassword.and.rejectWith('Error message');
                component.set();
                tick();
                expect(userManagerStub.resetPassword).toHaveBeenCalledWith(userStateStub.selectedUser.username, this.pw);
                expect(component.errorMessage).toEqual('Error message');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.resetPassword.and.resolveTo();
                component.set();
                tick();
                expect(userManagerStub.resetPassword).toHaveBeenCalledWith(userStateStub.selectedUser.username, this.pw);
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
        it('with an unmask-password', function() {
            expect(element.queryAll(By.css('unmask-password')).length).toEqual(1);
        });
        it('depending on the form validity', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();

            component.resetPasswordForm.controls.unmaskPassword.setValue('');
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.resetPasswordForm.controls.unmaskPassword.setValue('test');
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
    it('should call set when the button is clicked', function() {
        spyOn(component, 'set');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.set).toHaveBeenCalledWith();
    });
});
