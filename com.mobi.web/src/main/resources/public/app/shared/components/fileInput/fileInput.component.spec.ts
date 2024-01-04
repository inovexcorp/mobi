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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { FileInputComponent } from './fileInput.component';

describe('File Input component', function() {
    let component: FileInputComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<FileInputComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [],
            declarations: [
                FileInputComponent,
            ],
            providers: []
        }).compileComponents();

        fixture = TestBed.createComponent(FileInputComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        component.accept = [];
        component.displayText = '';
        component.isRequired = true;
        component.isMultiple = true;
        component.multiple = 'multiple';
        component.required = 'required';
        component.files = [];
    });

    describe('should initialize with the correct value for', function() {
        it('files', function() {
            expect(component.files).toEqual([]);
        });
        it('accept', function() {
            expect(component.accept).toEqual([]);
        });
        it('displayText', function() {
            expect(component.displayText).toEqual('');
        });
        it('multiple', function() {
            expect(component.multiple).toEqual('multiple');
        });
        it('required', function() {
            expect(component.required).toEqual('required');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping contains', function() {
            expect(element.queryAll(By.css('.file-input')).length).toEqual(1);
            expect(element.queryAll(By.css('input[type="file"]')).length).toEqual(1);
        });
        it('if displayText was provided', function() {
            expect(element.queryAll(By.css('.field-label')).length).toEqual(0);
            component.displayText = 'Test';
            fixture.detectChanges();
            expect(element.queryAll(By.css('.field-label')).length).toEqual(1);
        });
        it('depending on whether the input should accept multiple', function() {
            let input = element.query(By.css('input'));
            expect(input.nativeElement.getAttribute('multiple')).toBeNull();
            component.isMultiple = true;
            fixture.detectChanges();
            expect(input.nativeElement.getAttribute('multiple')).toEqual('');
            input = element.query(By.css('input'));
        });
        it('depending on whether the input should be required', function() {
            let input = element.query(By.css('input'));
            expect(input.nativeElement.getAttribute('required')).toBeNull();
            component.isRequired = true;
            fixture.detectChanges();
            input = element.query(By.css('input'));
            expect(input.nativeElement.getAttribute('required')).toEqual('');
        });
    });
});
