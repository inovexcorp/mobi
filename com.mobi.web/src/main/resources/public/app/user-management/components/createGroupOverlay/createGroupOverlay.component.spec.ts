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
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { AddMemberButtonComponent } from '../addMemberButton/addMemberButton.component';
import { MemberTableComponent } from '../memberTable/memberTable.component';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { Group } from '../../../shared/models/group.interface';
import { User } from '../../../shared/models/user.interface';
import { UtilService } from '../../../shared/services/util.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { CreateGroupOverlayComponent } from './createGroupOverlay.component';

describe('Create Group Overlay component', function() {
    let component: CreateGroupOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<CreateGroupOverlayComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateGroupOverlayComponent>>;
    let loginManagerStub: jasmine.SpyObj<LoginManagerService>;
    let user: User;
    let newGroup: Group;

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
                CreateGroupOverlayComponent,
                MockComponent(ErrorDisplayComponent),
                MockComponent(AddMemberButtonComponent),
                MockComponent(MemberTableComponent)
            ],
            providers: [
                MockProvider(UserManagerService),
                MockProvider(UtilService),
                MockProvider(LoginManagerService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGroupOverlayComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        loginManagerStub = TestBed.inject(LoginManagerService) as jasmine.SpyObj<LoginManagerService>;
        matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateGroupOverlayComponent>>;

        loginManagerStub.currentUser = 'admin';
        user = {
            username: 'batman',
            firstName: 'BATMAN',
            lastName: 'DUH',
            email: 'iambatman@test.com',
            external: false,
            roles: []
        };
        newGroup = {
            title: 'Superheroes',
            description: 'Wow',
            external: false,
            members: [user.username],
            roles: ['admin']
        };
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
        loginManagerStub = null;
        matDialogRef = null;
        user = null;
        newGroup = null;
    });

    it('should initialize with the correct value for members', function() {
        component.ngOnInit();
        expect(component.members).toContain(loginManagerStub.currentUser);
    });
    describe('controller methods', function() {
        it('should get the list of used group titles', function() {
            userManagerStub.groups = [newGroup];
            const titles = component.getTitles();
            expect(titles.length).toEqual(userManagerStub.groups.length);
            titles.forEach((title, idx) => {
                expect(title).toEqual(userManagerStub.groups[idx].title);
            });
        });
        it('should get the correct error message for the title field', function() {
            expect(component.getTitleErrorMessage()).toEqual('');

            component.createGroupForm.controls.title.setErrors({
                uniqueValue: true
            });
            expect(component.getTitleErrorMessage()).toEqual('This group title has already been taken');
        });
        describe('should add a group with the entered information', function() {
            beforeEach(function() {
                component.createGroupForm.setValue({
                    title: newGroup.title,
                    description: newGroup.description,
                    admin: true
                });
                component.members.push(user.username);
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.addGroup.and.returnValue(throwError('Error Message'));
                component.add();
                tick();
                expect(userManagerStub.addGroup).toHaveBeenCalledWith(newGroup);
                expect(component.errorMessage).toEqual('Error Message');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.addGroup.and.returnValue(of(null));
                component.add();
                tick();
                expect(userManagerStub.addGroup).toHaveBeenCalledWith(newGroup);
                expect(component.errorMessage).toEqual('');
                expect(matDialogRef.close).toHaveBeenCalledWith();
            }));
        });
        it('should add a member to the new group', function() {
            component.addMember(user);
            expect(component.members).toContain(user.username);
        });
        it('should remove a member from the new group', function() {
            component.members.push(user.username);
            component.removeMember(user.username);
            expect(component.members).not.toContain(user.username);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        ['input[name="title"]', 'add-member-button', 'member-table', 'textarea', 'mat-slide-toggle'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('with material form field elements', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(2);
            expect(element.queryAll(By.css('.mat-form-field-label-wrapper')).length).toEqual(2);
        });
        it('with the correct HTML based on the title field validity', function() {
            expect(element.queryAll(By.css('mat-error')).length).toEqual(0);

            userManagerStub.groups = [{title: 'Group', description: '', members: [], roles: [], external: false}];
            component.createGroupForm.controls.title.setValue('');
            component.createGroupForm.controls.title.markAsTouched();
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
        });
        it('depending on the form validity', function() {
            const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
            expect(button).not.toBeNull();
            expect(button.properties['disabled']).toBeFalsy();

            component.createGroupForm.controls.title.setValue(null);
            fixture.detectChanges();
            expect(button.properties['disabled']).toBeTruthy();

            component.createGroupForm.controls.title.setValue('test');
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
    it('should call add when the submit button is clicked', function() {
        spyOn(component, 'add');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.add).toHaveBeenCalledWith();
    });
});
