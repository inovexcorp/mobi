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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';

import { FilterItem } from '../../../shared/models/filterItem.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { MergeRequestFilterEvent } from '../../models/merge-request-filter-event';
import { getBeautifulIRI } from '../../../shared/utility';
import { UserCount } from '../../../shared/models/user-count.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { FilterType, ListFilter } from '../../../shared/models/list-filter.interface';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { RecordCount } from '../../../shared/models/record-count.interface';

/**
 * @class merge-requests.MergeRequestFilterComponent
 * 
 * Creates a div with a {@link shared.ListFiltersComponent} populated with filters specifically for the
 * {@link merge-requests.MergeRequestListComponent}. Includes filters for the request status and the creators. Supports
 * an Observable Input that will trigger a reset of the filters when a value is provided.
 * 
 * @param {Observable<void>} updateFilters An Observable that will trigger each of the filters' onInit function
 * @param {Function} changeFilter A function to call whenever a value of a filter changes. Expects a
 *  {@link MergeRequestFilterEvent} argument 
 */
@Component({
  selector: 'merge-request-filter',
  templateUrl: './merge-request-filter.component.html',
  styleUrls: ['./merge-request-filter.component.scss']
})
export class MergeRequestFilterComponent implements OnInit {
  updateFiltersSubscription: Subscription;
  filters: ListFilter[];
  requestStatusOptions = [
    { value: false, label: 'Open' },
    { value: true, label: 'Accepted' }
  ];
  @Input() updateFilters: Observable<void>;
  @Output() changeFilter = new EventEmitter<MergeRequestFilterEvent>();

  constructor(private _state: MergeRequestsStateService, private _mm: MergeRequestManagerService, 
    private _toast: ToastService) {}

  ngOnInit(): void {
    const componentContext = this;
    const statusOptionMap = {};
    const statusTypeFilter: ListFilter = {
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
      getItemText: function(filterItem: FilterItem) {
        return getBeautifulIRI(filterItem.value);
      },
      setFilterItems: function() {
        this.filterItems = componentContext.requestStatusOptions.map(item => {
          statusOptionMap[item.label] = item.value;
          return {
            value: item.label,
            checked: item.value === componentContext._state.acceptedFilter
          };
        });
      },
      filter: function(filterItem: FilterItem) {
        const value = statusOptionMap[filterItem.value];

        if (filterItem.checked) {
          this.filterItems.forEach(typeFilter => {
            if (typeFilter.value !== filterItem.value) {
              typeFilter.checked = false;
            }
          });
          componentContext.changeFilter.emit({
            requestStatus: value,
            creators: componentContext._state.creators,
            assignees: componentContext._state.assignees,
            records: componentContext._state.records
          });
        }
      },
    };
    const creatorFilter: SearchableListFilter = {
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
      getItemText: function(filterItem: FilterItem): string {
        const userCount = filterItem.value as UserCount;
        return `${userCount.name} (${userCount.count})`;
      },
      setFilterItems: function(): void {
        this.filterItems = this.rawFilterItems.map(userCount => ({
          value: userCount,
          checked: componentContext._state.creators.findIndex(iri => iri === (userCount as UserCount).user) >= 0
        }));
      },
      filter: function(): void {
        const hiddenCreators = componentContext._state.creators.filter(creator => 
          this.filterItems.findIndex(item => (item.value as UserCount).user === creator) < 0);
        const checkedCreatorItems = this.filterItems.filter(item => item.checked);
        const creators = checkedCreatorItems
          .map(currentFilterItem => (currentFilterItem.value as UserCount).user)
          .concat(hiddenCreators);
        this.numChecked = creators.length;
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.acceptedFilter,
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
        componentContext._mm.getCreators(paginatedConfig)
          .subscribe((response: HttpResponse<UserCount[]>) => {
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
    };
    const recordFilter: SearchableListFilter = {
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
        getItemText: function(filterItem: FilterItem): string {
          const recordCount = filterItem.value as RecordCount;
          return `${recordCount.title} (${recordCount.count})`;
        },
        setFilterItems: function(): void {
          this.filterItems = this.rawFilterItems.map(recordCount => ({
            value: recordCount,
            checked: componentContext._state.records.findIndex(iri => iri === (recordCount as RecordCount).record) >= 0
          }));
        },
        filter: function(): void {
          const hiddenRecords = componentContext._state.records.filter(record =>
            this.filterItems.findIndex(item => (item.value as RecordCount).record === record) < 0);
          const checkedRecordItems = this.filterItems.filter(item => item.checked);
          const records = checkedRecordItems
            .map(currentFilterItem => (currentFilterItem.value as RecordCount).record)
            .concat(hiddenRecords);
          this.numChecked = records.length;
          componentContext.changeFilter.emit({
            requestStatus: componentContext._state.acceptedFilter,
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
      };
    const assigneeFilter: SearchableListFilter = {
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
      getItemText: function(filterItem: FilterItem): string {
        const userCount = filterItem.value as UserCount;
        return `${userCount.name} (${userCount.count})`;
      },
      setFilterItems: function(): void {
        this.filterItems = this.rawFilterItems.map(userCount => ({
          value: userCount,
          checked: componentContext._state.assignees.findIndex(iri => iri === (userCount as UserCount).user) >= 0
        }));
      },
      filter: function(): void {
        const hiddenAssignees = componentContext._state.assignees.filter(assignee =>
          this.filterItems.findIndex(item => (item.value as UserCount).user === assignee) < 0);
        const checkedAssigneeItems = this.filterItems.filter(item => item.checked);
        const assignees = checkedAssigneeItems
          .map(currentFilterItem => (currentFilterItem.value as UserCount).user)
          .concat(hiddenAssignees);
        this.numChecked = assignees.length;
        componentContext.changeFilter.emit({
          requestStatus: componentContext._state.acceptedFilter,
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
        componentContext._mm.getAssignees(paginatedConfig)
          .subscribe((response: HttpResponse<UserCount[]>) => {
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
    };

    this.filters = [statusTypeFilter, creatorFilter, assigneeFilter, recordFilter];
    this.filters.forEach(filter => {
      filter.onInit();
    });
    this.updateFiltersSubscription = this.updateFilters.subscribe(() => {
      this.filters.forEach(filter => {
        filter.onInit();
      });
    });
  }
}
