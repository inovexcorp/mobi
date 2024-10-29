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

import { EntityRecord } from '../../models/entity-record';
import { EntitySearchStateService } from '../../services/entity-search-state.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';

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

  constructor(public state: EntitySearchStateService, private cm: CatalogManagerService) {}

  ngOnInit(): void {
    this.catalogId = get(this.cm.localCatalog, '@id', '');
    this.searchText = this.state.paginationConfig.searchText;
    this.loadData();
  }

  /**
   * Update the result page based on a given page event.
   *
   * @param {PageEvent} pageEvent - The page event that triggered the update.
   * @return {void}
   */
  getResultPage(pageEvent: PageEvent): void {
    this.state.paginationConfig.pageIndex = pageEvent.pageIndex;
    this.searchResult = this.state.setResults(this.catalogId);
  }

  /**
   * Searches for records.
   *
   * This method resets the pagination state and loads data.
   *
   * @return {void}
   */
  searchRecords(): void {
    this.state.resetPagination();
    this.state.paginationConfig.type = this.state.selectedRecordTypes;
    this.loadData();
  }

  /**
   * Updates the filter criteria for the data and reloads the data accordingly.
   *
   * @param {Object} changeDetails - The details of the filter change.
   * @param {string[]} changeDetails.chosenTypes - The new list of chosen types for filtering the data.
   * @return {void}
   */
  changeFilter(changeDetails: {chosenTypes: string[]}): void {
    this.state.resetPagination();
    this.state.paginationConfig.type = changeDetails.chosenTypes;
    this.loadData();
  }

  /**
   * Loads data based on the searchText value.
   */
  private loadData(): void {
    if (this.searchText) {
      this.state.paginationConfig.searchText = this.searchText;
      this.searchResult = this.state.setResults(this.catalogId);
    } else {
      //clear result
      this.searchResult = of([]);
    }
  }
}
