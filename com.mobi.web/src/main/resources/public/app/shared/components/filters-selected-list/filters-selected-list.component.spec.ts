/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FilterItem, SelectedFilterItems } from '../../models/filterItem.interface';
import { FiltersSelectedListComponent } from './filters-selected-list.component';

describe('FiltersSelectedListComponent', () => {
  let component: FiltersSelectedListComponent;
  let fixture: ComponentFixture<FiltersSelectedListComponent>;
  let element: DebugElement;
  let selectedFilters: SelectedFilterItems;

  const item1: FilterItem = { value: 'Value1', display: 'Value 1', checked: true};
  const item2: FilterItem = { value: 'Value2', display: 'Value 2', checked: true};
  const item3: FilterItem = { value: 'Value3', display: 'Value 3', checked: true};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FiltersSelectedListComponent],
      imports: [
        NoopAnimationsModule,
        FormsModule,
        MatChipsModule,
        MatIconModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FiltersSelectedListComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    selectedFilters = {
      Filter1: item1,
      Filter2: [item2, item3],
      Filter3: undefined
    };
    component.selectedFilters = selectedFilters;
    fixture.detectChanges();
  });

  afterEach(() => {
    component = null;
    fixture = null;
    element = null;
    selectedFilters = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should set variables when selected filters change', () => {
    expect(component.selectedFilters).toEqual(selectedFilters);
    expect(component.filterChips).toEqual([
      { key: 'Filter1', item: item1 },
      { key: 'Filter2', item: item2 },
      { key: 'Filter2', item: item3 }
    ]);
  });
  describe('Component methods', () => {
    describe('should remove filter and emit event', () => {
      beforeEach(() => {
        spyOn(component.selectedFiltersChange, 'emit');
      });
      it('if the chip is from a single value filter', () => {
        expect(component.filterChips).toContain(jasmine.objectContaining({item: item1}));
        expect(element.queryAll(By.css('mat-chip')).length).toEqual(3);
        const expectedSelectedFilters: SelectedFilterItems = {
          Filter1: undefined,
          Filter2: [item2, item3],
          Filter3: undefined
        };
        
        component.removeFilter(component.filterChips[0], 0);
        expect(component.filterChips).not.toContain(jasmine.objectContaining({item: item1}));
        expect(component.selectedFilters).toEqual(expectedSelectedFilters);
        expect(component.selectedFiltersChange.emit).toHaveBeenCalledWith(expectedSelectedFilters);
        fixture.detectChanges();
        expect(element.queryAll(By.css('mat-chip')).length).toEqual(2);
      });
      it('if the chip is from a multi-value filter', () => {
        expect(component.filterChips).toContain(jasmine.objectContaining({item: item2}));
        expect(element.queryAll(By.css('mat-chip')).length).toEqual(3);
        const expectedSelectedFilters: SelectedFilterItems = {
          Filter1: item1,
          Filter2: [item3],
          Filter3: undefined
        };
        
        component.removeFilter(component.filterChips[1], 1);
        expect(component.filterChips).not.toContain(jasmine.objectContaining({item: item2}));
        expect(component.selectedFilters).toEqual(expectedSelectedFilters);
        expect(component.selectedFiltersChange.emit).toHaveBeenCalledWith(expectedSelectedFilters);
        fixture.detectChanges();
        expect(element.queryAll(By.css('mat-chip')).length).toEqual(2);
      });
    });
    it('should reset all selected filters', () => {
      spyOn(component.selectedFiltersChange, 'emit');
      expect(component.filterChips).toContain(jasmine.objectContaining({item: item1}));
      expect(element.queryAll(By.css('mat-chip')).length).toEqual(3);
      const expectedSelectedFilters: SelectedFilterItems = {
        Filter1: undefined,
        Filter2: [],
        Filter3: undefined
      };

      component.reset();
      expect(component.filterChips).toEqual([]);
      expect(component.selectedFilters).toEqual(expectedSelectedFilters);
      expect(component.selectedFiltersChange.emit).toHaveBeenCalledWith(expectedSelectedFilters);
      fixture.detectChanges();
      expect(element.queryAll(By.css('mat-chip')).length).toEqual(0);
    });
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('.filters-selected-list')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-chip-list')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-chip')).length).toEqual(component.filterChips.length);
    });
  });
});
