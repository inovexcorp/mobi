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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { CATALOG } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { FiltersSelectedListComponent } from '../../../shared/components/filters-selected-list/filters-selected-list.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RecordCardComponent } from '../recordCard/recordCard.component';
import { RecordFiltersComponent } from '../recordFilters/recordFilters.component';
import { SearchBarComponent } from '../../../shared/components/searchBar/searchBar.component';
import { SelectedRecordFilters } from '../../models/selected-record-filters.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { RecordsViewComponent } from './recordsView.component';

describe('Records View component', () => {
  let component: RecordsViewComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<RecordsViewComponent>;
  let catalogStateStub: jasmine.SpyObj<CatalogStateService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const catalogId = 'catalogId';
  const recordId = 'recordId';
  const record: JSONLDObject = {
    '@id': recordId,
    '@type': []
  };
  const sortOption: SortOption = {
    'asc': true,
    'label': '',
    'field': ''
  };
  const totalSize = 10;
  const headers = {'x-total-count': '' + totalSize};
  const records = [record];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ 
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        MatPaginatorModule
       ],
      declarations: [
        RecordsViewComponent,
        MockComponent(InfoMessageComponent),
        MockComponent(RecordFiltersComponent),
        MockComponent(RecordCardComponent),
        MockComponent(SearchBarComponent),
        MockComponent(FiltersSelectedListComponent)
      ],
      providers: [
        MockProvider(CatalogManagerService),
        MockProvider(CatalogStateService),
        MockProvider(ToastService)
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordsViewComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    catalogStateStub = TestBed.inject(CatalogStateService) as jasmine.SpyObj<CatalogStateService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
    catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: records, headers: new HttpHeaders(headers)})));
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    catalogStateStub = null;
    catalogManagerStub = null;
    toastStub = null;
  });

  describe('should initialize', () => {
    it('with the list of records', () => {
      spyOn(component, 'setRecords');
      component.ngOnInit();
      expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, catalogStateStub.recordTypeFilterList, catalogStateStub.keywordFilterList, catalogStateStub.creatorFilterList, catalogStateStub.recordSortOption);
      expect(catalogStateStub.currentRecordPage).toEqual(0);
    });
    it('with the currently selected record filters', () => {
      spyOn(component, 'setRecords');
      catalogStateStub.recordTypeFilterList = [{ value: 'test', display: '', checked: true }];
      catalogStateStub.keywordFilterList = [{ value: 'keyword1', display: '', checked: true }];
      catalogStateStub.creatorFilterList = [{ value: 'urn:userA', display: '', checked: true }];
      component.ngOnInit();
      expect(component.selectedFilters).toEqual({
        recordTypeFilterList: catalogStateStub.recordTypeFilterList, 
        keywordFilterList: catalogStateStub.keywordFilterList, 
        creatorFilterList: catalogStateStub.creatorFilterList
      });
    });
  });
  describe('controller methods', () => {
    it('should open a Record', () => {
      component.openRecord(record);
      expect(catalogStateStub.selectedRecord).toEqual(record);
    });
    it('should change the sort', () => {
      catalogStateStub.recordSortOption = sortOption;
      spyOn(component, 'setRecords');
      component.changeSort();
      expect(catalogStateStub.currentRecordPage).toEqual(0);
      expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, catalogStateStub.recordTypeFilterList, catalogStateStub.keywordFilterList, catalogStateStub.creatorFilterList, sortOption);
    });
    it('should change the filter', () => {
      spyOn(component, 'setRecords');
      const selectedFilters: SelectedRecordFilters = {
        recordTypeFilterList: [{ value: 'test', display: '', checked: true }], 
        keywordFilterList: [{ value: 'keyword1', display: 'keyword1 (1)', checked: true }], 
        creatorFilterList: [{ value: 'urn:userA', display: 'UserA (2)', checked: true }]
      };
      component.changeFilter(selectedFilters);
      expect(component.selectedFilters).toBeDefined();
      expect(component.selectedFilters.recordTypeFilterList).toEqual(selectedFilters.recordTypeFilterList);
      expect(component.selectedFilters.keywordFilterList).toEqual([{ value: 'keyword1', display: 'keyword1', checked: true }]);
      expect(component.selectedFilters.creatorFilterList).toEqual([{ value: 'urn:userA', display: 'UserA', checked: true }]);
      expect(catalogStateStub.currentRecordPage).toEqual(0);
      expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, selectedFilters.recordTypeFilterList, selectedFilters.keywordFilterList, selectedFilters.creatorFilterList, catalogStateStub.recordSortOption);
    });
    it('should search for records', () => {
      spyOn(component, 'search');
      component.searchRecords();
      expect(component.search).toHaveBeenCalledWith(catalogStateStub.recordSearchText);
    });
    it('should search for records with a provided search text', () => {
      spyOn(component, 'setRecords');
      component.search('test');
      expect(catalogStateStub.currentRecordPage).toEqual(0);
      expect(component.setRecords).toHaveBeenCalledWith('test', catalogStateStub.recordTypeFilterList, catalogStateStub.keywordFilterList, catalogStateStub.creatorFilterList, catalogStateStub.recordSortOption);
    });
    it('should get the provided page of records', () => {
      const event = new PageEvent();
      event.pageIndex = 10;
      spyOn(component, 'setRecords');
      component.getRecordPage(event);
      expect(catalogStateStub.currentRecordPage).toEqual(10);
      expect(component.setRecords).toHaveBeenCalledWith(catalogStateStub.recordSearchText, catalogStateStub.recordTypeFilterList, catalogStateStub.keywordFilterList, catalogStateStub.creatorFilterList, catalogStateStub.recordSortOption);
    });
    describe('should set the list of records', () => {
      const searchText = 'search';
      const recordTypes: FilterItem[] = [{ value: 'type', display: '', checked: true }];
      const keywords: FilterItem[] = [{ value: {[`${CATALOG}keyword`]: 'keyword1'}, display: '', checked: true }];
      const creators: FilterItem[] = [{ value: {user: {iri: 'urn:userA'}}, display: '', checked: true }];
      beforeEach(() => {
        catalogStateStub.recordTypeFilterList = [];
        catalogStateStub.keywordFilterList = [];
        catalogStateStub.creatorFilterList = [];
        catalogStateStub.recordSearchText = '';
        catalogStateStub.recordSortOption = undefined;
        catalogStateStub.totalRecordSize = 0;
        component.records = [];
        component.catalogId = catalogId;
      });
      it('if getRecords resolves', fakeAsync(() => {
        component.setRecords(searchText, recordTypes, keywords, creators, sortOption);
        tick();
        expect(catalogManagerStub.getRecords).toHaveBeenCalledWith(catalogId, {
          pageIndex: catalogStateStub.currentRecordPage,
          limit: catalogStateStub.recordLimit,
          sortOption: sortOption,
          type: ['type'],
          searchText: searchText,
          keywords: ['keyword1'],
          creators: ['urn:userA']
        });
        expect(catalogStateStub.recordTypeFilterList).toEqual(recordTypes);
        expect(catalogStateStub.keywordFilterList).toEqual(keywords);
        expect(catalogStateStub.creatorFilterList).toEqual(creators);
        expect(catalogStateStub.recordSearchText).toEqual(searchText);
        expect(catalogStateStub.recordSortOption).toEqual(sortOption);
        expect(catalogStateStub.totalRecordSize).toEqual(totalSize);
        expect(component.records).toEqual([record]);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless getRecords rejects', fakeAsync(() => {
        catalogManagerStub.getRecords.and.returnValue(throwError('Error Message'));
        component.setRecords(searchText, recordTypes, keywords, creators, sortOption);
        tick();
        expect(catalogStateStub.recordTypeFilterList).toEqual([]);
        expect(catalogStateStub.keywordFilterList).toEqual([]);
        expect(catalogStateStub.creatorFilterList).toEqual([]);
        expect(catalogStateStub.recordSearchText).toEqual('');
        expect(catalogStateStub.recordSortOption).toBeUndefined();
        expect(catalogStateStub.totalRecordSize).toEqual(0);
        expect(component.records).toEqual([]);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error Message');
      }));
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.records-view')).length).toEqual(1);
    });
    ['mat-paginator', 'search-bar', 'record-filters'].forEach(test => {
      it(`with a ${test}`, () => {
        expect(element.queryAll(By.css(test)).length).toBe(1);
      });
    });
    it('with a select for sort options', () => {
      expect(element.queryAll(By.css('mat-form-field mat-select')).length).toEqual(1);
    });
    it('depending on how many records match the current query', () => {
      fixture.detectChanges();
      expect(element.queryAll(By.css('record-card')).length).toEqual(records.length);
      expect(element.queryAll(By.css('info-message')).length).toEqual(0);
      
      component.records = [];
      fixture.detectChanges();
      expect(element.queryAll(By.css('record-card')).length).toEqual(0);
      expect(element.queryAll(By.css('info-message')).length).toEqual(1);
    });
  });
});
