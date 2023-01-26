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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent, MatChipsModule, MatFormFieldModule, MatIconModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatMarkdownEditorComponent } from 'mat-markdown-editor';
import { configureTestSuite } from 'ng-bullet';
import { MockComponent, MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { AssigneeInputComponent } from './assigneeInput.component';

describe('Assignee Input component', function() {
    let component: AssigneeInputComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<AssigneeInputComponent>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>

    configureTestSuite(function() {
        TestBed.configureTestingModule({
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
        userManagerStub = TestBed.get(UserManagerService);

        component.parentForm = new FormGroup({
            assignees: new FormControl('')
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
            component.add({input: null, value: 'user'});
            expect(component.selected).toEqual(['user']);
            expect(component.selectedChange.emit).toHaveBeenCalledWith(['user']);
            expect(component.parentForm.controls.assignees.value).toEqual(null);
        });
        it('should handle removing a user', function() {
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
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.assignee-input')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-chip-list', 'mat-autocomplete', 'input[placeholder="Assignees"]'].forEach(test => {
            it('with a ' + test, function() {
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
