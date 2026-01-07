/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/

import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule, UntypedFormGroup, UntypedFormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { SerializationSelectComponent } from './serializationSelect.component';

describe('Serialization Select component', function() {
    let component: SerializationSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SerializationSelectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatSelectModule,
                MatFormFieldModule,
            ],
            declarations: [
                SerializationSelectComponent,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(SerializationSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.parentForm = new UntypedFormGroup({
            serialization: new UntypedFormControl('')
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.serialization-select')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
        });
        it('with a mat-select', function() {
            expect(element.queryAll(By.css('mat-select')).length).toEqual(1);
        });
    });
});
