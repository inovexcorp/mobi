/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { AssigneeInputComponent } from './components/assigneeInput/assigneeInput.component';
import { CommentDisplayComponent } from './components/commentDisplay/commentDisplay.component';
import { CreateRequestComponent } from './components/createRequest/createRequest.component';
import { EditRequestOverlayComponent } from './components/editRequestOverlay/editRequestOverlay.component';
import { MergeRequestDiscussionComponent } from './components/mergeRequestDiscussion/mergeRequestDiscussion.component';
import { MergeRequestFilterComponent } from './components/merge-request-filter/merge-request-filter.component';
import { MergeRequestListComponent } from './components/mergeRequestList/mergeRequestList.component';
import { MergeRequestTabsetComponent } from './components/mergeRequestTabset/mergeRequestTabset.component';
import { MergeRequestViewComponent } from './components/mergeRequestView/mergeRequestView.component';
import { MergeRequestsPageComponent } from './components/mergeRequestsPage/mergeRequestsPage.component';
import { ReplyCommentComponent } from './components/replyComment/replyComment.component';
import { RequestBranchSelectComponent } from './components/requestBranchSelect/requestBranchSelect.component';
import { RequestDetailsFormComponent } from './components/requestDetailsForm/requestDetailsForm.component';
import { RequestRecordSelectComponent } from './components/requestRecordSelect/requestRecordSelect.component';

/**
 * @namespace merge-requests
 *
 * The `merge-requests` module provides components that make up the Merge Requests module in the Mobi application.
 */
@NgModule({
  imports: [ SharedModule ],
  declarations: [
    AssigneeInputComponent,
    CommentDisplayComponent,
    CreateRequestComponent,
    EditRequestOverlayComponent,
    MergeRequestDiscussionComponent,
    MergeRequestFilterComponent,
    MergeRequestListComponent,
    MergeRequestTabsetComponent,
    MergeRequestViewComponent,
    MergeRequestsPageComponent,
    ReplyCommentComponent,
    RequestBranchSelectComponent,
    RequestDetailsFormComponent,
    RequestRecordSelectComponent
  ]
})
export class MergeRequestsModule {}
