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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent } from 'ng-mocks';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { FilterItem } from '../../models/filterItem.interface';
import { FilterType, ListFilter } from '../../models/list-filter.interface';
import { InfoMessageComponent } from '../infoMessage/infoMessage.component';
import { SearchableListFilter } from '../../models/searchable-list-filter.interface';
import { SearchBarComponent } from '../searchBar/searchBar.component';
import { ListFiltersComponent } from './list-filters.component';

describe('ListFiltersComponent', () => {
  let component: ListFiltersComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<ListFiltersComponent>;

  let radioFilter: ListFilter;
  let simpleCheckboxFilter: ListFilter;
  let emptyCheckboxFilter: ListFilter;
  let searchableCheckboxFilter: SearchableListFilter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatRadioModule
      ],
      declarations: [
        ListFiltersComponent,
        MockComponent(SearchBarComponent),
        MockComponent(InfoMessageComponent)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListFiltersComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;

    radioFilter = {
      title: 'Radio',
      type: FilterType.RADIO,
      hide: false,
      pageable: false,
      searchable: false,
      filterItems: [
        { value: 'Radio 1', display: 'Radio 1', checked: true },
        { value: 'Radio 2', display: 'Radio 2', checked: false }
      ],
      numChecked: 0,
      onInit: function(): void {
        throw new Error('Function not implemented.');
      },
      setFilterItems: function(): void {
        throw new Error('Function not implemented.');
      },
      filter: jasmine.createSpy('filter')
    };
    simpleCheckboxFilter = {
      title: 'Simple Checkbox',
      type: FilterType.CHECKBOX,
      hide: false,
      pageable: false,
      searchable: false,
      filterItems: [
        { value: 'Checkbox A', display: 'Checkbox A', checked: true },
        { value: 'Checkbox B', display: 'Checkbox A', checked: false },
      ],
      numChecked: 1,
      onInit: function(): void {
        throw new Error('Function not implemented.');
      },
      setFilterItems: function(): void {
        throw new Error('Function not implemented.');
      },
      filter: function(): void {
        throw new Error('Function not implemented.');
      }
    };
    emptyCheckboxFilter = {
      title: 'Empty Checkbox',
      type: FilterType.CHECKBOX,
      hide: false,
      pageable: false,
      searchable: false,
      filterItems: [],
      numChecked: 0,
      onInit: function(): void {
        throw new Error('Function not implemented.');
      },
      setFilterItems: function(): void {
        throw new Error('Function not implemented.');
      },
      filter: function(): void {
        throw new Error('Function not implemented.');
      }
    };
    searchableCheckboxFilter = {
      title: 'Searchable Checkbox',
      type: FilterType.CHECKBOX,
      hide: false,
      pageable: true,
      searchable: true,
      filterItems: [
        { value: 'Searchable A', display: 'Searchable A', checked: false },
        { value: 'Searchable B', display: 'Searchable A', checked: false },
        { value: 'Searchable C', display: 'Searchable A', checked: false },
        { value: 'Searchable D', display: 'Searchable A', checked: false },
        { value: 'Searchable E', display: 'Searchable A', checked: false },
      ],
      numChecked: 0,
      pagingData: {
        limit: 5,
        totalSize: 10,
        pageIndex: 0,
        hasNextPage: true
      },
      rawFilterItems: [],
      searchModel: '',
      searchChanged: jasmine.createSpy('searchChanged'),
      searchSubmitted: jasmine.createSpy('searchSubmitted'),
      nextPage: jasmine.createSpy('nextPage'),
      onInit: function(): void {
        throw new Error('Function not implemented.');
      },
      setFilterItems: function (): void {
        throw new Error('Function not implemented.');
      },
      filter: jasmine.createSpy('filter'),
      reset() {
        this.filterItems.forEach((element: FilterItem) => {
          element.checked = false; 
        });
        this.numChecked = 0;
      },
    };
    component.filters = [
      radioFilter,
      simpleCheckboxFilter,
      emptyCheckboxFilter,
      searchableCheckboxFilter
    ];
    fixture.detectChanges();
  });

  afterEach(() => {
      cleanStylesFromDOM();
      component = null;
      element = null;
      fixture = null;
      radioFilter = null;
      simpleCheckboxFilter = null;
      emptyCheckboxFilter = null;
      searchableCheckboxFilter = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controllers method', () => {
    it('should reset the filter when reset method is called', () => {
      const event = jasmine.createSpyObj('PointerEvent', ['preventDefault', 'stopPropagation']);
      const mockFilter: Partial<ListFilter> = {
        reset: jasmine.createSpy('reset'),
      };
      component.reset(event as PointerEvent, mockFilter as ListFilter);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockFilter.reset).toHaveBeenCalled();
    });
    it('should not throw error if reset method is not available on filter', () => {
      const event = jasmine.createSpyObj('PointerEvent', ['preventDefault', 'stopPropagation']);
      const mockFilter: Partial<ListFilter> = {};
      expect(() => component.reset(event as PointerEvent, mockFilter as ListFilter)).not.toThrow();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', function() {
        expect(element.queryAll(By.css('.list-filters')).length).toEqual(1);
    });
    it('depending on the number of filters', () => {
      expect(element.queryAll(By.css('mat-expansion-panel')).length).toEqual(4);
    });
    it('for a radio type filter', () => {
      const panel = element.queryAll(By.css('mat-expansion-panel'))[0];
      expect(panel).toBeTruthy();
      const panelTitle = panel.queryAll(By.css('mat-panel-title .filter-panel-title'))[0];
      expect(panelTitle).toBeTruthy();
      expect(panelTitle.nativeElement.textContent.trim()).toEqual(radioFilter.title);
      expect(panel.queryAll(By.css('mat-panel-title .filter-reset-button-container')).length).toEqual(0);
      expect(panel.queryAll(By.css('search-bar')).length).toEqual(0);
      expect(panel.queryAll(By.css('info-message')).length).toEqual(0);
      expect(panel.queryAll(By.css('.filter-radio-items')).length).toEqual(1);
      expect(panel.queryAll(By.css('.filter-checkbox-items')).length).toEqual(0);
      expect(panel.queryAll(By.css('.filter-radio-items mat-radio-button')).length).toEqual(radioFilter.filterItems.length);
      expect(panel.queryAll(By.css('.paging-link')).length).toEqual(0);
    });
    it('for a simple checkbox filter', () => {
      const panel = element.queryAll(By.css('mat-expansion-panel'))[1];
      expect(panel).toBeTruthy();
      const panelTitle = panel.queryAll(By.css('mat-panel-title .filter-panel-title'))[0];
      expect(panelTitle).toBeTruthy();
      expect(panelTitle.nativeElement.textContent.trim()).toEqual(`${simpleCheckboxFilter.title} (${simpleCheckboxFilter.numChecked})`);
      expect(panel.queryAll(By.css('mat-panel-title .filter-reset-button-container')).length).toEqual(0);
      expect(panel.queryAll(By.css('search-bar')).length).toEqual(0);
      expect(panel.queryAll(By.css('info-message')).length).toEqual(0);
      expect(panel.queryAll(By.css('.filter-radio-items')).length).toEqual(0);
      expect(panel.queryAll(By.css('.filter-checkbox-items')).length).toEqual(1);
      expect(panel.queryAll(By.css('.filter-checkbox-items .filter-option mat-checkbox')).length).toEqual(simpleCheckboxFilter.filterItems.length);
      expect(panel.queryAll(By.css('.paging-link')).length).toEqual(0);
    });
    it('for an empty checkbox filter', () => {
      const panel = element.queryAll(By.css('mat-expansion-panel'))[2];
      expect(panel).toBeTruthy();
      const panelTitle = panel.queryAll(By.css('mat-panel-title .filter-panel-title'))[0];
      expect(panelTitle).toBeTruthy();
      expect(panelTitle.nativeElement.textContent.trim()).toEqual(emptyCheckboxFilter.title);
      expect(panel.queryAll(By.css('mat-panel-title .filter-reset-button-container')).length).toEqual(0);
      expect(panel.queryAll(By.css('search-bar')).length).toEqual(0);
      expect(panel.queryAll(By.css('info-message')).length).toEqual(1);
      expect(panel.queryAll(By.css('.filter-radio-items')).length).toEqual(0);
      expect(panel.queryAll(By.css('.filter-checkbox-items')).length).toEqual(1);
      expect(panel.queryAll(By.css('.filter-checkbox-items .filter-option mat-checkbox')).length).toEqual(0);
      expect(panel.queryAll(By.css('.paging-link')).length).toEqual(0);
    });
    it('for a searchable checkbox', () => {
      const panel = element.queryAll(By.css('mat-expansion-panel'))[3];
      expect(panel).toBeTruthy();
      const panelTitle = panel.queryAll(By.css('mat-panel-title .filter-panel-title'))[0];
      expect(panelTitle).toBeTruthy();
      expect(panelTitle.nativeElement.textContent.trim()).toEqual(searchableCheckboxFilter.title);
      expect(panel.queryAll(By.css('mat-panel-title .filter-reset-button-container')).length).toEqual(1);
      expect(panel.queryAll(By.css('search-bar')).length).toEqual(1);
      expect(panel.queryAll(By.css('info-message')).length).toEqual(0);
      expect(panel.queryAll(By.css('.filter-radio-items')).length).toEqual(0);
      expect(panel.queryAll(By.css('.filter-checkbox-items')).length).toEqual(1);
      expect(panel.queryAll(By.css('.filter-checkbox-items .filter-option mat-checkbox')).length).toEqual(searchableCheckboxFilter.filterItems.length);
      expect(panel.queryAll(By.css('.paging-link')).length).toEqual(1);
    });
    it('should handle loading more filter options', () => {
      const link = element.queryAll(By.css('.paging-link'))[0];
      expect(link).toBeTruthy();
      link.triggerEventHandler(null);
      expect(searchableCheckboxFilter.pagingData.pageIndex).toEqual(1);
      expect(searchableCheckboxFilter.nextPage).toHaveBeenCalledWith();
    });
  });
  describe('contains correct html bindings', () => {
    it('should call reset method when the reset button is clicked', () => {
      spyOn(searchableCheckboxFilter, 'reset');
      searchableCheckboxFilter.numChecked = 2;
      component.filters = [searchableCheckboxFilter];
      fixture.detectChanges();

      const resetButton = fixture.debugElement.query(By.css('mat-panel-title .filter-reset-button-container button[mat-button]'));
      resetButton.triggerEventHandler('click', new PointerEvent('click'));
      expect(searchableCheckboxFilter.reset).toHaveBeenCalled();
    });
    it('should disable the reset button when numChecked is 0', () => {
      searchableCheckboxFilter.numChecked = 0;
      component.filters = [searchableCheckboxFilter];
      fixture.detectChanges();

      const resetButton = fixture.debugElement.query(By.css('mat-panel-title .filter-reset-button-container button[mat-button]'));
      const isDisabled = resetButton.properties['disabled'];
      expect(isDisabled).toBeTrue();
    });
    it('should enable the reset button when numChecked is greater than 0', () => {
      searchableCheckboxFilter.numChecked = 3;
      component.filters = [searchableCheckboxFilter];
      fixture.detectChanges();

      const resetButton = fixture.debugElement.query(By.css('mat-panel-title .filter-reset-button-container button[mat-button]'));
      const isDisabled = resetButton.properties['disabled'];
      expect(isDisabled).toBeFalse();
    });
  })
});
