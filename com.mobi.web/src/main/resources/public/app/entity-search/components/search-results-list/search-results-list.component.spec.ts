/* eslint-disable jasmine/no-focused-tests */
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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { By } from '@angular/platform-browser';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { CATALOG, ONTOLOGYEDITOR } from '../../../prefixes';
import { EntityRecord } from '../../models/entity-record';
import { EntitySearchFiltersComponent } from '../entity-search-filters/entity-search-filters.component';
import { FiltersSelectedListComponent } from '../../../shared/components/filters-selected-list/filters-selected-list.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { RecordIconComponent } from '../../../shared/components/recordIcon/recordIcon.component';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { SearchResultItemComponent } from '../search-result-item/search-result-item.component';
import { SearchResultsMock } from '../../mock-data/search-results.mock';
import { SelectedEntityFilters } from '../../models/selected-entity-filters.interface';
import { SearchResultsListComponent } from './search-results-list.component';
import { MatSelectModule } from '@angular/material/select';

describe('SearchResultsListComponent', () => {
  let component: SearchResultsListComponent;
  let fixture: ComponentFixture<SearchResultsListComponent>;
  let element: DebugElement;
  let searchStateStub: jasmine.SpyObj<EntitySearchStateService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  
  const entityRecords: EntityRecord[] = SearchResultsMock;
  const catalogId = 'http://mobi.com/catalog-local';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        SearchResultsListComponent,
        MockComponent(RecordIconComponent),
        MockComponent(SearchBarComponent),
        MockComponent(SearchResultItemComponent),
        MockComponent(EntitySearchFiltersComponent),
        MockComponent(FiltersSelectedListComponent),
        MockComponent(InfoMessageComponent),
      ],
      providers: [
        MockProvider(EntitySearchStateService),
        MockProvider(CatalogStateService),
        MockProvider(CatalogManagerService)
      ],
      imports: [
        NoopAnimationsModule,
        MatPaginatorModule,
        MatSelectModule
      ]
    }).compileComponents();

    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {
      '@id': catalogId,
      '@type': [`${CATALOG}Catalog`]
    };
    searchStateStub = TestBed.inject(EntitySearchStateService) as jasmine.SpyObj<EntitySearchStateService>;
    
    searchStateStub.paginationConfig = {
      limit: 10,
      pageIndex: 0,
      searchText: '',
      sortOption: {
        field: 'entityName',
        asc: true,
        label: 'Entity Name (desc)'
      }
    };
    fixture = TestBed.createComponent(SearchResultsListComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    fixture = null;
    component = null;
    element = null;
    catalogManagerStub = null;
    searchStateStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize with the correct values', fakeAsync(() => {
    searchStateStub.currentResults = entityRecords;
    searchStateStub.paginationConfig.searchText = 'test';
    searchStateStub.paginationConfig.type = [`${ONTOLOGYEDITOR}OntologyRecord`];
    searchStateStub.paginationConfig.keywords = ['keyword1', 'keyword2'];
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.searchText).toEqual('test');
    expect(component.selectedFilters).toEqual({
      chosenTypes: [{ value: `${ONTOLOGYEDITOR}OntologyRecord`, display: 'Ontology Record', checked: true }],
      keywordFilterItems: [
        { value: 'keyword1', display: 'keyword1', checked: true },
        { value: 'keyword2', display: 'keyword2', checked: true }
      ]
    });
    expect(searchStateStub.setResults).not.toHaveBeenCalled();
    expect(component.searchResult).toBeDefined();
    component.searchResult.subscribe(searchResult => {
      expect(searchResult).toBeDefined();
      expect(searchResult.length).toEqual(entityRecords.length);
      expect(searchResult).toEqual(entityRecords);
    });
    tick();
  }));
  describe('controller method', function () {
    it('should set results on getResultPage', () => {
      searchStateStub.setResults.and.returnValue(of(entityRecords));
      searchStateStub.paginationConfig.searchText = 'test';
      const pageEvent = new PageEvent();
      pageEvent.pageIndex = 0;
  
      component.getResultPage(pageEvent);
      expect(searchStateStub.setResults).toHaveBeenCalledWith(catalogId);
    });
    it('should set pagination filters and reload data on changeFilter', () => {
      component.searchText = 'searchText';
      const filters: SelectedEntityFilters = {
        chosenTypes: [{ value: 'type1', display: 'type1', checked: false}],
        keywordFilterItems: [{ value: 'keyword1',  display: 'keyword1', checked: false }],
      };
      component.changeFilter(filters);
      expect(searchStateStub.resetPagination).toHaveBeenCalledWith();
      expect(searchStateStub.paginationConfig.type).toEqual(['type1']);
      expect(searchStateStub.paginationConfig.keywords).toEqual(['keyword1']);
      expect(searchStateStub.setResults).toHaveBeenCalledWith(catalogId);
    });
    it('should reset pagination and load data on searchRecords', () => {
      spyOn<any>(component, '_loadData');
      component.searchRecords();
      expect(searchStateStub.resetPagination).toHaveBeenCalledWith();
      expect(component['_loadData']).toHaveBeenCalledWith();
    });
    it('should load data when searchText is present', () => {
      component.searchText = 'test';
      component['_loadData']();
      expect(searchStateStub.setResults).toHaveBeenCalledWith(catalogId);
    });
    it('should clear results when searchText is not present', () => {
      component.searchText = '';
      component['_loadData']();
      component.searchResult.subscribe((list) => {
        expect(list).toEqual([]);
      });
    });
    it('should update pageIndex and fetch results on getResultPage', () => {
      const pageEvent = { pageIndex: 2 } as any;
      searchStateStub.paginationConfig = { pageIndex: 0 } as any;
      component.getResultPage(pageEvent);
      expect(searchStateStub.paginationConfig.pageIndex).toBe(2);
      expect(searchStateStub.setResults).toHaveBeenCalledWith(catalogId);
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('.search-results')).length).toEqual(1);
    });
    ['.entity-results-list', 'search-bar', 'info-message', 'mat-paginator','app-filters-selected-list', 'mat-form-field'].forEach(function (test) {
      it(`with a ${test}`, function () {
        expect(element.queryAll(By.css(test)).length).toEqual(1);
      });
    });
    it('should display a list', async () => {
      component.ngOnInit();
      component.searchText = 'test';
      component.searchResult = of(entityRecords);
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-search-result-item')).length).toEqual(entityRecords.length);
    });
  });
});