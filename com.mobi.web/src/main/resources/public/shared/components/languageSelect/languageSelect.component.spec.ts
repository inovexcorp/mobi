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
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { PropertyManagerService } from '../../services/propertyManager.service';
import { LanguageSelectComponent } from './languageSelect.component';

describe('Language Select component', function() {
    let component: LanguageSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<LanguageSelectComponent>;
    let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
    
    const language = {label: 'English', value: 'en'};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatButtonModule,
                MatInputModule,
                MatFormFieldModule,
                MatIconModule,
                MatSelectModule
            ],
            declarations: [
                LanguageSelectComponent,
            ],
            providers: [
                MockProvider(PropertyManagerService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(LanguageSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        propertyManagerStub = TestBed.get(PropertyManagerService);

        propertyManagerStub.languageList = [language];
        component.parentForm = new FormGroup({
            language: new FormControl('')
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        propertyManagerStub = null;
    });

    describe('should initialize correctly', function() {
        it('if the input should be clear-able', function() {
            component.disableClear = false;
            component.ngOnInit();
            expect(component.languages).toEqual([language]);
            expect(component.parentForm.controls.language.value).toEqual('');
        });
        it('if the input should not be clear-able', function() {
            component.disableClear = true;
            component.ngOnInit();
            expect(component.languages).toEqual([language]);
            expect(component.parentForm.controls.language.value).toEqual('en');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.language-select')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether the clear button should be enabled', function() {
            fixture.detectChanges();
            expect(element.queryAll(By.css('a')).length).toEqual(1);

            component.disableClear = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('a')).length).toEqual(0);
        });
    });
    describe('controller methods', function() {
        it('clear properly clears the language value', function() {
            component.parentForm.controls.language.setValue('en');
            component.clear();
            expect(component.parentForm.controls.language.value).toEqual('');
        });
    });
});
