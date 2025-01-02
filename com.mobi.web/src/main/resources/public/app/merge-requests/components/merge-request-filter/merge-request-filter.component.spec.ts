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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { MockComponent, MockProvider } from 'ng-mocks';
import { cloneDeep } from 'lodash';

import {
  cleanStylesFromDOM
} from '../../../../test/ts/Shared';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { ToastService } from '../../../shared/services/toast.service';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { UserCount } from '../../../shared/models/user-count.interface';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';
import { RecordCount } from '../../../shared/models/record-count.interface';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { MergeRequestFilterComponent } from './merge-request-filter.component';

describe('MergeRequestFilterComponent', () => {
  let component: MergeRequestFilterComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<MergeRequestFilterComponent>;
  let mergeRequestsStateStub: jasmine.SpyObj<MergeRequestsStateService>;
  let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
 
  const adminCount: UserCount = {
    user: 'admin',
    name: 'admin',
    count: 1
  };
  const batmanCount: UserCount = {
    user: 'batman',
    name: 'Bruce',
    count: 5
  };
  const animalCount: RecordCount = {
    record: 'animalRecord',
    title: 'Animal Ontology',
    count: 1
  };
  const pizzaCount: RecordCount = {
    record: 'pizzaRecord',
    title: 'Pizza Ontology',
    count: 5
  };
  const openStatusFilterItem: FilterItem = {
    value: 'open',
    display: 'Open',
    checked: true
  };
  const reloadFiltersSubject: Subject<void> = new Subject<void>();
  const updateFilterValuesSubject: Subject<void> = new Subject<void>();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MergeRequestFilterComponent,
        MockComponent(ListFiltersComponent)
      ],
      providers: [
        MockProvider(MergeRequestsStateService),
        MockProvider(MergeRequestManagerService),
        MockProvider(ToastService),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MergeRequestFilterComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.reloadFilters = reloadFiltersSubject.asObservable();
    component.updateFilterValues = updateFilterValuesSubject.asObservable();
    mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
    mergeRequestsStateStub.requestStatus = openStatusFilterItem;
    mergeRequestsStateStub.creators = [{
      value: adminCount,
      display: adminCount.name,
      checked: true
    }];
    mergeRequestsStateStub.assignees = [{
      value: adminCount,
      display: adminCount.name,
      checked: true
    }];
    mergeRequestsStateStub.records = [{
      value: animalCount,
      display: animalCount.title,
      checked: true
    }];
    mergeRequestManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
    mergeRequestManagerStub.getCreators.and.returnValue(of(new HttpResponse<UserCount[]>({
      body: [adminCount, batmanCount],
      headers: new HttpHeaders({ 'x-total-count': '10' })
    })));
    mergeRequestManagerStub.getAssignees.and.returnValue(of(new HttpResponse<UserCount[]>({
      body: [adminCount, batmanCount],
      headers: new HttpHeaders({ 'x-total-count': '10' })
    })));
    mergeRequestManagerStub.getRecords.and.returnValue(of(new HttpResponse<RecordCount[]>({
        body: [animalCount, pizzaCount],
        headers: new HttpHeaders({ 'x-total-count': '10' })
      })));
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    mergeRequestsStateStub = null;
    mergeRequestManagerStub = null;
});

  describe('initializes correctly', () => {
    beforeEach(() => {
      component.ngOnInit();
    });
    it('should create', () => {
      expect(component).toBeTruthy();
    });
    it('with request status filter', () => {
      const mergeRequestFilter = component.filters[0];
      expect(mergeRequestFilter).toBeTruthy();
      const expectedFilterItems: FilterItem[] = [
        { checked: true, display: 'Open', value: 'open' },
        { checked: false, display: 'Accepted', value: 'accepted' },
        { checked: false, display: 'Closed', value: 'closed' }
      ];
      expect(mergeRequestFilter.title).toEqual('Request Status');
      expect(mergeRequestFilter.filterItems).toEqual(expectedFilterItems);
    });
    it('with creator filter', fakeAsync(() => {
      tick();
      const creatorFilter = component.filters[1] as SearchableListFilter;
      expect(creatorFilter).toBeTruthy();
      const expectedFilterItems: FilterItem[] = [
        { checked: true, display: `${adminCount.name} (${adminCount.count})`, value: adminCount },
        { checked: false, display: `${batmanCount.name} (${batmanCount.count})`, value: batmanCount }
      ];
      expect(creatorFilter.title).toEqual('Creators');
      expect(creatorFilter.rawFilterItems).toEqual([adminCount, batmanCount]);
      expect(creatorFilter.filterItems).toEqual(expectedFilterItems);
      expect(creatorFilter.numChecked).toEqual(1);
      expect(creatorFilter.pagingData.totalSize).toEqual(10);
      expect(creatorFilter.pagingData.hasNextPage).toBeTrue();
      expect(mergeRequestManagerStub.getCreators).toHaveBeenCalledWith({
        searchText: mergeRequestsStateStub.creatorSearchText,
        pageIndex: creatorFilter.pagingData.pageIndex,
        limit: creatorFilter.pagingData.limit
      });
    }));
    it('with assignee filter', fakeAsync(() => {
      tick();
      const assigneeFilter = component.filters[2] as SearchableListFilter;
      expect(assigneeFilter).toBeTruthy();
      const expectedFilterItems: FilterItem[] = [
        { checked: true, display: `${adminCount.name} (${adminCount.count})`, value: adminCount },
        { checked: false, display: `${batmanCount.name} (${batmanCount.count})`, value: batmanCount }
      ];
      expect(assigneeFilter.title).toEqual('Assignees');
      expect(assigneeFilter.rawFilterItems).toEqual([adminCount, batmanCount]);
      expect(assigneeFilter.filterItems).toEqual(expectedFilterItems);
      expect(assigneeFilter.numChecked).toEqual(1);
      expect(assigneeFilter.pagingData.totalSize).toEqual(10);
      expect(assigneeFilter.pagingData.hasNextPage).toBeTrue();
      expect(mergeRequestManagerStub.getAssignees).toHaveBeenCalledWith({
        searchText: mergeRequestsStateStub.assigneeSearchText,
        pageIndex: assigneeFilter.pagingData.pageIndex,
        limit: assigneeFilter.pagingData.limit
      });
    }));
    it('with record filter', fakeAsync(() => {
      tick();
      const recordFilter = component.filters[3] as SearchableListFilter;
      expect(recordFilter).toBeTruthy();
      const expectedFilterItems: FilterItem[] = [
        { checked: true, display: `${animalCount.title} (${animalCount.count})`, value: animalCount },
        { checked: false, display: `${pizzaCount.title} (${pizzaCount.count})`, value: pizzaCount }
      ];
      expect(recordFilter.title).toEqual('Records');
      expect(recordFilter.rawFilterItems).toEqual([animalCount, pizzaCount]);
      expect(recordFilter.filterItems).toEqual(expectedFilterItems);
      expect(recordFilter.numChecked).toEqual(1);
      expect(recordFilter.pagingData.totalSize).toEqual(10);
      expect(recordFilter.pagingData.hasNextPage).toBeTrue();
      expect(mergeRequestManagerStub.getRecords).toHaveBeenCalledWith({
        searchText: mergeRequestsStateStub.recordSearchText,
        pageIndex: recordFilter.pagingData.pageIndex,
        limit: recordFilter.pagingData.limit
      });
    }));
  });
  describe('filter methods', () => {
    beforeEach(function () {
      component.ngOnInit();
      spyOn(component.changeFilter, 'emit');
    });
    describe('should filter requests based on status', () => {
      it('if the open status filter has been checked', () => {
        const statusFilter = component.filters[0];
        expect(statusFilter).toBeTruthy();
        const openStatus = statusFilter.filterItems[0];
        expect(openStatus).toBeTruthy();
        const acceptedStatus = statusFilter.filterItems[1];
        expect(acceptedStatus).toBeTruthy();
        statusFilter.filter(openStatus);
        expect(acceptedStatus.checked).toEqual(false);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: openStatus,
          creators: mergeRequestsStateStub.creators,
          assignees: mergeRequestsStateStub.assignees,
          records: mergeRequestsStateStub.records
        });
      });
      it('if the accepted status has been checked', () => {
        const statusFilter = component.filters[0];
        expect(statusFilter).toBeTruthy();
        const openStatus = statusFilter.filterItems[0];
        expect(openStatus).toBeTruthy();
        const acceptedStatus = statusFilter.filterItems[1];
        expect(acceptedStatus).toBeTruthy();
        acceptedStatus.checked = true;
        statusFilter.filter(acceptedStatus);
        expect(openStatus.checked).toEqual(false);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: acceptedStatus,
          creators: mergeRequestsStateStub.creators,
          assignees: mergeRequestsStateStub.assignees,
          records: mergeRequestsStateStub.records
        });
      });
    });
    describe('should filter requests based on creators', () => {
      describe('if all selected creators are visible', () => {
        it('and all are checked', () => {
          const creatorFilter = component.filters[1];
          expect(creatorFilter).toBeTruthy();
          creatorFilter.filterItems.forEach(item => item.checked = true);
          creatorFilter.filter(null);
          expect(creatorFilter.numChecked).toEqual(creatorFilter.filterItems.length);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.requestStatus,
            creators: creatorFilter.filterItems,
            assignees: mergeRequestsStateStub.assignees,
            records: mergeRequestsStateStub.records
          });
        });
        it('and some are checked', () => {
          const creatorFilter = component.filters[1];
          expect(creatorFilter).toBeTruthy();
          const adminItem = creatorFilter.filterItems.find(item => item.value.user === adminCount.user);
          expect(adminItem).toBeTruthy();
          creatorFilter.filter(null);
          expect(creatorFilter.numChecked).toEqual(1);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.requestStatus,
            creators: [adminItem],
            assignees: mergeRequestsStateStub.assignees,
            records: mergeRequestsStateStub.records
          });
        });
      });
      it('if not all selected creators are visible', () => {
        mergeRequestsStateStub.creators = [
          { value: adminCount, display: adminCount.name, checked: true },
          { value: { user: 'superman' }, display: '', checked: true }
        ];
        const creatorFilter = component.filters[1];
        expect(creatorFilter).toBeTruthy();
        const adminItem = creatorFilter.filterItems.find(item => item.value.user === adminCount.user);
        expect(adminItem).toBeTruthy();
        creatorFilter.filter(null);
        expect(creatorFilter.numChecked).toEqual(2);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: mergeRequestsStateStub.requestStatus,
          creators: [adminItem, { value: { user: 'superman' }, display: '', checked: true }],
          assignees: mergeRequestsStateStub.assignees,
          records: mergeRequestsStateStub.records
        });
      });
    });
    describe('should filter requests based on assignees', () => {
      describe('if all selected assignees are visible', () => {
        it('and all are checked', () => {
          const assigneeFilter = component.filters[2];
          expect(assigneeFilter).toBeTruthy();
          assigneeFilter.filterItems.forEach(item => item.checked = true);
          assigneeFilter.filter(null);
          expect(assigneeFilter.numChecked).toEqual(assigneeFilter.filterItems.length);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.requestStatus,
            creators: mergeRequestsStateStub.creators,
            assignees: assigneeFilter.filterItems,
            records: mergeRequestsStateStub.records
          });
        });
        it('and some are checked', () => {
          const assigneeFilter = component.filters[2];
          expect(assigneeFilter).toBeTruthy();
          const adminItem = assigneeFilter.filterItems.find(item => item.value.user === adminCount.user);
          expect(adminItem).toBeTruthy();
          assigneeFilter.filter(null);
          expect(assigneeFilter.numChecked).toEqual(1);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.requestStatus,
            creators: mergeRequestsStateStub.creators,
            assignees: [adminItem],
            records: mergeRequestsStateStub.records
          });
        });
      });
      it('if not all selected assignees are visible', () => {
        mergeRequestsStateStub.assignees = [
          { value: adminCount, display: adminCount.name, checked: true },
          { value: { user: 'superman' }, display: '', checked: true }
        ];
        const assigneeFilter = component.filters[2];
        expect(assigneeFilter).toBeTruthy();
        const adminItem = assigneeFilter.filterItems.find(item => item.value.user === adminCount.user);
        expect(adminItem).toBeTruthy();
        assigneeFilter.filter(null);
        expect(assigneeFilter.numChecked).toEqual(2);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: mergeRequestsStateStub.requestStatus,
          creators: mergeRequestsStateStub.creators,
          assignees: [adminItem, { value: { user: 'superman' }, display: '', checked: true }],
          records: mergeRequestsStateStub.records
        });
      });
    });
    describe('should filter requests based on records', () => {
      describe('if all selected records are visible', () => {
        it('and all are checked', () => {
          const recordFilter = component.filters[3];
          expect(recordFilter).toBeTruthy();
          recordFilter.filterItems.forEach(item => item.checked = true);
          recordFilter.filter(null);
          expect(recordFilter.numChecked).toEqual(recordFilter.filterItems.length);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.requestStatus,
            creators: mergeRequestsStateStub.creators,
            assignees: mergeRequestsStateStub.assignees,
            records: recordFilter.filterItems
          });
        });
        it('and some are checked', () => {
          const recordFilter = component.filters[3];
          expect(recordFilter).toBeTruthy();
          const animalItem = recordFilter.filterItems.find(item => item.value.record === animalCount.record);
          expect(animalItem).toBeTruthy();
          recordFilter.filter(null);
          expect(recordFilter.numChecked).toEqual(1);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.requestStatus,
            creators: mergeRequestsStateStub.creators,
            assignees: mergeRequestsStateStub.assignees,
            records: [animalItem]
          });
        });
      });
      it('if not all selected creators are visible', () => {
        mergeRequestsStateStub.records = [
          { value: animalCount, display: '', checked: true },
          { value: { record: 'medicine' }, display: '', checked: true }
        ];
        const recordFilter = component.filters[3];
        expect(recordFilter).toBeTruthy();
        const animalItem = recordFilter.filterItems.find(item => item.value.record === animalCount.record);
          expect(animalItem).toBeTruthy();
        recordFilter.filter(null);
        expect(recordFilter.numChecked).toEqual(2);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: mergeRequestsStateStub.requestStatus,
          creators: mergeRequestsStateStub.creators,
          assignees: mergeRequestsStateStub.assignees,
          records: [animalItem, { value: { record: 'medicine' }, display: '', checked: true }]
        });
      });
    });
    it('should update the checked filter items based on the latest values on the state service', () => {
      // Setup situation where filter has a checked item not in the state list
      component.filters[1].numChecked = 2;
      const creatorBatmanItem = component.filters[1].filterItems.find(item => item.value.user === batmanCount.user);
      expect(creatorBatmanItem).toBeTruthy();
      creatorBatmanItem.checked = true;
      component.filters[2].numChecked = 2;
      const assigneeBatmanItem = component.filters[2].filterItems.find(item => item.value.user === batmanCount.user);
      expect(assigneeBatmanItem).toBeTruthy();
      assigneeBatmanItem.checked = true;
      component.filters[3].numChecked = 2;
      const recordPizzaItem = component.filters[3].filterItems.find(item => item.value.record === pizzaCount.record);
      expect(recordPizzaItem).toBeTruthy();
      recordPizzaItem.checked = true;
      const statusFilterItems = cloneDeep(component.filters[0].filterItems);

      component.handleRemovedFilters();
      expect(component.filters[0].filterItems).toEqual(statusFilterItems);
      expect(component.filters[1].numChecked).toEqual(1);
      expect(creatorBatmanItem.checked).toBeFalse();
      expect(component.filters[2].numChecked).toEqual(1);
      expect(assigneeBatmanItem.checked).toBeFalse();
      expect(component.filters[3].numChecked).toEqual(1);
      expect(recordPizzaItem.checked).toBeFalse();
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.merge-request-filter')).length).toEqual(1);
    });
    it('with a list-filters', () => {
      expect(element.queryAll(By.css('app-list-filters')).length).toEqual(1);
    });
  });
});
