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

import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { LanguageSelectComponent } from '../languageSelect/languageSelect.component';
import { AdvancedLanguageSelectComponent } from './advancedLanguageSelect.component';

describe('Advanced Language Select component', function() {
    let component: AdvancedLanguageSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<AdvancedLanguageSelectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                ReactiveFormsModule,
                FormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatButtonModule,
                MatIconModule,
                MatSelectModule
            ],
            declarations: [
                AdvancedLanguageSelectComponent,
                MockComponent(LanguageSelectComponent)
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(AdvancedLanguageSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.parentForm = new UntypedFormGroup({
            language: new UntypedFormControl('')
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('controller methods', function() {
        it('show sets the proper variables', function() {
            component.show();
            expect(component.isShown).toEqual(true);
            expect(component.parentForm.controls.language.value).toEqual('en');
        });
        it('hide sets the proper variables', function() {
            component.hide();
            expect(component.isShown).toEqual(false);
            expect(component.parentForm.controls.language.value).toEqual('');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            fixture.detectChanges();
        });
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.advanced-language-select')).length).toEqual(1);
        });
        it('depending on whether the select is expanded', function() {
            expect(element.queryAll(By.css('language-select')).length).toEqual(0);

            component.isShown = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('language-select')).length).toEqual(1);
        });
        it('for correct links', function() {
            expect(element.queryAll(By.css('button .fa-plus')).length).toEqual(1);
            expect(element.queryAll(By.css('button .fa-times')).length).toEqual(0);
            component.isShown = true;
            fixture.detectChanges();
            expect(element.queryAll(By.css('button .fa-plus')).length).toEqual(0);
            expect(element.queryAll(By.css('button .fa-times')).length).toEqual(1);
        });
    });
});
