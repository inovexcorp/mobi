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
import { UntypedFormControl, UntypedFormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { DelimitedManagerService } from '../../../shared/services/delimitedManager.service';
import { ColumnSelectComponent } from './columnSelect.component';

describe('Column Select component', function() {
    let component: ColumnSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<ColumnSelectComponent>;
    let delimitedManagerStub: jasmine.SpyObj<DelimitedManagerService>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule,
                MatSelectModule,
            ],
            declarations: [
                ColumnSelectComponent,
            ],
            providers: [
                MockProvider(DelimitedManagerService)
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(ColumnSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
        delimitedManagerStub = TestBed.inject(DelimitedManagerService) as jasmine.SpyObj<DelimitedManagerService>;

        component.parentForm = new UntypedFormGroup({
            column: new UntypedFormControl('')
        });
        delimitedManagerStub.dataRows = [['HeaderA', 'HeaderB'], ['A', 'B']];
    });

    afterEach(function () {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
        delimitedManagerStub = null;
    });

    it('initializes with the correct values', function() {
        spyOn(component, 'setValuePreview');
        delimitedManagerStub.getHeader.and.returnValue('Header');
        component.parentForm.controls.column.setValue(0);
        component.ngOnInit();
        expect(component.columns).toEqual([{idx: 0, header: 'Header'}, {idx: 1, header: 'Header'}]);
        expect(component.setValuePreview).toHaveBeenCalledWith(0);
    });
    describe('controller method', function() {
        describe('sets the preview of a column', function() {
            it('unless one is not provided', function() {
                component.setValuePreview(undefined);
                expect(component.preview).toEqual('(None)');
            });
            it('if there are headers', function() {
                delimitedManagerStub.containsHeaders = true;
                component.setValuePreview(0);
                expect(component.preview).toEqual('A');
                component.setValuePreview(1);
                expect(component.preview).toEqual('B');
            });
            it('if there are no headers', function() {
                delimitedManagerStub.containsHeaders = false;
                component.setValuePreview(0);
                expect(component.preview).toEqual('HeaderA');
                component.setValuePreview(1);
                expect(component.preview).toEqual('HeaderB');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.column-select')).length).toEqual(1);
        });
        ['mat-form-field', 'mat-select'].forEach(test => {
            it('with a ' + test, function() {
                expect(element.queryAll(By.css(test)).length).toEqual(1);
            });
        });
        it('depending on whether a column is selected', function() {
            expect(element.queryAll(By.css('.value-preview')).length).toEqual(0);

            component.parentForm.controls.column.setValue(0);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.value-preview')).length).toEqual(1);
        });
    });
});
