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
import { HttpClient, HttpResponse } from '@angular/common/http';

import { get } from 'lodash';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { REST_PREFIX } from '../../constants';
import { EntityRecord } from '../models/entity-record';
import { PaginatedConfig } from '../../shared/models/paginatedConfig.interface';
import { handleError, paginatedConfigToHttpParams } from '../../shared/utility';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { CatalogManagerService } from '../../shared/services/catalogManager.service';

/**
 * EntitySearchManagerService class is responsible for retrieving entities based on the provided configuration
 */
@Injectable({
  providedIn: 'root'
})
export class EntitySearchManagerService {
  /**
   * The prefix for catalogs REST API endpoints.
   *
   * @type {string}
   * @constant
   * @default
   */
  prefix = `${REST_PREFIX}catalogs`;
  /**
   * The catalogId variable represents the unique identifier of a catalog.
   *
   * @type {string}
   */
  catalogId = '';
  searchURL = '';
  constructor(private cm: CatalogManagerService,
              private http: HttpClient,
              private spinnerSvc: ProgressSpinnerService) {
  }

  /**
   * Initializes the service by retrieving the {@link shared.CatalogManagerService local catalog} id.
   */
  initialize(): void {
    this.catalogId = get(this.cm.localCatalog, '@id', '');
    // set url
    this.searchURL = `${this.prefix}/${encodeURIComponent(this.catalogId)}/entities`;
  }

  /**
   * Retrieves entities based on the provided configuration.
   *
   * @param {PaginatedConfig} config - The configuration for retrieving entities.
   * @returns {Observable<HttpResponse<EntityRecord[]>>} - The observable containing the HTTP response with the retrieved JSONLDObject entities.
   */
  getEntities(config: PaginatedConfig): Observable<HttpResponse<EntityRecord[]>> {
    let params = paginatedConfigToHttpParams(config);
    if (config.searchText) {
      params = params.set('searchText', config.searchText);
    }

    return this.spinnerSvc.track(this.http.get<EntityRecord[]>(this.searchURL, {params, observe: 'response'}))
      .pipe(catchError(handleError));
  }

}
