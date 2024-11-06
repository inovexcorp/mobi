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
import { CatalogManagerService } from '../../shared/services/catalogManager.service';

/**
 * @class entity-search.EntitySearchStateService
 * 
 * This service holds all state variables for the EntitySearch module along with helper methods.
 */
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
    type: []
  };
  /**
   * `totalRecordSize` holds an integer for the total number of entity search result in the latest query on the
   * {@link entitySearch.SearchResultsListComponent}.
   * @type {number}
   */
  totalResultSize = 0;

  constructor(private _cm: CatalogManagerService) {}

  /**
   * Resets the pagination config to its initial state.
   */
  reset(): void {
    this.resetPagination();
    this.paginationConfig.type = [];
  }

  /**
   * Sets the results of the dataset by making a request to the server.
   *
   * @param {string} catalogId The id of the Catalog to retrieve entities from
   * @return {Observable<EntityRecord[]>} An observable stream that emits an array of Dataset objects.
   */
  setResults(catalogId: string): Observable<EntityRecord[]> {
    return this._cm.getEntities(catalogId, this.paginationConfig)
        .pipe(
            switchMap(response => {
              this.totalResultSize = response.totalCount;
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
}
