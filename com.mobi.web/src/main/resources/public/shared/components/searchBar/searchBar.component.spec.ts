/*-
* #%L
* com.mobi.web
* $Id:$
* $HeadURL:$
* %%
* Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { MatFormFieldModule, MatInputModule } from '@angular/material';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM } from '../../../../../../test/ts/Shared';
import { SearchBarComponent } from './searchBar.component';

describe('Search Bar component', function() {
    let component: SearchBarComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<SearchBarComponent>;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ 
                NoopAnimationsModule,
                FormsModule,
                ReactiveFormsModule,
                MatInputModule,
                MatFormFieldModule
             ],
            declarations: [
                SearchBarComponent,
            ],
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(SearchBarComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.search-bar')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-form-field')).length).toEqual(1);
        });
        it('with an input', function() {
            expect(element.queryAll(By.css('input.search-bar-input')).length).toEqual(1);
        });
    });
    describe('controller methods', function() {
        it('should handle an update to the input value', function() {
            spyOn(component.bindModelChange, 'emit');
            component.updateValue('test');
            expect(component.bindModelChange.emit).toHaveBeenCalledWith('test');
        });
        it('should perform a search', function() {
            spyOn(component.submitEvent, 'emit');
            component.search();
            expect(component.submitEvent.emit).toHaveBeenCalledWith();
        });
    });
});
