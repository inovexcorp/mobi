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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { HttpResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';

import { map } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CATALOG, DCTERMS } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { FilterItem } from '../../../shared/models/filterItem.interface'; 
import { FilterType, ListFilter } from '../../../shared/models/list-filter.interface';
import { getPropertyId } from '../../../shared/utility';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';
import { SelectedRecordFilters } from '../../models/selected-record-filters.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { UserManagerService } from '../../../shared/services/userManager.service';

/**
 * @class catalog.RecordFiltersComponent
 *
 * A component which creates a div with collapsible containers for various filters that can be
 * performed on catalog Records. Each filter option has a checkbox to indicate whether that filter is active.
 * 
 * @param {Function} changeFilter A function that is called with a {@link catalog.SelectedRecordFilters} representing
 * the updated values for each filter. This function should update the `recordTypeFilterList`, `keywordFilterList`, and
 * `creatorFilterList` bindings.
 * @param {FilterItem[]} recordTypes The selected record type filter items.
 * @param {FilterItem[]} keywords The selected keywords list of filter items.
 * @param {FilterItem[]} creators The selected creators list of filter items.
 * @param {string} catalogId The catalog ID.
 */
@Component({
  selector: 'record-filters',
  templateUrl: './recordFilters.component.html',
  styleUrls: ['./recordFilters.component.scss']
})
export class RecordFiltersComponent implements OnInit, OnChanges, OnDestroy {
  filters: ListFilter[] = [];
  private _destroySub$ = new Subject<void>();
  readonly recordTypeFilterIndex = 0;
  readonly creatorFilterIndex = 1;
  readonly keywordFilterIndex = 2;
  
  @Input() catalogId: string;
  @Input() recordTypes: FilterItem[] = [];
  @Input() keywords: FilterItem[] = [];
  @Input() creators: FilterItem[] = [];
  @Output() changeFilter = new EventEmitter<SelectedRecordFilters>();

  constructor(public state: CatalogStateService, public cm: CatalogManagerService, private _toast: ToastService, 
    private _um: UserManagerService) {}

  ngOnInit(): void {
    const componentContext = this;
    const recordTypeFilter: ListFilter = this.cm.getRecordTypeFilter(
      (value) => this.recordTypes.findIndex(item => item.value === value) >= 0,
      (items) => componentContext.changeFilter.emit({recordTypeFilterList: items, keywordFilterList: componentContext.keywords, creatorFilterList: componentContext.creators})
    );
    recordTypeFilter.reset = function() {
      componentContext.changeFilter.emit({
        recordTypeFilterList: [],
        keywordFilterList: componentContext.keywords,
        creatorFilterList: componentContext.creators
      });
      this.numChecked = 0;
    };
    const getNumChecked = (items => items.filter(item => item.checked).length);

    const creatorFilter: SearchableListFilter = {
      title: 'Creators',
      type: FilterType.CHECKBOX,
      numChecked: 0,
      hide: false,
      pageable: true,
      searchable: true,
      pagingData: {
        limit: 10,
        totalSize: 0,
        pageIndex: 1,
        hasNextPage: false
      },
      rawFilterItems: [],
      filterItems: [],
      onInit: function() {
        this.setFilterItems();
      },
      searchModel: componentContext.state.creatorSearchText,
      searchChanged: function(value: string){
        componentContext.state.creatorSearchText = value;
      },
      searchSubmitted: function() {
        this.pagingData['totalSize'] = 0;
        this.pagingData['pageIndex'] = 1;
        this.pagingData['hasNextPage'] = false;
        this.nextPage();
      },
      nextPage: function() {
        const filtered = componentContext._um.filterUsers(this.rawFilterItems.map(item => item.value.user), componentContext.state.creatorSearchText);
        this.pagingData['totalSize'] = filtered.length;

        const offset = this.pagingData.limit * (this.pagingData.pageIndex - 1);
        this.filterItems = filtered.slice(0, offset + this.pagingData.limit).map(user => this.rawFilterItems.find(item => user === item.value.user));
        this.pagingData['hasNextPage'] = filtered.length > this.filterItems.length;
      },
      getItemTooltip: function(filterItem: FilterItem) {
        const userDisplay = filterItem.value['user'].username;
        return `Username: ${userDisplay}`;
      },
      setFilterItems: function() {
        const filterInstance = this;
        componentContext.cm.getRecords(componentContext.catalogId, {}).pipe(
          takeUntil(componentContext._destroySub$),
        ).subscribe(response => {
          const userMap: {[key: string]: string[]} = {};
          response.body.forEach(record => {
            const publisherId = getPropertyId(record, `${DCTERMS}publisher`);
            if (publisherId) {
              if (!userMap[publisherId]) {
                userMap[publisherId] = [];
              }
              userMap[publisherId].push(record['@id']);
            }
          });
          filterInstance.rawFilterItems = Object.keys(userMap).map(userIri => {
            const user = componentContext._um.users.find(user => user.iri === userIri);
            const count = userMap[userIri].length;
            return {
              value: { user, count },
              display: `${user.displayName} (${count})`,
              checked: componentContext.creators.findIndex(item => item.value.user.iri === userIri) >= 0
            };
          }).sort((item1, item2) => item1.value.user.username.localeCompare(item2.value.user.username));
          filterInstance.nextPage();
          this.numChecked = getNumChecked(this.filterItems);
        });
      },
      filter: function() {
        const checkedCreatorObjects = this.filterItems.filter(currentFilterItem => currentFilterItem.checked);
        componentContext.changeFilter.emit({
          recordTypeFilterList: componentContext.recordTypes, 
          keywordFilterList: componentContext.keywords, 
          creatorFilterList: checkedCreatorObjects
        });
        this.numChecked = getNumChecked(this.filterItems);
      },
      reset: function() {
        componentContext.changeFilter.emit({
          recordTypeFilterList: componentContext.recordTypes, 
          keywordFilterList: componentContext.keywords, 
          creatorFilterList: []
        });
        this.numChecked = 0;
      }
    };

    const keywordsFilter: SearchableListFilter = {
      title: 'Keywords',
      type: FilterType.CHECKBOX,
      numChecked: 0,
      hide: false,
      pageable: true,
      searchable: true,
      pagingData: {
        limit: 10,
        totalSize: 0,
        pageIndex: 1,
        hasNextPage: false
      },
      rawFilterItems: [],
      filterItems: [],
      onInit: function() {
        this.nextPage();
      },
      searchModel: componentContext.state.keywordSearchText,
      searchChanged: function(value: string) {
        componentContext.state.keywordSearchText = value;
      },
      searchSubmitted: function() {
        this.pagingData['totalSize'] = 0;
        this.pagingData['pageIndex'] = 1;
        this.pagingData['hasNextPage'] = false;
        this.nextPage();
      },
      nextPage: function() {
        const filterInstance = this;
        const pagingData = filterInstance.pagingData;
        const paginatedConfig = {
          searchText: componentContext.state.keywordSearchText,
          pageIndex: pagingData.pageIndex - 1,
          limit: pagingData.limit,
        };
        componentContext.cm.getKeywords(componentContext.catalogId, paginatedConfig).pipe(
          takeUntil(componentContext._destroySub$),
        ).subscribe((response: HttpResponse<KeywordCount[]>) => {
          if (pagingData.pageIndex === 1) {
            filterInstance.rawFilterItems = response.body;
          } else {
            filterInstance.rawFilterItems = filterInstance.rawFilterItems.concat(response.body);
          }
          filterInstance.setFilterItems();
          pagingData['totalSize'] = Number(response.headers.get('x-total-count')) || 0;
          pagingData['hasNextPage'] = filterInstance.filterItems.length < pagingData.totalSize;
          filterInstance.numChecked = componentContext.keywords.length;
        }, error => componentContext._toast.createErrorToast(error));
      },
      getItemTooltip: function(filterItem: FilterItem) {
        return `${filterItem.value[`${CATALOG}keyword`]} (${filterItem.value['count']})`;
      },
      setFilterItems: function() {
        this.filterItems = map(this.rawFilterItems, keywordObject => ({
          value: keywordObject,
          display: `${keywordObject[`${CATALOG}keyword`]} (${keywordObject['count']})`,
          checked: componentContext.keywords.findIndex(item => item.value[`${CATALOG}keyword`] === keywordObject[`${CATALOG}keyword`]) >= 0
        }));
      },
      filter: function(filterItem: FilterItem) {
        const changedIdx = componentContext.keywords.findIndex(checkedKeyword => checkedKeyword.value[`${CATALOG}keyword`] === filterItem.value[`${CATALOG}keyword`]);
        if (changedIdx >= 0) {
          componentContext.keywords.splice(changedIdx, 1);
        } else {
          componentContext.keywords.push(filterItem);
        }
        componentContext.changeFilter.emit({
          recordTypeFilterList: componentContext.recordTypes, 
          keywordFilterList: componentContext.keywords, 
          creatorFilterList: componentContext.creators
        });
        this.numChecked = componentContext.keywords.length;
      },
      reset: function() {
        componentContext.changeFilter.emit({
          recordTypeFilterList: componentContext.recordTypes, 
          keywordFilterList: [],
          creatorFilterList: componentContext.creators
        });
        this.numChecked = 0;
      }
    };

    this.filters = [recordTypeFilter, creatorFilter, keywordsFilter];
    this.filters.forEach(filter => {
      if ('onInit' in filter) {
        filter.onInit();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes?.recordTypes) {
      this.updateFilterList(this.recordTypeFilterIndex, changes.recordTypes.currentValue, changes.recordTypes.previousValue);
    }
    if (changes?.keywords) {
      this.updateFilterList(this.keywordFilterIndex, changes.keywords.currentValue, changes.keywords.previousValue);
    }
    if (changes?.creators) {
      this.updateFilterList(this.creatorFilterIndex, changes.creators.currentValue, changes.creators.previousValue);
    }
  }

  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }

  /**
   * Updates a list type filter based on the current values and previous values provided. Only handles removed values
   * as that is the only use case expected.
   *
   * @param {number} filterIndex The index of the filter to update in the `filters` array
   * @param {FilterItem[]} currentValue The current list of selected type filters
   * @param {FilterItem[]} previousValue The previous list of selected type filters
   */
  updateFilterList(filterIndex: number, currentValue: FilterItem[], previousValue: FilterItem[]): void {
    if (currentValue?.length < previousValue?.length) {
      const filter = this.filters[filterIndex];
      filter.filterItems
        .filter(item => currentValue.findIndex(updatedItem => updatedItem.value === item.value) < 0 && item.checked)
        .forEach(item => {
          item.checked = false;
        });
        filter.numChecked = currentValue.length;
    }
  }
}
