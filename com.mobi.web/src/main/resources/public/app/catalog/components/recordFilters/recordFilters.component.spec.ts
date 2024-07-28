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

import {
  cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DCTERMS, FOAF, USER } from '../../../prefixes';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { User } from '../../../shared/models/user.class';
import { RecordFiltersComponent } from './recordFilters.component';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { FilterType } from '../../../shared/models/list-filter.interface';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';

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
    catalogManagerStub.getRecordTypeFilter.and.callFake((recordFilterItem, emitterCall) => {
      const filterItems = catalogManagerStub.recordTypes.map(type => ({
        value: type,
        checked: type === recordFilterItem.value,
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
    component.recordType = 'test1';
    component.keywordFilterList = [keyword];
    component.creatorFilterList = [user.iri];
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
        {value: 'test1', checked: true},
        {value: 'test2', checked: false}
      ];
      expect(recordTypeFilter.title).toEqual('Record Type');
      expect(recordTypeFilter.filterItems).toEqual(expectedFilterItems);
    });
    it('with creatorFilter', () => {
      const creatorFilter = component.filters[1];
      const expectedFilterItems = [
        {value: {user, count: 1}, checked: true},
      ];
      expect(creatorFilter.title).toEqual('Creators');
      expect(creatorFilter.filterItems).toEqual(expectedFilterItems);
    });
    it('with keywordsFilter', () => {
      const keywordsFilter = component.filters[2];
      const expectedFilterItems = [
        {value: keywordObject(keyword, 6), checked: true}
      ];
      expect(keywordsFilter.title).toEqual('Keywords');
      expect(keywordsFilter.filterItems).toEqual(expectedFilterItems);
    });
  });
  describe('filter methods', () => {
    beforeEach(() => {
      component.ngOnInit();
      this.firstRecordFilterItem = {value: 'test1', checked: true};
      this.secondRecordFilterItem = {value: 'test2', checked: true};
      this.firstCreatorFilterItem = {value: {user, count: 1}, checked: true};
      this.secondCreatorFilterItem = {
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
        checked: true
      };
      this.creatorTypeFilter = component.filters[1];
      this.creatorTypeFilter.filterItems = [this.firstCreatorFilterItem, this.secondCreatorFilterItem];

      this.firstKeywordFilterItem = {value: keywordObject(keyword, 6), checked: true};
      this.secondKeywordFilterItem = {value: keywordObject('keyword2', 7), checked: true};
      this.keywordsFilter = component.filters[2];
      this.keywordsFilter.filterItems = [this.firstKeywordFilterItem, this.secondKeywordFilterItem];
      spyOn(component.changeFilter, 'emit');
    });
    describe('creatorTypeFilter should filter records', () => {
      it('if the filter has been checked', () => {
        this.creatorTypeFilter.filter(this.firstCreatorFilterItem);
        expect(this.secondCreatorFilterItem.checked).toEqual(true);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: 'test1',
          keywordFilterList: [keyword],
          creatorFilterList: [user.iri, 'urn:userB']
        });
      });
      it('if the filter has been unchecked', () => {
        this.firstCreatorFilterItem.checked = false;
        component.creatorFilterList = [];
        this.creatorTypeFilter.filter(this.firstRecordFilterItem);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: 'test1',
          keywordFilterList: [keyword],
          creatorFilterList: ['urn:userB']
        });
      });
    });
    it('creatorTypeFilter filter text method returns correctly', () => {
      expect(this.creatorTypeFilter.getItemText(this.firstCreatorFilterItem)).toEqual('Joe Davis (1)');
    });
    describe('keywordsFilter should filter records', () => {
      it('if the keyword filter has been checked', () => {
        this.keywordsFilter.filter(this.firstFilter);
        expect(this.secondKeywordFilterItem.checked).toEqual(true);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: 'test1',
          keywordFilterList: [keyword, 'keyword2'],
          creatorFilterList: [user.iri]
        });
      });
      it('if the keyword filter has been unchecked', () => {
        this.firstKeywordFilterItem.checked = false;
        component.keywordFilterList = [];
        this.keywordsFilter.filter(this.firstKeywordFilterItem);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          recordType: 'test1',
          keywordFilterList: ['keyword2'],
          creatorFilterList: [user.iri]
        });
      });
    });
    it('keywordsFilter filter text method returns correctly', () => {
      expect(this.keywordsFilter.getItemText(this.firstKeywordFilterItem)).toEqual(`${keyword} (6)`);
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
