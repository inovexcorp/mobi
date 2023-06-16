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
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import { MergeRequest } from '../../../shared/models/mergeRequest.interface';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';

/**
 * @class merge-requests.MergeRequestTabsetComponent
 *
 * A component which creates a div containing a `mat-tab-group` with tabs for the
 * {@link merge-requests.MergeRequestDiscussionComponent},
 * {@link shared.CommitChangesDisplayComponent changes}, and
 * {@link shared.CommitHistoryTableComponent commits} of the provided Merge Request.
 *
 * @param {MergeRequest} request The MergeRequest to display details about. Has a change function
 */
@Component({
    selector: 'merge-request-tabset',
    templateUrl: './mergeRequestTabset.component.html',
    styleUrls: ['./mergeRequestTabset.component.scss']
})
export class MergeRequestTabsetComponent implements OnInit {
    tabIndex = 0;
    branchList = [];
    @Input() request: MergeRequest;
    
    @Output() requestChange = new EventEmitter<MergeRequest>();

    constructor(public state: MergeRequestsStateService) {}
    getEntityName(iri: string): string {
        return this.state.getEntityNameLabel(iri);
    }

    ngOnInit(): void {
        this.branchList = [this.request.targetBranch, this.request.sourceBranch];
    }
}
