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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { PageEvent } from '@angular/material/paginator';

import { get } from 'lodash';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CATALOG } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { FilterItem } from '../../../shared/models/filterItem.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { SelectedRecordFilters } from '../../models/selected-record-filters.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class catalog.RecordsViewComponent
 *
 * A component which creates a div with a Bootstrap `row` containing a list of Records in the Mobi instance. The list
 * can be sorted using a {@link catalog.SortOptionsComponent}, searched using a {@link catalog.SearchBarComponent}, and
 * filtered using a {@link catalog.RecordFiltersComponent}. The currently selected filters are displayed with a
 * {@link shared.FiltersSelectedListComponent}/ The list is also paginated with a `mat-paginator`. Each Record is
 * displayed using a {@link catalog.RecordCardComponent} that will select the Record it in the
 * {@link shared.CatalogStateService} when clicked.
 */
@Component({
  selector: 'records-view',
  templateUrl: './recordsView.component.html',
  styleUrls: ['./recordsView.component.scss']
})
export class RecordsViewComponent implements OnInit, OnDestroy {
  records = [];
  catalogId = '';
  selectedFilters: SelectedRecordFilters;

  private _destroySub$ = new Subject<void>();
  
  constructor(public state: CatalogStateService, public cm: CatalogManagerService, private _toast: ToastService) {}

  ngOnInit(): void {
    this.catalogId = get(this.cm.localCatalog, '@id', '');
    this.state.currentRecordPage = 0;
    this._initializeSelectedFilters();
    this.setRecords(this.state.recordSearchText, this.state.recordTypeFilterList, this.state.keywordFilterList, 
      this.state.creatorFilterList, this.state.recordSortOption);
  }
  ngOnDestroy(): void {
    this._destroySub$.next();
    this._destroySub$.complete();
  }
  openRecord(record: JSONLDObject): void {
    this.state.selectedRecord = record;
  }
  changeSort(): void {
    this.state.currentRecordPage = 0;
    this.setRecords(this.state.recordSearchText, this.state.recordTypeFilterList, this.state.keywordFilterList, 
      this.state.creatorFilterList, this.state.recordSortOption);
  }
  changeFilter(changeDetails: SelectedRecordFilters): void {
    this.state.currentRecordPage = 0;
    this._cleanSelectedFilters(changeDetails);
    this.selectedFilters = changeDetails;
    this.setRecords(this.state.recordSearchText, changeDetails.recordTypeFilterList, changeDetails.keywordFilterList, 
      changeDetails.creatorFilterList, this.state.recordSortOption);
  }
  searchRecords(): void {
    this.search(this.state.recordSearchText);
  }
  search(searchText: string): void {
    this.state.currentRecordPage = 0;
    this.setRecords(searchText, this.state.recordTypeFilterList, this.state.keywordFilterList, 
      this.state.creatorFilterList, this.state.recordSortOption);
  }
  getRecordPage(pageEvent: PageEvent): void {
    this.state.currentRecordPage = pageEvent.pageIndex;
    this.setRecords(this.state.recordSearchText, this.state.recordTypeFilterList, this.state.keywordFilterList, 
      this.state.creatorFilterList, this.state.recordSortOption);
  }
  setRecords(searchText: string, recordTypeFilterList: FilterItem[], keywordFilterList: FilterItem[], creatorFilterList: FilterItem[], sortOption: SortOption): void {
    const paginatedConfig: PaginatedConfig = {
      pageIndex: this.state.currentRecordPage,
      limit: this.state.recordLimit,
      sortOption,
      searchText,
      type: recordTypeFilterList ? recordTypeFilterList.map(item => item.value) : undefined,
      keywords: keywordFilterList ? keywordFilterList.map(item => item.value[`${CATALOG}keyword`]) : undefined,
      creators: creatorFilterList ? creatorFilterList.map(item => item.value['user'].iri): undefined,
    };

    this.cm.getRecords(this.catalogId, paginatedConfig).pipe(
      takeUntil(this._destroySub$),
    ).subscribe((response: HttpResponse<JSONLDObject[]>) => {
        this.state.recordTypeFilterList = recordTypeFilterList;
        this.state.keywordFilterList = keywordFilterList;
        this.state.creatorFilterList = creatorFilterList;
        this.state.recordSearchText = searchText;
        this.state.recordSortOption = sortOption;
        this.records = response.body;
        this.state.totalRecordSize = Number(response.headers.get('x-total-count')) || 0;
      }, this._toast.createErrorToast);
  }

  /**
   * Initializes the selected filters list based on the values from the state service.
   */
  private _initializeSelectedFilters() {
    this.selectedFilters = {
      recordTypeFilterList: this.state.recordTypeFilterList,
      keywordFilterList: this.state.keywordFilterList,
      creatorFilterList: this.state.creatorFilterList
    };
  }

  /**
   * Removes the record counts from the filter item display fields so that the selected filter chips don't include them.
   * 
   * @param {SelectedRecordFilters} selectedFilters The selected filters to clean up
   */
  private _cleanSelectedFilters(selectedFilters: SelectedRecordFilters): void {
    selectedFilters.creatorFilterList = selectedFilters.creatorFilterList.map(item => ({
      value: item.value,
      checked: item.checked,
      display: item.display.replace(/ \(\d+\)/, '')
    }));
    selectedFilters.keywordFilterList = selectedFilters.keywordFilterList.map(item => ({
      value: item.value,
      checked: item.checked,
      display: item.display.replace(/ \(\d+\)/, '')
    }));
  }
}
