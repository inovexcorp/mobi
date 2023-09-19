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
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Subject } from 'rxjs';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestFilterEvent } from '../../models/merge-request-filter-event';
import { MergeRequestPaginatedConfig } from '../../../shared/models/mergeRequestPaginatedConfig.interface';
import { ToastService } from '../../../shared/services/toast.service';

/**
 * @class merge-requests.MergeRequestListComponent
 *
 * A component which creates a div containing a list of MergeRequests from the {@link shared.MergeRequestsStateService}
 * along with the {@link merge-requests.MergeRequestFilterComponent} and controls for searching and sorting the list.
 * The component houses a method for opening a modal for deleting merge requests.
 */
@Component({
    selector: 'merge-request-list',
    templateUrl: './mergeRequestList.component.html',
    styleUrls: ['./mergeRequestList.component.scss']
})
export class MergeRequestListComponent implements OnInit {
    searchText = '';
    updateFiltersSubject: Subject<void> = new Subject<void>();

    constructor(public state: MergeRequestsStateService, public ms: MergeRequestManagerService, 
        private dialog: MatDialog, private toast: ToastService) {}

    ngOnInit(): void {
        this.state.requestSortOption = this.state.requestSortOption || this.ms.sortOptions[0];
        this.searchText = this.state.requestSearchText;
        this.loadRequests();
    }
    changeFilter(changeDetails: MergeRequestFilterEvent): void {
        this.state.acceptedFilter = changeDetails.requestStatus;
        this.state.creators = changeDetails.creators;
        this.state.currentRequestPage = 0;
        this.loadRequests();
    }
    searchRequests(): void {
        this.state.requestSearchText = this.searchText;
        this.state.currentRequestPage = 0;
        this.loadRequests();
    }
    changePage(event: PageEvent): void {
      this.state.currentRequestPage = event.pageIndex;
      this.loadRequests();
    }
    loadRequests(): void {
        const paginatedConfig: MergeRequestPaginatedConfig = {
            pageIndex: this.state.currentRequestPage,
            limit: this.state.requestLimit,
            sortOption: this.state.requestSortOption,
            accepted: this.state.acceptedFilter,
            creators: this.state.creators,
            searchText: this.state.requestSearchText
        };
        this.state.setRequests(paginatedConfig);
    }
    showDeleteOverlay(request: MergeRequest): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: `<p>Are you sure you want to delete ${request.title}?</p>`
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.state.deleteRequest(request).subscribe(() => {
                    this.loadRequests();
                    this.updateFiltersSubject.next();
                }, error => this.toast.createErrorToast(error));
            }
        });
    }
}
