/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { get } from 'lodash';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CatalogStateService } from '../../../shared/services/catalogState.service';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class catalog.RecordsViewComponent
 *
 * A component which creates a div with a Bootstrap `row` containing a list of Records in the Mobi instance. The list
 * can be sorted using a {@link catalog.SortOptionsComponent}, searched using a {@link catalog.SearchBarComponent}, and
 * filtered using a {@link catalog.RecordFiltersComponent}. The list is also paginated with a `mat-paginator`. Each
 * Record is displayed using a {@link catalog.RecordCardComponent} that will select the Record it in the
 * {@link shared.CatalogStateService} when clicked.
 */
@Component({
    selector: 'records-view',
    templateUrl: './recordsView.component.html',
    styleUrls: ['./recordsView.component.scss']
})
export class RecordsViewComponent implements OnInit {
    records = [];
    catalogId = '';

    constructor(public state: CatalogStateService, public cm: CatalogManagerService, public toast: ToastService) {}

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.state.currentRecordPage = 0;
        this.setRecords(this.state.recordSearchText, this.state.recordFilterType, this.state.keywordFilterList, 
          this.state.creatorFilterList, this.state.recordSortOption);
    }
    openRecord(record: JSONLDObject): void {
        this.state.selectedRecord = record;
    }
    changeSort(): void {
        this.state.currentRecordPage = 0;
        this.setRecords(this.state.recordSearchText, this.state.recordFilterType, this.state.keywordFilterList, 
          this.state.creatorFilterList, this.state.recordSortOption);
    }
    changeFilter(changeDetails: {recordType: string, keywordFilterList: string[], creatorFilterList: string[]}): void {
        this.state.currentRecordPage = 0;
        this.setRecords(this.state.recordSearchText, changeDetails.recordType, changeDetails.keywordFilterList, 
          changeDetails.creatorFilterList, this.state.recordSortOption);
    }
    searchRecords(): void {
        this.search(this.state.recordSearchText);
    }
    search(searchText: string): void {
        this.state.currentRecordPage = 0;
        this.setRecords(searchText, this.state.recordFilterType, this.state.keywordFilterList, 
          this.state.creatorFilterList, this.state.recordSortOption);
    }
    getRecordPage(pageEvent: PageEvent): void {
        this.state.currentRecordPage = pageEvent.pageIndex;
        this.setRecords(this.state.recordSearchText, this.state.recordFilterType, this.state.keywordFilterList, 
          this.state.creatorFilterList, this.state.recordSortOption);
      }
    setRecords(searchText: string, recordType: string, keywordFilterList: string[], creatorFilterList: string[], sortOption: SortOption): void {
        const paginatedConfig: PaginatedConfig = {
            pageIndex: this.state.currentRecordPage,
            limit: this.state.recordLimit,
            sortOption,
            type: recordType,
            searchText,
            keywords: keywordFilterList,
            creators: creatorFilterList,
        };

        this.cm.getRecords(this.catalogId, paginatedConfig)
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.state.recordFilterType = recordType;
                this.state.keywordFilterList = keywordFilterList;
                this.state.creatorFilterList = creatorFilterList;
                this.state.recordSearchText = searchText;
                this.state.recordSortOption = sortOption;
                this.records = response.body;
                this.state.totalRecordSize = Number(response.headers.get('x-total-count')) || 0;
            }, this.toast.createErrorToast);
    }
}
