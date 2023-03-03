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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockDirective, MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { FocusDirective } from '../../directives/focus/focus.directive';
import { UtilService } from '../../services/util.service';
import { InlineEditComponent } from './inlineEdit.component';

describe('Inline Edit component', function() {
    let component: InlineEditComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<InlineEditComponent>;
    let utilStub: jasmine.SpyObj<UtilService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule
            ],
            declarations: [
                InlineEditComponent,
                MockDirective(FocusDirective)
            ],
            providers: [
                MockProvider(UtilService),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(InlineEditComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        utilStub = null;
    });

    it('should initialize correctly on text change', function() {
        component.text = 'New Text';
        expect(component.editedText).toEqual('New Text');
    });
    describe('controller methods', function() {
        describe('saveChanges', function() {
            it('should reset if required is set and editedText is empty', function() {
                component.text = 'Text';
                component.required = true;
                component.editedText = '';
                component.edit = true;
                component.saveChanges();
                expect(component.text).toEqual('Text');
                expect(component.edit).toEqual(false);
                expect(utilStub.createWarningToast).toHaveBeenCalledWith(jasmine.any(String));
            });
            it('should save changes', function() {
                spyOn(component.saveEvent, 'emit');
                component.editedText = 'New Text';
                component.edit = true;
                component.saveChanges();
                expect(component.saveEvent.emit).toHaveBeenCalledWith('New Text');
            });
        });
        it('onBlur should reset state', function() {
            component.text = 'Text';
            component.editedText = 'Changed Text';
            component.edit = true;
            component.onBlur();
            expect(component.editedText).toEqual('Text');
            expect(component.edit).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.inline-edit')).length).toEqual(1);
        });
        describe('depending if the user can edit', function() {
            beforeEach(function() {
                component.canEdit = true;
            });
            describe('and is edit mode', function() {
                beforeEach(function() {
                    component.edit = true;
                });
                it('and area is set', function() {
                    component.area = true;
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('input')).length).toEqual(0);
                    expect(element.queryAll(By.css('textarea')).length).toEqual(1);
                    expect(element.queryAll(By.css('.fa-save')).length).toEqual(1);
                });
                it('and area is not set', function() {
                    component.area = false;
                    fixture.detectChanges();
                    expect(element.queryAll(By.css('input')).length).toEqual(1);
                    expect(element.queryAll(By.css('textarea')).length).toEqual(0);
                    expect(element.queryAll(By.css('.fa-save')).length).toEqual(1);
                });
            });
            it('and is not in edit mode', function() {
                component.edit = false;
                fixture.detectChanges();
                expect(element.queryAll(By.css('input')).length).toEqual(0);
                expect(element.queryAll(By.css('textarea')).length).toEqual(0);
                expect(element.queryAll(By.css('.fa-save')).length).toEqual(0);
            });
        });
        it('depending if the user cannot edit', function() {
            component.canEdit = false;
            fixture.detectChanges();
            expect(element.queryAll(By.css('input')).length).toEqual(0);
            expect(element.queryAll(By.css('textarea')).length).toEqual(0);
            expect(element.queryAll(By.css('.fa-save')).length).toEqual(0);
        });
        it('should set edit to true when clicked', function() {
            component.canEdit = true;
            fixture.detectChanges();

            expect(component.edit).toEqual(false);
            const editableArea = element.queryAll(By.css('.hover-area'))[0];
            editableArea.triggerEventHandler('click', null);
            expect(component.edit).toEqual(true);
        });
    });
});
