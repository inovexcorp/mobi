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
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';

import { get } from 'lodash';
import { Observable, of } from 'rxjs';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { EntityRecord } from '../../models/entity-record';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { getBeautifulIRI } from '../../../shared/utility';
import { SelectedEntityFilters } from '../../models/selected-entity-filters.interface';

/**
 * The SearchResultsListComponent represents a component that displays search results.
 * It retrieves search results from a service and updates the view accordingly.
 */
@Component({
  selector: 'app-search-results-list',
  templateUrl: './search-results-list.component.html'
})
export class SearchResultsListComponent implements OnInit {
  records = [];
  catalogId = '';
  searchResult: Observable<EntityRecord[]>;
  searchText: string;
  selectedFilters: SelectedEntityFilters;

  constructor(public state: EntitySearchStateService, 
    private _cm: CatalogManagerService) {
  }

  ngOnInit(): void {
    this.catalogId = get(this._cm.localCatalog, '@id', '');
    this.searchText = this.state.paginationConfig.searchText;
    this._initializeSelectedFilters();
    this.searchResult = of(this.state.currentResults);
  }

  /**
   * Update the result page based on a given page event.
   *
   * @param {PageEvent} pageEvent - The page event that triggered the update.
   */
  getResultPage(pageEvent: PageEvent): void {
    this.state.paginationConfig.pageIndex = pageEvent.pageIndex;
    this.setResults();
  }

  /**
   * Sets the search results.
   */
  setResults(): void {
    this.searchResult = this.state.setResults(this.catalogId);
  }

  /**
   * This method resets the pagination state and searches for records.
   */
  searchRecords(): void {
    this.state.resetPagination();
    this._loadData();
  }

  /**
   * Updates the filter criteria for the data and reloads the data accordingly.
   *
   * @param {SelectedEntityFilters} changeDetails - The details of the filter change.
   * @param {string[]} changeDetails.chosenTypes - The new list of chosen types for filtering the data.
   */
  changeFilter(changeDetails: SelectedEntityFilters): void {
    this.state.resetPagination();
    this._setPaginationFilters(changeDetails);
    this.selectedFilters = changeDetails;
    this._loadData();
  }

  /**
   * Initializes the selected filters list based on the values from the state service.
   * 
   * @private
   */
  private _initializeSelectedFilters() {
    this.selectedFilters = {
      chosenTypes: this.state.paginationConfig?.type ? this.state.paginationConfig?.type.map(type => ({
        value: type,
        display: getBeautifulIRI(type),
        checked: true
      })) : [],
      keywordFilterItems: this.state.paginationConfig?.keywords ? this.state.paginationConfig?.keywords.map(keyword => ({
        value: keyword,
        display: keyword,
        checked: true
      })) : []
    };
  }
  /**
   * Updates the pagination config on the state service to align with the provided new filter values.
   * 
   * @private
   * @param {SelectedEntityFilters} filters New filter values coming from the
   *    {@link entity-search.EntitySearchFiltersComponent}.
   */
  private _setPaginationFilters(filters: SelectedEntityFilters): void {
    this.state.paginationConfig.type = filters.chosenTypes.map(item => item.value);
    this.state.paginationConfig.keywords = filters.keywordFilterItems.map(item => item.value);
  }
  /**
   * Loads data based on the searchText value.
   * 
   * @private
   */
  private _loadData(): void {
    if (this.searchText) {
      this.state.paginationConfig.searchText = this.searchText;
      this.searchResult = this.state.setResults(this.catalogId);
    } else {
      this.searchResult = of([]);  //clear result
    }
  }
}