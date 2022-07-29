/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { MatDialog } from '@angular/material';

import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';

import './mergeRequestList.component.scss';

/**
 * @class merge-requests.MergeRequestListComponent
 *
 * A component which creates a div containing a list of MergeRequests retrieved by the
 * {@link shared.MergeRequestsStateService}. The component houses the method for opening a modal for deleting merge
 * requests.
 */
@Component({
    selector: 'merge-request-list',
    templateUrl: './mergeRequestList.component.html'
})
export class MergeRequestListComponent implements OnInit {
    filterOptions = [
        { value: false, label: 'Open' },
        { value: true, label: 'Accepted' }
    ];

    constructor(public state: MergeRequestsStateService, public dialog: MatDialog) {}

    ngOnInit(): void {
        this.state.setRequests(this.state.acceptedFilter);
    }
    showDeleteOverlay(request: MergeRequest): void {
        this.dialog.open(ConfirmModalComponent, {
            data: {
                content: '<p>Are you sure you want to delete ' + request.title + '?</p>'
            }
        }).afterClosed().subscribe((result: boolean) => {
            if (result) {
                this.state.deleteRequest(request);
            }
        });
    }
}
