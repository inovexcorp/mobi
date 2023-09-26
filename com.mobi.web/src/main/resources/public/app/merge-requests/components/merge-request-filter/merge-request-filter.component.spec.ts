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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Subject, of } from 'rxjs';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { MockComponent, MockProvider } from 'ng-mocks';

import {
  cleanStylesFromDOM
} from '../../../../../public/test/ts/Shared';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { ListFiltersComponent } from '../../../shared/components/list-filters/list-filters.component';
import { ToastService } from '../../../shared/services/toast.service';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { UserCount } from '../../../shared/models/user-count.interface';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';
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
  const updateFiltersSubject: Subject<void> = new Subject<void>();

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
    component.updateFilters = updateFiltersSubject.asObservable();
    mergeRequestsStateStub = TestBed.inject(MergeRequestsStateService) as jasmine.SpyObj<MergeRequestsStateService>;
    mergeRequestsStateStub.acceptedFilter = false;
    mergeRequestsStateStub.creators = [adminCount.user];
    mergeRequestsStateStub.assignees = [adminCount.user];
    mergeRequestManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
    mergeRequestManagerStub.getCreators.and.returnValue(of(new HttpResponse<UserCount[]>({
      body: [adminCount, batmanCount],
      headers: new HttpHeaders({ 'x-total-count': '10' })
    })));
    mergeRequestManagerStub.getAssignees.and.returnValue(of(new HttpResponse<UserCount[]>({
      body: [adminCount, batmanCount],
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
      const expectedFilterItems = [
        { checked: true, value: 'Open' },
        { checked: false, value: 'Accepted' }
      ];
      expect(mergeRequestFilter.title).toEqual('Request Status');
      expect(mergeRequestFilter.filterItems).toEqual(expectedFilterItems);
    });
    it('with creator filter', fakeAsync(() => {
      tick();
      const creatorFilter = component.filters[1] as SearchableListFilter;
      expect(creatorFilter).toBeTruthy();
      const expectedFilterItems = [
        { checked: true, value: adminCount },
        { checked: false, value: batmanCount }
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
      const expectedFilterItems = [
        { checked: true, value: adminCount },
        { checked: false, value: batmanCount }
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
          requestStatus: acceptedStatus.checked,
          creators: mergeRequestsStateStub.creators,
          assignees: mergeRequestsStateStub.assignees
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
          requestStatus: acceptedStatus.checked,
          creators: mergeRequestsStateStub.creators,
          assignees: mergeRequestsStateStub.assignees
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
            requestStatus: mergeRequestsStateStub.acceptedFilter,
            creators: [adminCount.user, batmanCount.user],
            assignees: mergeRequestsStateStub.assignees
          });
        });
        it('and some are checked', () => {
          const creatorFilter = component.filters[1];
          expect(creatorFilter).toBeTruthy();
          creatorFilter.filter(null);
          expect(creatorFilter.numChecked).toEqual(1);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.acceptedFilter,
            creators: [adminCount.user],
            assignees: mergeRequestsStateStub.assignees
          });
        });
      });
      it('if not all selected creators are visible', () => {
        mergeRequestsStateStub.creators = [adminCount.user, 'superman'];
        const creatorFilter = component.filters[1];
        expect(creatorFilter).toBeTruthy();
        creatorFilter.filter(null);
        expect(creatorFilter.numChecked).toEqual(2);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: mergeRequestsStateStub.acceptedFilter,
          creators: [adminCount.user, 'superman'],
          assignees: mergeRequestsStateStub.assignees
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
            requestStatus: mergeRequestsStateStub.acceptedFilter,
            creators: mergeRequestsStateStub.creators,
            assignees: [adminCount.user, batmanCount.user]
          });
        });
        it('and some are checked', () => {
          const assigneeFilter = component.filters[2];
          expect(assigneeFilter).toBeTruthy();
          assigneeFilter.filter(null);
          expect(assigneeFilter.numChecked).toEqual(1);
          expect(component.changeFilter.emit).toHaveBeenCalledWith({
            requestStatus: mergeRequestsStateStub.acceptedFilter,
            creators: mergeRequestsStateStub.creators,
            assignees: [adminCount.user]
          });
        });
      });
      it('if not all selected assignees are visible', () => {
        mergeRequestsStateStub.assignees = [adminCount.user, 'superman'];
        const assigneeFilter = component.filters[2];
        expect(assigneeFilter).toBeTruthy();
        assigneeFilter.filter(null);
        expect(assigneeFilter.numChecked).toEqual(2);
        expect(component.changeFilter.emit).toHaveBeenCalledWith({
          requestStatus: mergeRequestsStateStub.acceptedFilter,
          creators: mergeRequestsStateStub.creators,
          assignees: [adminCount.user, 'superman']
        });
      });
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
