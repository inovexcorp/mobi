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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { cloneDeep } from 'lodash';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { DELIM, ONTOLOGYEDITOR, SHAPESGRAPHEDITOR, WORKFLOWS } from '../../../prefixes';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { ListFilter } from '../../../shared/models/list-filter.interface';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';
import { SelectedEntityFilters } from '../../models/selected-entity-filters.interface';
import { EntitySearchFiltersComponent } from './entity-search-filters.component';

describe('Entity Search Filters component', () => {
  let component: EntitySearchFiltersComponent;
  let fixture: ComponentFixture<EntitySearchFiltersComponent>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

  let recordTypeFilter: ListFilter;
  let keywordsFilter: SearchableListFilter;

  const ontRecordFilterItem: FilterItem = {
    value: `${ONTOLOGYEDITOR}OntologyRecord`,
    display: 'Ontology Record',
    checked: true
  };
  const keyword1FilterItem: FilterItem = {
    value: 'keyword1',
    display: 'keyword1',
    checked: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        EntitySearchFiltersComponent,
        MockComponent(ListFiltersComponent)
      ],
      providers: [
        MockProvider(EntitySearchStateService),
        MockProvider(CatalogManagerService),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySearchFiltersComponent);
    component = fixture.componentInstance;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;

    const keywordObject = function (keyword, count): KeywordCount {
      return {['http://mobi.com/ontologies/catalog#keyword']: keyword, 'count': count};
    };
    const keyword = 'keyword1';
    const keywords = [keywordObject(keyword, 6)];
    const totalSize = 1;
    const headers = {'x-total-count': '' + totalSize};
    catalogManagerStub.getKeywords.and.returnValue(of(new HttpResponse<KeywordCount[]>({
      body: keywords,
      headers: new HttpHeaders(headers)
    })));

    fixture.detectChanges();
  });

  afterEach(() => {
    component = null;
    fixture = null;
    recordTypeFilter = null;
    keywordsFilter = null;
  });

  describe('initializes correctly', () => {
    beforeEach(() => {
      component.typeFilters = [ontRecordFilterItem];
      spyOn(component.changeFilter, 'emit');
      component.ngOnInit();
      recordTypeFilter = component.filters[component.recordFilterIndex];
      keywordsFilter = component.filters[component.keywordFilterIndex] as SearchableListFilter;
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
    it('with keywordFilterItems filter', () => {
      const expectedFilterItems: FilterItem[] = [
        {value: `keyword1`, display: 'keyword1', checked: false},
      ];

      component.ngOnInit();
      expect(keywordsFilter.filterItems).toEqual(expectedFilterItems);
    });
  });
  describe('has working filter methods', () => {
    beforeEach(() => {
      spyOn(component.changeFilter, 'emit');
      component.typeFilters = [cloneDeep(ontRecordFilterItem)];
      component.keywordFilterItems = [cloneDeep(keyword1FilterItem)];
      component.ngOnInit();
      recordTypeFilter = component.filters[component.recordFilterIndex];
      keywordsFilter = component.filters[component.keywordFilterIndex] as SearchableListFilter;
    });
    describe('for the recordTypeFilter', () => {
      it('if the item has been checked', () => {
        const clickedFilterItem: FilterItem = {value: `${WORKFLOWS}WorkflowRecord`, display: 'Workflow Record', checked: true};
        recordTypeFilter.filter(clickedFilterItem);

        const expectedChangeFilter: SelectedEntityFilters = { 
          chosenTypes: [ontRecordFilterItem, clickedFilterItem], 
          keywordFilterItems: [keyword1FilterItem] 
        };
        expect(component.changeFilter.emit).toHaveBeenCalledWith(expectedChangeFilter);
      });
      it('if the item was unchecked', () => {
        const clickedFilterItem = cloneDeep(ontRecordFilterItem);
        clickedFilterItem.checked = false;
        recordTypeFilter.filter(clickedFilterItem);

        const expectedChangeFilter: SelectedEntityFilters = {
          chosenTypes: [], 
          keywordFilterItems: [keyword1FilterItem]
        };
        expect(component.changeFilter.emit).toHaveBeenCalledWith(expectedChangeFilter);
      });
    });
    describe('for the keywordsFilter', () => {
      it('if the item has been checked', () => {
        const clickedFilterItem: FilterItem = {value: `keyword2`, display: 'keyword2', checked: true};
        keywordsFilter.filter(clickedFilterItem);

        const expectedChangeFilter: SelectedEntityFilters = { 
          chosenTypes: [ontRecordFilterItem], 
          keywordFilterItems: [keyword1FilterItem, clickedFilterItem] 
        };
        expect(component.changeFilter.emit).toHaveBeenCalledWith(expectedChangeFilter);
      });
      it('if the item was unchecked', () => {
        const clickedFilterItem = cloneDeep(keyword1FilterItem);
        clickedFilterItem.checked = false;
        keywordsFilter.filter(clickedFilterItem);

        const expectedChangeFilter: SelectedEntityFilters = {
          chosenTypes: [ontRecordFilterItem], 
          keywordFilterItems: []
        };
        expect(component.changeFilter.emit).toHaveBeenCalledWith(expectedChangeFilter);
      });
    });
    describe('reset methods', () => {
      it('should reset record type filter', () => {
        recordTypeFilter.reset();
        const expectedChangeFilter: SelectedEntityFilters = {
          chosenTypes: [], 
          keywordFilterItems: [keyword1FilterItem]
        };
        expect(component.changeFilter.emit).toHaveBeenCalledWith(expectedChangeFilter);
      });
      it('should reset keywordsFilter', () => {
        keywordsFilter.reset();
        const expectedChangeFilter: SelectedEntityFilters = {
          chosenTypes: [ontRecordFilterItem], 
          keywordFilterItems: []
        };
        expect(component.changeFilter.emit).toHaveBeenCalledWith(expectedChangeFilter);
      });
    });
    it('should update the selectedRecordTypes and numChecked on updateList call', () => {
      const ontologyRecordActualItem = recordTypeFilter.filterItems.find(item => item.value === `${ONTOLOGYEDITOR}OntologyRecord`);
      expect(ontologyRecordActualItem).toBeDefined();
      expect(ontologyRecordActualItem.checked).toBeTrue();
      expect(recordTypeFilter.numChecked).toEqual(1);

      component.updateFilterList(component.recordFilterIndex, [], [ontRecordFilterItem]);
      expect(ontologyRecordActualItem.checked).toBeFalse();
      expect(recordTypeFilter.numChecked).toEqual(0);
    });
    it('should update the selectedKeyword and numChecked on updateList call', () => {
      const keywordActualItem = keywordsFilter.filterItems.find(item => item.value === 'keyword1');
      expect(keywordActualItem).toBeDefined();
      expect(keywordActualItem.checked).toBeTrue();
      expect(keywordsFilter.numChecked).toEqual(1);

      component.updateFilterList(component.keywordFilterIndex, [], [{value: 'keyword1', checked: false, display: 'keyword1'}]);
      expect(keywordActualItem.checked).toBeFalse();
      expect(keywordsFilter.numChecked).toEqual(0);
    });
  });
});