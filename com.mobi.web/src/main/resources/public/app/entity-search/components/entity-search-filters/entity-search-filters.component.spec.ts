/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { MockComponent } from 'ng-mocks';
import { cloneDeep } from 'lodash';

import { DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { ListFilter } from '../../../shared/models/list-filter.interface';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { EntitySearchFiltersComponent } from './entity-search-filters.component';

describe('Entity Search Filters component', () => {
  let component: EntitySearchFiltersComponent;
  let fixture: ComponentFixture<EntitySearchFiltersComponent>;

  let recordTypeFilter: ListFilter;

  const ontRecordFilterItem: FilterItem = {
    value: `${ONTOLOGYEDITOR}OntologyRecord`,
    display: 'Ontology Record',
    checked: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EntitySearchFiltersComponent,
        MockComponent(ListFiltersComponent)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySearchFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component = null;
    fixture = null;
    recordTypeFilter = null;
  });

  describe('initializes correctly', () => {
    beforeEach(() => {
      component.typeFilters = [ontRecordFilterItem];
      spyOn(component.changeFilter, 'emit');
      component.ngOnInit();
      recordTypeFilter = component.filters[0];
    });
    it('with recordTypeFilter', () => {
      const expectedFilterItems: FilterItem[] = [
        ontRecordFilterItem,
        {value: `${WORKFLOWS}WorkflowRecord`, display: 'Workflow Record', checked: false},
        {value: `${DELIM}MappingRecord`, display: 'Mapping Record', checked: false},
        {value: `${SHAPESGRAPHEDITOR}ShapesGraphRecord`, display: 'Shapes Graph Record', checked: false},
      ];

      component.ngOnInit();
      expect(recordTypeFilter.filterItems).toEqual(expectedFilterItems);
    });
  });
  describe('has working filter methods', () => {
    beforeEach(() => {
      spyOn(component.changeFilter, 'emit');
      component.typeFilters = [ontRecordFilterItem];
      component.ngOnInit();
      recordTypeFilter = component.filters[0];
    });
    describe('for the recordTypeFilter', () => {
      it('if the item has been checked', () => {
        const clickedFilterItem: FilterItem = {value: `${WORKFLOWS}WorkflowRecord`, display: 'Workflow Record', checked: true};
        recordTypeFilter.filter(clickedFilterItem);

        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          chosenTypes: [ontRecordFilterItem, clickedFilterItem]
        });
      });
      it('if the item was unchecked', () => {
        const clickedFilterItem = cloneDeep(ontRecordFilterItem);
        clickedFilterItem.checked = false;
        recordTypeFilter.filter(clickedFilterItem);

        expect(component.changeFilter.emit).toHaveBeenCalledWith({chosenTypes: []});
      });
    });
    it('should update the selectedRecordTypes and numChecked on updateList call', () => {
      const ontologyRecordActualItem = recordTypeFilter.filterItems.find(item => item.value === `${ONTOLOGYEDITOR}OntologyRecord`);
      expect(ontologyRecordActualItem).toBeDefined();
      expect(ontologyRecordActualItem.checked).toBeTrue();
      expect(recordTypeFilter.numChecked).toEqual(1);

      component.updateFilterList([], [ontRecordFilterItem]);
      expect(ontologyRecordActualItem.checked).toBeFalse();
      expect(recordTypeFilter.numChecked).toEqual(0);
    });
  });
});
