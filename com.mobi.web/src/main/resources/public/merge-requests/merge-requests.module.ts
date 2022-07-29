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
import { NgModule } from '@angular/core';
import * as angular from 'angular';
import { downgradeComponent } from '@angular/upgrade/static';

import { SharedModule } from '../shared/shared.module';

import { AssigneeInputComponent } from './components/assigneeInput/assigneeInput.component';
import { CommentDisplayComponent } from './components/commentDisplay/commentDisplay.component';
import { CreateRequestComponent } from './components/createRequest/createRequest.component';
import { EditRequestOverlayComponent } from './components/editRequestOverlay/editRequestOverlay.component';
import { MergeRequestDiscussionComponent } from './components/mergeRequestDiscussion/mergeRequestDiscussion.component';
import { MergeRequestListComponent } from './components/mergeRequestList/mergeRequestList.component';
import { MergeRequestsPageComponent } from './components/mergeRequestsPage/mergeRequestsPage.component';
import { MergeRequestTabsetComponent } from './components/mergeRequestTabset/mergeRequestTabset.component';
import { MergeRequestViewComponent } from './components/mergeRequestView/mergeRequestView.component';
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
        MergeRequestListComponent,
        MergeRequestsPageComponent,
        MergeRequestTabsetComponent,
        MergeRequestViewComponent,
        ReplyCommentComponent,
        RequestBranchSelectComponent,
        RequestDetailsFormComponent,
        RequestRecordSelectComponent
    ],
    entryComponents: [
        EditRequestOverlayComponent,
        MergeRequestsPageComponent
    ]
})
export class MergeRequestsModule {}

angular.module('merge-requests', [])
    .directive('assigneeInput', downgradeComponent({component: AssigneeInputComponent}) as angular.IDirectiveFactory)
    .directive('commentDisplay', downgradeComponent({component: CommentDisplayComponent}) as angular.IDirectiveFactory)
    .directive('createRequest', downgradeComponent({component: CreateRequestComponent}) as angular.IDirectiveFactory)
    .directive('editRequestOverlay', downgradeComponent({component: EditRequestOverlayComponent}) as angular.IDirectiveFactory)
    .directive('mergeRequestDiscussion', downgradeComponent({component: MergeRequestDiscussionComponent}) as angular.IDirectiveFactory)
    .directive('mergeRequestList', downgradeComponent({component: MergeRequestListComponent}) as angular.IDirectiveFactory)
    .directive('mergeRequestsPage', downgradeComponent({component: MergeRequestsPageComponent}) as angular.IDirectiveFactory)
    .directive('mergeRequestTabset', downgradeComponent({component: MergeRequestTabsetComponent}) as angular.IDirectiveFactory)
    .directive('mergeRequestView', downgradeComponent({component: MergeRequestViewComponent}) as angular.IDirectiveFactory)
    .directive('replyComment', downgradeComponent({component: ReplyCommentComponent}) as angular.IDirectiveFactory)
    .directive('requestBranchSelect', downgradeComponent({component: RequestBranchSelectComponent}) as angular.IDirectiveFactory)
    .directive('requestDetailsForm', downgradeComponent({component: RequestDetailsFormComponent}) as angular.IDirectiveFactory)
    .directive('requestRecordSelect', downgradeComponent({component: RequestRecordSelectComponent}) as angular.IDirectiveFactory);
