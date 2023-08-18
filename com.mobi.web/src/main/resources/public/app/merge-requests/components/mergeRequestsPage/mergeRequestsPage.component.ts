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
import { Component, OnInit } from '@angular/core';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { MergeRequestFilterEvent } from '../../models/merge-request-filter-event';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestPaginatedConfig } from '../../../shared/models/mergeRequestPaginatedConfig.interface';
import { PageEvent } from '@angular/material/paginator';

/**
 * `mergeRequestsPage` is a component which creates a div containing the main parts of the Merge Requests
 * tool. The main parts of the page are the {@link merge-requests.MergeRequestListComponent},
 * {@link merge-requests.MergeRequestViewComponent}, and
 * {@link merge-requests.CreateRequestComponent createRequest page}.
 */
@Component({
    selector: 'merge-requests-page',
    templateUrl: './mergeRequestsPage.component.html',
    styleUrls: ['./mergeRequestsPage.component.scss']
})
export class MergeRequestsPageComponent implements  OnInit {
    private recordType: string;
    constructor(public state: MergeRequestsStateService,   public ms: MergeRequestManagerService) {}

    ngOnInit(): void {
        this.state.recordSortOption = this.state.recordSortOption || this.ms.sortOptions[0];
        this._loadRecords();
    }
    changeFilter(changeDetails: MergeRequestFilterEvent): void {
        this.state.acceptedFilter = changeDetails.requestStatus;
        this.state.currentRecordPage = 0;
        this.setRecords(this.state.recordSortOption, changeDetails.recordType, changeDetails.requestStatus)
    }

    changeSort(): void {
        this._loadRecords();
    }

    private _loadRecords() {
        this.setRecords(this.state.recordSortOption, this.state.recordType, this.state.acceptedFilter);
    }
    setRecords(sortOption: SortOption, recordType:string, requestStatus= false): void {
        const paginatedConfig: MergeRequestPaginatedConfig = {
            pageIndex: this.state.currentRecordPage,
            limit: this.state.recordLimit,
            sortOption,
            type: this.recordType,
            accepted: requestStatus
        };
        this.state.setRequests(paginatedConfig);
    }

    getRecordPage($event: PageEvent): void {
        this.state.currentRecordPage = $event.pageIndex;
        this._loadRecords();
    }
}
