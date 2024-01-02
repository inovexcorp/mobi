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
import { HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { DCTERMS } from '../../prefixes';
import { Dataset } from '../models/dataset.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { PaginatedConfig } from '../models/paginatedConfig.interface';
import { DatasetManagerService } from './datasetManager.service';

/**
 * @class shared.DatasetStateService
 *
 * A service which contains various variables to hold the state of the datasets page and utility functions to update
 * those variables.
 */
@Injectable()
export class DatasetStateService {

    constructor(private dm: DatasetManagerService) {}

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
        sortOption: {
            field: `${DCTERMS}title`,
            label: 'Title',
            asc: true
        }
    };
    /**
     * `totalSize` holds an integer for the total number of results for the current paginated
     * results list.
     * @type {number}
     */
    totalSize = 0;
    /**
     * `selectedDataset` holds the currently selected Dataset being edited or having data uploaded to it.
     * @type {Dataset}
     */
    selectedDataset: Dataset;
    /**
     * `submittedSearch` holds a boolean determining whether a search has been submitted on the datasets-page
     * @type {boolean}
     */
    submittedSearch = false;

    /**
     * Resets all state variables.
     */
    reset(): void {
        this.resetPagination();
    }
    /**
     * Calls the appropriate {@link shared.DatasetManagerService} method to retrieve results of a Dataset Records query.
     */
    setResults(): Observable<Dataset[]> {
        return this.dm.getDatasetRecords(this.paginationConfig, true)
            .pipe(
                switchMap(response => {
                    this.setPagination(response);
                    return of(response.body.map(arr => this.dm.splitDatasetArray(arr)));
                })
            );
    }
    /**
     * Resets all the pagination related variables.
     */
    resetPagination(): void {
        this.paginationConfig.pageIndex = 0;
        this.paginationConfig.searchText = '';
        this.totalSize = 0;
    }
    /**
     * Sets the pagination state variables based on the information in the passed response from
     * an HTTP call.
     *
     * @param {HttpResponse<JSONLDObject[][]>} response A response from a paginated HTTP call
     */
    setPagination(response: HttpResponse<JSONLDObject[][]>): void {
        this.totalSize = Number(response.headers.get('x-total-count')) || 0;
    }
}
