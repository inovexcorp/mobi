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

import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { HierarchyFilterComponent } from './hierarchyFilter.component';

describe('Hierarchy Filter component', function() {
    let component: HierarchyFilterComponent;
    let element: DebugElement;
    let fixture: ComponentFixture<HierarchyFilterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                FormsModule,
                MatButtonModule,
                MatMenuModule,
                MatFormFieldModule,
                MatCheckboxModule,
                NoopAnimationsModule
            ],
            declarations: [
                HierarchyFilterComponent
            ]
        });
    });

    beforeEach(function() {
        fixture = TestBed.createComponent(HierarchyFilterComponent);
        component = fixture.componentInstance;
        element = fixture.debugElement;

        component.filters = [];
        fixture.detectChanges();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        component = null;
        element = null;
        fixture = null;
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.queryAll(By.css('.hierarchy-filter')).length).toEqual(1);
        });
        it('with an a', function() {
            expect(element.queryAll(By.css('a')).length).toEqual(1);
        });
        it('with a mat-menu', function() {
            expect(element.queryAll(By.css('mat-menu')).length).toEqual(1);
        });
        it('after clicking the button', function() {
            component.filters = [
                { checked: true, flag: true, name: 'filter1', filter: () => true }, 
                { checked: false, flag: false, name: 'filter2', filter: () => true }
            ];
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-menu-panel')).length).toEqual(0);
            const button = element.query(By.css('a.mat-icon-button'));
            button.triggerEventHandler('click', null);
            fixture.detectChanges();
            expect(element.queryAll(By.css('.mat-menu-panel')).length).toEqual(1);
            expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(2);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            this.filter = { checked: true, flag: false, name: '', filter: () => true };
        });
        it('should update flag with checked value in this and parent scopes on apply', function() {
            spyOn(component.updateFilters, 'emit');
            component.filters = [this.filter];
            component.apply();

            expect(component.filters).toEqual([this.filter]);
            expect(component.updateFilters.emit).toHaveBeenCalledWith([this.filter]);
        });
        it('should set numFilters to number of flagged filters on apply', function() {
            component.numFilters = 0;
            component.filters = [this.filter];
            component.apply();

            expect(component.numFilters).toEqual(1);
        });
        it('should perform a filter on apply', function() {
            spyOn(component.submitEvent, 'emit');
            component.numFilters = 0;
            component.filters = [this.filter];
            component.apply();

            expect(component.submitEvent.emit).toHaveBeenCalledWith();
        });
        it('should set dropdown to closed on apply', function() {
            spyOn(component.trigger, 'closeMenu');
            component.filters = [this.filter];
            component.apply();
            expect(component.trigger.closeMenu).toHaveBeenCalledWith();
        });
        it('should reset checked values with flagged values when dropdown is closed', function() {
            component.filters = [this.filter];
            component.dropdownClosed();
            component.filters.forEach(filter => {
                expect(filter.flag).toEqual(filter.checked);
            });
        });
    });
});
