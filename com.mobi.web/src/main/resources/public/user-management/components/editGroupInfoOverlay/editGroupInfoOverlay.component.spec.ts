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
import { MatButtonModule, MatDialogModule, MatDialogRef, MatFormFieldModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { UserStateService } from '../../../shared/services/userState.service';
import { UtilService } from '../../../shared/services/util.service';
import { EditGroupInfoOverlayComponent } from './editGroupInfoOverlay.component';

describe('Edit Group Info Overlay component', function() {
    let component: EditGroupInfoOverlayComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<EditGroupInfoOverlayComponent>;
    let userStateStub: jasmine.SpyObj<UserStateService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let matDialogRef: jasmine.SpyObj<MatDialogRef<EditGroupInfoOverlayComponent>>;
    let utilStub: jasmine.SpyObj<UtilService>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                ReactiveFormsModule,
                MatDialogModule,
                MatFormFieldModule,
                MatInputModule,
                MatButtonModule,
                NoopAnimationsModule
            ],
            declarations: [
                EditGroupInfoOverlayComponent,
                MockComponent(ErrorDisplayComponent),
            ],
            providers: [
                MockProvider(UserStateService),
                MockProvider(UserManagerService),
                MockProvider(UtilService),
                { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
            ]
        });
    });

    beforeEach(function() {
        userStateStub = TestBed.get(UserStateService);
        userManagerStub = TestBed.get(UserManagerService);
        matDialogRef = TestBed.get(MatDialogRef);
        utilStub = TestBed.get(UtilService);
        userStateStub.selectedGroup = {
            jsonld: {
                '@id': 'id',
                '@type': []
            },
            title: 'group',
            description: 'description',
            external: false,
            members: [],
            roles: []
        };
        fixture = TestBed.createComponent(EditGroupInfoOverlayComponent);
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
        utilStub = null;
    });

    it('initializes with the correct values', function() {
        expect(component.editGroupInfoForm.controls.description.value).toEqual(userStateStub.selectedGroup.description);
    });
    describe('controller methods', function() {
        describe('should save changes to the group information', function() {
            beforeEach(function() {
                userManagerStub.groups = [userStateStub.selectedGroup];
                this.newGroup = Object.assign({}, userStateStub.selectedGroup);
                this.newGroup.description = 'New';
                component.editGroupInfoForm.controls.description.setValue(this.newGroup.description);
            });
            it('unless an error occurs', fakeAsync(function() {
                userManagerStub.updateGroup.and.returnValue(Promise.reject('Error message'));
                component.set();
                tick();
                expect(utilStub.updateDctermsValue).toHaveBeenCalledWith(userStateStub.selectedGroup.jsonld, 'description', this.newGroup.description);
                expect(userManagerStub.updateGroup).toHaveBeenCalledWith(userStateStub.selectedGroup.title, this.newGroup);
                expect(utilStub.updateDctermsValue).toHaveBeenCalledWith(this.newGroup.jsonld, 'description', this.newGroup.description);
                expect(component.errorMessage).toBe('Error message');
                expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
            it('successfully', fakeAsync(function() {
                userManagerStub.updateGroup.and.returnValue(Promise.resolve());
                component.set();
                tick();
                expect(userManagerStub.updateGroup).toHaveBeenCalledWith(userStateStub.selectedGroup.title, this.newGroup);
                expect(utilStub.updateDctermsValue).toHaveBeenCalledWith(this.newGroup.jsonld, 'description', this.newGroup.description);
                expect(component.errorMessage).toBe('');
                expect(matDialogRef.close).toHaveBeenCalled();
            }));
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
            expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
        });
        it('with a textarea', function() {
            expect(element.queryAll(By.css('textarea')).length).toBe(1);
        });
        it('with material form field elements', function() {
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
            expect(element.queryAll(By.css('.mat-form-field-label-wrapper')).length).toEqual(1);
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
        expect(matDialogRef.close).toHaveBeenCalled();
    });
    it('should call add when the button is clicked', function() {
        spyOn(component, 'set');
        const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
        setButton.triggerEventHandler('click', null);
        fixture.detectChanges();
        expect(component.set).toHaveBeenCalled();
    });
});
