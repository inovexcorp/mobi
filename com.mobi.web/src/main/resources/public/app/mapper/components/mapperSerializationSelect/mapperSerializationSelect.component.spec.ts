/*-
* #%L
 * com.mobi.web
 *  $Id:$
 *  $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
*/
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup, FormControl } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { SharedModule } from '../../../shared/shared.module';
import { MapperSerializationSelectComponent } from './mapperSerializationSelect.component';

describe('Mapper Serialization Select component', function() {
    let component: MapperSerializationSelectComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<MapperSerializationSelectComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                SharedModule
            ],
            declarations: [
                MapperSerializationSelectComponent,
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(MapperSerializationSelectComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.parentForm = new FormGroup({
            serialization: new FormControl('jsonld')
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    it('initializes correctly', function() {
        expect(component.options.length).toEqual(3);
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.mapper-serialization-select')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-select')).length).toEqual(1);
        });
    });
});
