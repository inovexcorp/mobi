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

import { Observable, of } from 'rxjs';

import { PageEvent } from '@angular/material/paginator';
import { EntityRecord } from '../../models/entity-record';
import { EntitySearchStateService } from '../../services/entity-search-state.service';

/**
 * The SearchResultsListComponent represents a component that displays search results.
 * It retrieves search results from a service and updates the view accordingly.
 */
@Component({
  selector: 'app-search-results-list',
  templateUrl: './search-results-list.component.html'
})
export class SearchResultsListComponent implements OnInit {
  /**
   * An Observable of an array of EntityRecord objects.
   *
   * @typedef {Observable<EntityRecord[]>} searchResult
   */
  searchResult: Observable<EntityRecord[]>;
  /**
   * Search text that is used to perform a search query.
   *
   * @typedef {string} searchText
   */
  searchText: string;

  constructor(public state: EntitySearchStateService) {
  }

  ngOnInit(): void {
    this.state.init();
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
    this.setResults();
  }

  /**
   * Sets the search results.
   *
   * @return {void} - This method does not return anything.
   */
  setResults(): void {
    this.searchResult = this.state.setResults();
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
    this.loadData();
  }

  /**
   * Loads data based on the searchText value.
   */
  private loadData(): void {
    if (this.searchText) {
      this.state.paginationConfig.searchText = this.searchText;
      this.setResults();
    } else {
      //clear result
      this.searchResult = of([]);
    }
  }
}
