/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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

import { DebugElement, SimpleChange, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UntypedFormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { KeywordSelectComponent } from './keywordSelect.component';

describe('Keyword Select component', function() {
    let component: KeywordSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<KeywordSelectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatButtonModule,
                MatInputModule,
                MatFormFieldModule,
                MatChipsModule,
                MatIconModule
            ],
            declarations: [
                KeywordSelectComponent,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(KeywordSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.parentForm = new UntypedFormGroup({
            keywords: new UntypedFormControl([])
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('controller method', function() {
        it('should add a keyword', function() {
            component.addKeyword({chipInput: null, input: null, value: ' A'});
            expect(component.parentForm.controls.keywords.value).toEqual(['A']);

            component.addKeyword({chipInput: null, input: null, value: 'B '});
            expect(component.parentForm.controls.keywords.value).toEqual(['A', 'B']);
        });
        it('should remove a keyword', function() {
            component.parentForm.controls.keywords.setValue(['A', 'B']);
            component.removeKeyword('A');
            expect(component.parentForm.controls.keywords.value).toEqual(['B']);

            component.removeKeyword('C');
            expect(component.parentForm.controls.keywords.value).toEqual(['B']);
        });
        it('should detect changes and call _clearInput method', () => {
            const changes: SimpleChanges = {
                clearInput: new SimpleChange(1, 2, false)
            };
            component.parentForm.controls.keywords.setValue(['A']);
            component.clearInput = 2;
            const input = element.query(By.css('.mat-chip-input'));
            fixture.detectChanges();
            component.ngOnChanges(changes);
            expect(component.parentForm.controls.keywords.value).toEqual([]);
            expect(input.nativeElement.value).toEqual('');

        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.keyword-select')).length).toEqual(1);
        });
        ['input[placeholder="Keywords"]', 'mat-form-field', 'mat-chip-list'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
    });
});
