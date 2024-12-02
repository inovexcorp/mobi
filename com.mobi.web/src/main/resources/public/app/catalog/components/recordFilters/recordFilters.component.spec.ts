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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { cloneDeep } from 'lodash';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { cleanStylesFromDOM } from '../../../../../public/test/ts/Shared';
import { DCTERMS, FOAF, USER } from '../../../prefixes';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { FilterType } from '../../../shared/models/list-filter.interface';
import { getBeautifulIRI } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { ToastService } from '../../../shared/services/toast.service';
import { User } from '../../../shared/models/user.class';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { RecordFiltersComponent } from './recordFilters.component';

describe('Record Filters component', function () {
  let component: RecordFiltersComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<RecordFiltersComponent>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let userManagerStub: jasmine.SpyObj<UserManagerService>;

  const catalogId = 'catalogId';
  const keyword = 'keyword1';
  const user: User = new User({
    '@id': 'urn:userA',
    '@type': [`${USER}User`],
    [`${USER}username`]: [{'@value': 'userA'}],
    [`${FOAF}firstName`]: [{'@value': 'Joe'}],
    [`${FOAF}lastName`]: [{'@value': 'Davis'}]
  });
  const keywordObject = function (keyword, count): KeywordCount {
    return {['http://mobi.com/ontologies/catalog#keyword']: keyword, 'count': count};
  };
  const totalSize = 10;
  const headers = {'x-total-count': '' + totalSize};
  const records: JSONLDObject[] = [{
    '@id': 'record1',
    [`${DCTERMS}publisher`]: [{'@id': user.iri}]
  }];
  const keywords = [keywordObject(keyword, 6)];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      declarations: [
        RecordFiltersComponent,
        MockComponent(ListFiltersComponent)
      ],
      providers: [
        MockProvider(CatalogManagerService),
        MockProvider(CatalogStateService),
        MockProvider(UserManagerService),
        MockProvider(ToastService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecordFiltersComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;

    catalogManagerStub.recordTypes = ['test1', 'test2'];
    catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
    catalogManagerStub.getRecords.and.returnValue(of(new HttpResponse<JSONLDObject[]>({
      body: records,
      headers: new HttpHeaders(headers)
    })));
    catalogManagerStub.getKeywords.and.returnValue(of(new HttpResponse<KeywordCount[]>({
      body: keywords,
      headers: new HttpHeaders(headers)
    })));
    catalogManagerStub.getRecordTypeFilter.and.callFake((isSelectedCall, emitterCall) => {
      const filterItems = catalogManagerStub.recordTypes.map(type => ({
        value: type,
        display: getBeautifulIRI(type),
        checked: isSelectedCall(type),
      } as FilterItem));
      return {
        title: 'Record Type',
        type: FilterType.CHECKBOX,
        numChecked: 1,
        hide: false,
        pageable: false,
        searchable: false,
        filterItems,
        onInit: () => {
        },
        getItemText: (filterItem: FilterItem) => {
          return '';
        },
        setFilterItems: () => {
        },
        filter: (filterItem: FilterItem) => {
        },
      };
    });

    userManagerStub.users = [user];
    userManagerStub.filterUsers.and.callFake((users) => users);

    component.catalogId = catalogId;
    component.recordType = {
      value: 'test1',
      display: 'Test 1',
      checked: true
    };
    component.keywordFilterList = [{
      value: keywords[0],
      display: `${keyword} (${keywords[0].count})`,
      checked: true
    }];
    component.creatorFilterList = [{
      value: { user, count: 1 },
      display: `${user.displayName} (1)`,
      checked: true
    }];
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    catalogManagerStub = null;
  });

  describe('initializes correctly', () => {
    beforeEach(() => {
      component.ngOnInit();
    });
    it('with recordTypeFilter', () => {
      const recordTypeFilter = component.filters[0];
      const expectedFilterItems = [
        {value: 'test1', display: 'Test 1', checked: true},
        {value: 'test2', display: 'Test 2', checked: false}
      ];
      expect(recordTypeFilter.title).toEqual('Record Type');
      expect(recordTypeFilter.filterItems).toEqual(expectedFilterItems);
    });
    it('with creatorFilter', () => {
      const creatorFilter = component.filters[1];
      const expectedFilterItems = [
        {value: {user, count: 1}, display: `${user.displayName} (1)`, checked: true},
      ];
      expect(creatorFilter.title).toEqual('Creators');
      expect(creatorFilter.filterItems).toEqual(expectedFilterItems);
    });
    it('with keywordsFilter', () => {
      const keywordsFilter = component.filters[2];
      const expectedFilterItems = [
        {value: keywordObject(keyword, 6), display: `${keyword} (6)`,  checked: true}
      ];
      expect(keywordsFilter.title).toEqual('Keywords');
      expect(keywordsFilter.filterItems).toEqual(expectedFilterItems);
    });
  });
  describe('filter methods', () => {
    const firstCreatorFilterItem: FilterItem = {value: {user, count: 1}, display: `${user.displayName} (1)`, checked: true};
    const secondCreatorFilterItem: FilterItem = {
      value: {
        user:
            new User({
              '@id': 'urn:userB',
              '@type': [`${USER}User`],
              [`${USER}username`]: [{'@value': 'userB'}],
              [`${FOAF}firstName`]: [{'@value': 'Jane'}],
              [`${FOAF}lastName`]: [{'@value': 'Davis'}],
            }),
        count: 10
      },
      display: 'Jane Davis (10)',
      checked: true
    };
    const firstKeywordFilterItem: FilterItem = {value: keywordObject(keyword, 6), display: `${keyword} (6)`, checked: true};
    const secondKeywordFilterItem: FilterItem = {value: keywordObject('keyword2', 7), display: 'keyword2 (7)', checked: true};
    beforeEach(() => {
      component.ngOnInit();
      component.filters[1].filterItems = [cloneDeep(firstCreatorFilterItem)];
      component.filters[2].filterItems = [cloneDeep(firstKeywordFilterItem)];
      spyOn(component.changeFilter, 'emit');
    });
    describe('creatorTypeFilter should filter records', () => {
      it('if the filter has been checked', () => {
        component.filters[1].filterItems.push(secondCreatorFilterItem);
        component.filters[1].filter(undefined);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: component.recordType,
          keywordFilterList: [firstKeywordFilterItem],
          creatorFilterList: [firstCreatorFilterItem, secondCreatorFilterItem]
        });
        expect(component.filters[1].numChecked).toEqual(2);
      });
      it('if the filter has been unchecked', () => {
        component.filters[1].filterItems = [];
        component.filters[1].filter(undefined);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: component.recordType,
          keywordFilterList: [firstKeywordFilterItem],
          creatorFilterList: []
        });
        expect(component.filters[1].numChecked).toEqual(0);
      });
    });
    describe('keywordsFilter should filter records', () => {
      it('if the keyword filter has been checked', () => {
        component.keywordFilterList = [firstKeywordFilterItem];
        component.filters[2].filter(secondKeywordFilterItem);
        expect(component.keywordFilterList).toEqual([firstKeywordFilterItem, secondKeywordFilterItem]);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: component.recordType,
          keywordFilterList: [firstKeywordFilterItem, secondKeywordFilterItem],
          creatorFilterList: [firstCreatorFilterItem]
        });
        expect(component.filters[2].numChecked).toEqual(2);
      });
      it('if the keyword filter has been unchecked', () => {
        component.filters[2].filter(firstKeywordFilterItem);
        expect(component.keywordFilterList).toEqual([]);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: component.recordType,
          keywordFilterList: [],
          creatorFilterList: [firstCreatorFilterItem]
        });
        expect(component.filters[2].numChecked).toEqual(0);
      });
    });
    it('should update a filter\'s selected item and numChecked on updateValue call', () => {
      const recordTypeFilter = component.filters[0];
      expect(recordTypeFilter).toBeDefined();
      expect(recordTypeFilter.filterItems.length).toEqual(catalogManagerStub.recordTypes.length);
      const actualFilterItem = recordTypeFilter.filterItems[0];
      actualFilterItem.checked = true;
      recordTypeFilter.numChecked = 1;

      component.updateFilterValue(component.recordTypeFilterIndex);
      expect(actualFilterItem.checked).toBeFalse();
      expect(recordTypeFilter.numChecked).toEqual(0);
    });
    it('should update a filter\'s selected items and numChecked on updateList call', () => {
      const creatorFilter = component.filters[1];
      expect(creatorFilter).toBeDefined();
      expect(creatorFilter.filterItems).toEqual([firstCreatorFilterItem]);
      const actualFilterItem = creatorFilter.filterItems[0];
      expect(actualFilterItem.checked).toBeTrue();
      expect(creatorFilter.numChecked).toEqual(1);

      component.updateFilterList(component.creatorFilterIndex, [], [firstCreatorFilterItem]);
      expect(actualFilterItem.checked).toBeFalse();
      expect(creatorFilter.numChecked).toEqual(0);
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.record-filters')).length).toEqual(1);
    });
    it('with a list-filters', () => {
      expect(element.queryAll(By.css('app-list-filters')).length).toEqual(1);
    });
  });
});