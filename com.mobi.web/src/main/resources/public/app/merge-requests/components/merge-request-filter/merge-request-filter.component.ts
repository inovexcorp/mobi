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
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FilterItem } from '../../../shared/models/filterItem.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { SelectedMergeRequestFilters } from '../../models/selected-merge-request-filters';
import { UserCount } from '../../../shared/models/user-count.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { FilterType, ListFilter } from '../../../shared/models/list-filter.interface';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { RecordCount } from '../../../shared/models/record-count.interface';
import { MergeRequestStatus } from '../../../shared/models/merge-request-status';

/**
 * @class merge-requests.MergeRequestFilterComponent
 * 
 * Creates a div with a {@link shared.ListFiltersComponent} populated with filters specifically for the
 * {@link merge-requests.MergeRequestListComponent}. Includes filters for the request status, the creators, the
 * assignees, and the associated records. The currently selected filters are displayed with a
 * {@link shared.FiltersSelectedListComponent}.
 * 
 * @param {Observable<void>} updateFilterValues An Observable that will trigger update the checked state of each of the
 *    filters based on the latest values on the state service
 * @param {Observable<void>} reloadFilters An Observable that will trigger each of the filters' onInit function
 * @param {Function} changeFilter A function to call whenever a value of a filter changes. Expects a
 *    {@link SelectedMergeRequestFilters} argument 
 */
@Component({
  selector: 'merge-request-filter',
  templateUrl: './merge-request-filter.component.html',
  styleUrls: ['./merge-request-filter.component.scss']
})
export class MergeRequestFilterComponent implements OnInit, OnDestroy {
  filters: ListFilter[];
  requestStatusOptions: {value: MergeRequestStatus; label: string;}[] = [
    { value: 'open', label: 'Open' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'closed', label: 'Closed'}
  ];
  reloadFiltersSubscription: Subscription;
  updateFilterValuesSubscription: Subscription;

  @Input() reloadFilters: Observable<void>;
  @Input() updateFilterValues: Observable<void>;
  @Output() changeFilter = new EventEmitter<SelectedMergeRequestFilters>();

  private _destroySub$ = new Subject<void>();

  constructor(private _state: MergeRequestsStateService, private _mm: MergeRequestManagerService, 
    private _toast: ToastService) {}

  ngOnInit(): void {
    const statusTypeFilter: ListFilter = this._createRequestStatusFilter();
    const creatorFilter: SearchableListFilter = this._createCreatorFilter();
    const recordFilter: SearchableListFilter = this._createRecordFilter();
    const assigneeFilter: SearchableListFilter = this._createAssigneeFilter();

    this.filters = [statusTypeFilter, creatorFilter, assigneeFilter, recordFilter];
    this.filters.forEach(filter => {
      filter.onInit();
    });
    this.reloadFiltersSubscription = this.reloadFilters.subscribe(() => {
      this.filters.forEach(filter => {
        filter.onInit();
      });
    });
    this.updateFilterValuesSubscription = this.updateFilterValues.subscribe(() => {
      this.handleRemovedFilters();
    });
  }

  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
    if (this.reloadFiltersSubscription) {
      this.reloadFiltersSubscription.unsubscribe();
    }
    if (this.updateFilterValuesSubscription) {
      this.updateFilterValuesSubscription.unsubscribe();
    }
  }

  handleRemovedFilters(): void {
    const currentValues = [this._state.creators, this._state.assignees, this._state.records];
    // Update filters besides the request status filter
    for (let i = 1; i < this.filters.length; i++) {
      const filter = this.filters[i];
      const currentValue = currentValues[i - 1];
      filter.filterItems
        .filter(item => currentValue.findIndex(updatedItem => updatedItem.value === item.value) < 0 && item.checked)
        .forEach(item => {
          item.checked = false;
        });
        filter.numChecked = currentValue.length;
    }
  }

  private _createRequestStatusFilter(): ListFilter {
    const componentContext = this;
    return {
      title: 'Request Status',
      type: FilterType.RADIO,
      hide: false,
      pageable: false,
      searchable: false,
      filterItems: [],
      numChecked: 0,
      onInit: function() {
        this.setFilterItems();
      },
      setFilterItems: function() {
        this.filterItems = componentContext.requestStatusOptions.map(item => ({
          value: item.value,
          display: item.label,
          checked: item.value === componentContext._state.requestStatus?.value
        }));
      },
      filter: function(filterItem: FilterItem) {
        if (filterItem.checked) {
          this.filterItems.forEach(typeFilter => {
            if (typeFilter.value !== filterItem.value) {
              typeFilter.checked = false;
            }
          });
          componentContext.changeFilter.emit({
            requestStatus: filterItem,
            creators: componentContext._state.creators,
            assignees: componentContext._state.assignees,
            records: componentContext._state.records
          });
        }
      }
    };
  }

  private _createCreatorFilter(): SearchableListFilter {
    const componentContext = this;
    return {
      title: 'Creators',
      type: FilterType.CHECKBOX,
      hide: false,
      pageable: true,
      searchable: true,
      filterItems: [],
      numChecked: 0,
      pagingData: {
        limit: 10,
        totalSize: 0,
        pageIndex: 0,
        hasNextPage: false
      },
      rawFilterItems: [],
      searchModel: componentContext._state.creatorSearchText,
      onInit: function(): void {
        this.numChecked = componentContext._state.creators.length;
        this.nextPage();
      },
      getItemTooltip: function(filterItem: FilterItem): string {
        const userCount = filterItem.value as UserCount;
        const user = componentContext._state.getUser(userCount.user);
        return `Username: ${user?.username || '[Not Available]'}`;
      },
      setFilterItems: function(): void {
        this.filterItems = this.rawFilterItems.map((userCount: UserCount) => ({
          value: userCount,
          display: `${userCount.name} (${userCount.count})`,
          checked: componentContext._state.creators.findIndex(item => item.value.user === userCount.user) >= 0
        }));
      },
      filter: function(): void {
        const hiddenCreators = componentContext._state.creators.filter(selectedItem => 
          this.filterItems.findIndex(item => item.value.user === selectedItem.value.user) < 0);
        const checkedCreatorItems = this.filterItems.filter(item => item.checked);
        const creators = checkedCreatorItems
          .concat(hiddenCreators);
        this.numChecked = creators.length;
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.requestStatus,
          creators,
          assignees: componentContext._state.assignees,
          records: componentContext._state.records
        });
      },
      searchChanged: function(value: string): void {
        componentContext._state.creatorSearchText = value;
      },
      searchSubmitted: function(): void {
        this.pagingData.totalSize = 0;
        this.pagingData.pageIndex = 0;
        this.pagingData.hasNextPage = false;
        this.nextPage();
      },
      nextPage: function(): void {
        const filterInstance: SearchableListFilter = this;
        const pagingData = filterInstance.pagingData;
        const paginatedConfig = {
            searchText: componentContext._state.creatorSearchText,
            pageIndex: pagingData.pageIndex,
            limit: pagingData.limit,
        };
        componentContext._mm.getCreators(paginatedConfig).pipe(
          takeUntil(componentContext._destroySub$),
        ).subscribe((response: HttpResponse<UserCount[]>) => {
            if (pagingData.pageIndex === 0) {
              filterInstance.rawFilterItems = response.body;
            } else {
              filterInstance.rawFilterItems = filterInstance.rawFilterItems.concat(response.body);
            }
            filterInstance.setFilterItems();
            pagingData.totalSize = Number(response.headers.get('x-total-count')) || 0;
            pagingData.hasNextPage = filterInstance.filterItems.length < pagingData.totalSize;
          }, error => componentContext._toast.createErrorToast(error));
      },
      reset: function(): void {
        this.filterItems.filter(item => item.checked).forEach(item => {
          item.checked = false;
        });
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.requestStatus,
          creators: [],
          assignees: componentContext._state.assignees,
          records: componentContext._state.records
        });
        this.numChecked = 0;
      }
    };
  }

  private _createRecordFilter(): SearchableListFilter {
    const componentContext = this;
    return {
      title: 'Records',
      type: FilterType.CHECKBOX,
      hide: false,
      pageable: true,
      searchable: true,
      filterItems: [],
      numChecked: 0,
      pagingData: {
        limit: 10,
        totalSize: 0,
        pageIndex: 0,
        hasNextPage: false
      },
      rawFilterItems: [],
      searchModel: componentContext._state.recordSearchText,
      onInit: function(): void {
        this.numChecked = componentContext._state.records.length;
        this.nextPage();
      },
      setFilterItems: function(): void {
        this.filterItems = this.rawFilterItems.map((recordCount: RecordCount) => ({
          value: recordCount,
          display: `${recordCount.title} (${recordCount.count})`,
          checked: componentContext._state.records.findIndex(item => item.value.record === recordCount.record) >= 0
        }));
      },
      filter: function(): void {
        const hiddenRecords = componentContext._state.records.filter(selectedItem =>
          this.filterItems.findIndex(item => item.value.record === selectedItem.value.record) < 0);
        const checkedRecordItems = this.filterItems.filter(item => item.checked);
        const records = checkedRecordItems
          .concat(hiddenRecords);
        this.numChecked = records.length;
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.requestStatus,
          creators: componentContext._state.creators,
          assignees: componentContext._state.assignees,
          records
        });
      },
      searchChanged: function(value: string): void {
        componentContext._state.recordSearchText = value;
      },
      searchSubmitted: function(): void {
        this.pagingData.totalSize = 0;
        this.pagingData.pageIndex = 0;
        this.pagingData.hasNextPage = false;
        this.nextPage();
      },
      nextPage: function(): void {
        const filterInstance: SearchableListFilter = this;
        const pagingData = filterInstance.pagingData;
        const paginatedConfig = {
            searchText: componentContext._state.recordSearchText,
            pageIndex: pagingData.pageIndex,
            limit: pagingData.limit,
        };
        componentContext._mm.getRecords(paginatedConfig)
          .pipe(takeUntil(componentContext._destroySub$))
          .subscribe((response: HttpResponse<RecordCount[]>) => {
            if (pagingData.pageIndex === 0) {
              filterInstance.rawFilterItems = response.body;
            } else {
              filterInstance.rawFilterItems = filterInstance.rawFilterItems.concat(response.body);
            }
            filterInstance.setFilterItems();
            pagingData.totalSize = Number(response.headers.get('x-total-count')) || 0;
            pagingData.hasNextPage = filterInstance.filterItems.length < pagingData.totalSize;
          }, error => componentContext._toast.createErrorToast(error));
      },
      reset: function(): void {
        this.filterItems.filter(item => item.checked).forEach(item => {
          item.checked = false;
        });
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.requestStatus,
          creators: componentContext._state.creators,
          assignees: componentContext._state.assignees,
          records: []
        });
        this.numChecked = 0;
      }
    };
  }

  private _createAssigneeFilter(): SearchableListFilter {
    const componentContext = this;
    return {
      title: 'Assignees',
      type: FilterType.CHECKBOX,
      hide: false,
      pageable: true,
      searchable: true,
      filterItems: [],
      numChecked: 0,
      pagingData: {
        limit: 10,
        totalSize: 0,
        pageIndex: 0,
        hasNextPage: false
      },
      rawFilterItems: [],
      searchModel: componentContext._state.assigneeSearchText,
      onInit: function(): void {
        this.numChecked = componentContext._state.assignees.length;
        this.nextPage();
      },
      getItemTooltip: function(filterItem: FilterItem): string {
        const userCount = filterItem.value as UserCount;
        const user = componentContext._state.getUser(userCount.user);
        return `Username: ${user.username}`;
      },
      setFilterItems: function(): void {
        this.filterItems = this.rawFilterItems.map(userCount => ({
          value: userCount,
          display: `${userCount.name} (${userCount.count})`,
          checked: componentContext._state.assignees.findIndex(item => item.value.user === userCount.user) >= 0
        }));
      },
      filter: function(): void {
        const hiddenAssignees = componentContext._state.assignees.filter(selectedItem =>
          this.filterItems.findIndex(item => item.value.user === selectedItem.value.user) < 0);
        const checkedAssigneeItems = this.filterItems.filter(item => item.checked);
        const assignees = checkedAssigneeItems
          .concat(hiddenAssignees);
        this.numChecked = assignees.length;
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.requestStatus,
          creators: componentContext._state.creators,
          records: componentContext._state.records,
          assignees
        });
      },
      searchChanged: function(value: string): void {
        componentContext._state.assigneeSearchText = value;
      },
      searchSubmitted: function(): void {
        this.pagingData.totalSize = 0;
        this.pagingData.pageIndex = 0;
        this.pagingData.hasNextPage = false;
        this.nextPage();
      },
      nextPage: function(): void {
        const filterInstance: SearchableListFilter = this;
        const pagingData = filterInstance.pagingData;
      const paginatedConfig = {
          searchText: componentContext._state.assigneeSearchText,
          pageIndex: pagingData.pageIndex,
          limit: pagingData.limit,
        };
        componentContext._mm.getAssignees(paginatedConfig).pipe(
          takeUntil(componentContext._destroySub$),
        ).subscribe((response: HttpResponse<UserCount[]>) => {
          if (pagingData.pageIndex === 0) {
            filterInstance.rawFilterItems = response.body;
          } else {
            filterInstance.rawFilterItems = filterInstance.rawFilterItems.concat(response.body);
          }
          filterInstance.setFilterItems();
          pagingData.totalSize = Number(response.headers.get('x-total-count')) || 0;
          pagingData.hasNextPage = filterInstance.filterItems.length < pagingData.totalSize;
        }, error => componentContext._toast.createErrorToast(error));
      },
      reset: function(): void {
        this.filterItems.filter(item => item.checked).forEach(item => {
          item.checked = false;
        });
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.requestStatus,
          creators: componentContext._state.creators,
          assignees: [],
          records: componentContext._state.records,
        });
        this.numChecked = 0;
      }
    };
  }
}
