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
import { Component, EventEmitter, OnInit, OnChanges, SimpleChanges, Output, Input, OnDestroy } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { get } from 'lodash';

import { CATALOG } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { FilterType, ListFilter } from '../../../shared/models/list-filter.interface';
import { KeywordCount } from '../../../shared/models/keywordCount.interface';
import { SearchableListFilter } from '../../../shared/models/searchable-list-filter.interface';
import { SelectedEntityFilters } from '../../models/selected-entity-filters.interface';

/**
 * @class entity-search.EntitySearchFiltersComponent
 * 
 * The EntitySearchFiltersComponent is responsible for rendering and managing
 * the search filters for different record types in the entity search module.
 * It emits events when filters are updated, allowing other parts of the application
 * to react to changes in the selected filters.
 *
 * @param {FilterItem[]} typeFilters The list of selected record type filter items
 * @param {FilterItem[]} keywordFilterItems The list of selected keywords filter items
 * @param {Function} changeFilter A function that is called with a {@link entity-search.SelectedEntityFilters}
 * representing the updated values for each filter. This function should update the `typeFilters` binding.
 */
@Component({
  selector: 'app-entity-search-filters',
  templateUrl: './entity-search-filters.component.html',
})
export class EntitySearchFiltersComponent implements OnInit, OnChanges, OnDestroy {
  readonly recordFilterIndex = 0;
  readonly keywordFilterIndex = 1;
  _destroySub$ = new Subject<void>();

  filters: ListFilter[] = [];
  catalogId: string;

  @Input() typeFilters: FilterItem[] = [];
  @Input() keywordFilterItems: FilterItem[] = [];
  @Output() changeFilter = new EventEmitter<SelectedEntityFilters>();

  constructor(public state: EntitySearchStateService,
    private _cm: CatalogManagerService
  ) {}

  ngOnInit(): void {
    this.catalogId = get(this._cm.localCatalog, '@id', '');

    const componentContext = this;

    const recordTypeFilter: ListFilter = this._cm.getRecordTypeFilter(
      (value) => this.typeFilters.findIndex(item => item.value === value) >= 0,
      (items) => componentContext.changeFilter.emit({chosenTypes: items, keywordFilterItems: componentContext.keywordFilterItems}),
      `${CATALOG}VersionedRDFRecord`
    );
    recordTypeFilter.reset = function () {
      componentContext.typeFilters = [];
      componentContext.changeFilter.emit({
        chosenTypes: componentContext.typeFilters,
        keywordFilterItems: componentContext.keywordFilterItems
      });
      this.numChecked = componentContext.typeFilters.length;
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
        componentContext._cm.getKeywords(componentContext.catalogId, paginatedConfig).pipe(
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
          filterInstance.numChecked = componentContext.keywordFilterItems.length;
        });
      },
      getItemTooltip: function(filterItem: FilterItem) {
        return filterItem.value;
      },
      setFilterItems: function() {
        this.filterItems = this.rawFilterItems.map((keywordObject: KeywordCount) => ({
          value: `${keywordObject[`${CATALOG}keyword`]}`,
          display: `${keywordObject[`${CATALOG}keyword`]}`,
          checked: componentContext.keywordFilterItems.findIndex(item => item.value === keywordObject[`${CATALOG}keyword`]) >= 0
        }));
      },
      filter: function(filterItem: FilterItem) {
        const changedIdx = componentContext.keywordFilterItems.findIndex(checkedKeyword => checkedKeyword.value === filterItem.value);
        if (changedIdx >= 0) {
          componentContext.keywordFilterItems.splice(changedIdx, 1);
        } else {
          componentContext.keywordFilterItems.push(filterItem);
        }
        componentContext.changeFilter.emit({
          chosenTypes: componentContext.typeFilters,
          keywordFilterItems: componentContext.keywordFilterItems
        });
        this.numChecked = componentContext.keywordFilterItems.length;
      },
      reset: function () {
        componentContext.keywordFilterItems = [];
        componentContext.changeFilter.emit({
          chosenTypes: componentContext.typeFilters,
          keywordFilterItems: componentContext.keywordFilterItems
        });
        this.numChecked = componentContext.keywordFilterItems.length;
      }
    };
    this.filters = [
      recordTypeFilter,
      keywordsFilter
    ];
    this.filters.forEach(filter => {
      if ('onInit' in filter) {
        filter.onInit();
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.typeFilters) {
      this.updateFilterList(this.recordFilterIndex, changes.typeFilters.currentValue, changes.typeFilters.previousValue);
    }
    if (changes && changes.keywordFilterItems) {
      this.updateFilterList(this.keywordFilterIndex, changes.keywordFilterItems.currentValue, changes.keywordFilterItems.previousValue);
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