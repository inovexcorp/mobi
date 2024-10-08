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
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { EntityRecord } from '../models/entity-record';
import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { EntitySearchManagerService } from './entity-search-manager.service';


@Injectable({
  providedIn: 'root'
})
export class EntitySearchStateService {
  /**
   * `paginationConfig` holds the configuration to be used when retrieving the results of a
   * Dataset Records query. These configurations are the limit, page index, search text,
   * and sort option. The limit and sortOption are not to be changed for now.
   * @type {PaginatedConfig}
   */
  paginationConfig: PaginatedConfig = {
    limit: 10,
    pageIndex: 0,
    searchText: '',
  };
  /**
   * `totalRecordSize` holds an integer for the total number of entity search result in the latest query on the
   * {@link entitySearch.SearchResultsListComponent}.
   * @type {number}
   */
  totalResultSize = 0;
  /**
   * `recordSortOption` holds one of the options from the `sortOptions` in the
   * {@link entitySearch.SearchResultsListComponent}.
   * @type {SortOption}
   */
  /**
   /**
   * `selectedRecord` holds the currently selected entity Record object that is being viewed in the
   * {@link entitySearch.SearchResultsListComponent}.
   * @type {EntityRecord}
   */
  selectedRecord: EntityRecord = undefined;

  constructor(private em: EntitySearchManagerService) {
  }

  /**
   * Resets the pagination config to its initial state.
   *
   * @returns {void}
   */
  reset(): void {
    this.resetPagination();
  }

  /**
   * Initializes necessary values for EntityManager.
   *
   * @return {void}
   */
  init(): void {
    this.em.initialize();
  }

  /**
   * Sets the results of the dataset by making a request to the server.
   *
   * @return {Observable<EntityRecord[]>} An observable stream that emits an array of Dataset objects.
   */
  setResults(): Observable<EntityRecord[]> {
    return this.em.getEntities(this.paginationConfig)
      .pipe(
        switchMap(response => {
          this.setPagination(response.totalCount);
          return of(response.page);
        })
      );
  }

  /**
   * Resets all the pagination related variables.
   */
  resetPagination(): void {
    this.paginationConfig.pageIndex = 0;
    this.paginationConfig.searchText = '';
    this.totalResultSize = 0;
  }

  /**
   * Updates the pagination state variables based on the total number of results.
   *
   * @param {number} totalCount - The total number of results returned from a paginated HTTP call.
   */
  setPagination(totalCount: number): void {
    this.totalResultSize = totalCount;
  }
}
