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
import { UntypedFormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatMarkdownEditorComponent } from 'mat-markdown-editor/dist';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { AssigneeInputComponent } from './assigneeInput.component';

describe('Assignee Input component', function() {
    let component: AssigneeInputComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<AssigneeInputComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatFormFieldModule,
                MatChipsModule,
                MatIconModule,
                MatAutocompleteModule
            ],
            declarations: [
                AssigneeInputComponent,
                MockComponent(MatMarkdownEditorComponent),
            ],
            providers: [
                MockProvider(UserManagerService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(AssigneeInputComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        userManagerStub.users = [
            { username: 'userA', firstName: 'User', lastName: 'A' },
            { username: 'userB', firstName: 'User', lastName: 'B' },
        ];
        userManagerStub.filterUsers.and.callFake(arr => arr);

        component.parentForm = new UntypedFormGroup({
            assignees: new UntypedFormControl('')
        });
        component.selected = [];
        spyOn(component.selectedChange, 'emit');
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        userManagerStub = null;
    });

    describe('controller methods', function() {
        it('should handle adding a chip', function() {
            component.availableUsers = [
                { username: 'User1', firstName: 'User', lastName: '1' },
                { username: 'User2', firstName: 'User', lastName: '2' },
                { username: 'TestUser', firstName: 'Test', lastName: 'User' }
            ];
            const event = {
                value: 'TestUser',
            } as MatChipInputEvent;

            component.add(event);
            expect(component.selected).toEqual(['TestUser']);
            expect(component.selectedChange.emit).toHaveBeenCalledWith(['TestUser']);
            expect(component.parentForm.controls.assignees.value).toEqual(null);
        });
        it('should handle removing a user', function() {
            component.add({chipInput: null, input: null, value: 'user'});
            component.removeAssignee('user');
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).not.toHaveBeenCalled();

            component.selected = ['user'];
            component.removeAssignee('user');
            expect(component.selected).toEqual([]);
            expect(component.selectedChange.emit).toHaveBeenCalledWith([]);
        });
        it('should handle selecting an option in the autocomplete', function() {
            const event: MatAutocompleteSelectedEvent = {
                option: {
                    value: 'user'
                }
            } as MatAutocompleteSelectedEvent;
            component.select(event);
            expect(component.selected).toEqual(['user']);
            expect(component.selectedChange.emit).toHaveBeenCalledWith(['user']);
            expect(component.assigneeInput.nativeElement.value).toEqual('');
            expect(component.parentForm.controls.assignees.value).toEqual(null);
        });
        it('should not add duplicates', () => {
            component.availableUsers = [
                { username: 'User1', firstName: 'User', lastName: '1' },
                { username: 'User2', firstName: 'User', lastName: '2' },
                { username: 'TestUser', firstName: 'Test', lastName: 'User' }
            ];
            const event = {
                value: 'TestUser',
            } as MatChipInputEvent;

            component.add(event);
            component.add(event);

            expect(component.selected.length).toBe(1);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.assignee-input')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-chip-list', 'mat-autocomplete', 'input[placeholder="Assignees"]'].forEach(test => {
            it(`with a ${test}`, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on how many users are selected', function() {
            component.selected = ['userA', 'userB'];
            fixture.detectChanges();
            expect(element.queryAll(By.css('mat-chip')).length).toEqual(component.selected.length);
        });
    });
});
