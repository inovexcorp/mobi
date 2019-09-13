/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import * as angular from 'angular';

import commentDisplayComponent from './components/commentDisplay/commentDisplay.component';
import createRequestComponent from './components/createRequest/createRequest.component';
import editRequestOverlayComponent from './components/editRequestOverlay/editRequestOverlay.component';
import mergeRequestDiscussionComponent from './components/mergeRequestDiscussion/mergeRequestDiscussion.component';
import mergeRequestListComponent from './components/mergeRequestList/mergeRequestList.component';
import mergeRequestsPageComponent from './components/mergeRequestsPage/mergeRequestsPage.component';
import mergeRequestTabsetComponent from './components/mergeRequestTabset/mergeRequestTabset.component';
import mergeRequestViewComponent from './components/mergeRequestView/mergeRequestView.component';
import replyCommentComponent from './components/replyComment/replyComment.component';
import requestBranchSelectComponent from './components/requestBranchSelect/requestBranchSelect.component';
import requestDetailsFormComponent from './components/requestDetailsForm/requestDetailsForm.component';
import requestRecordSelectComponent from './components/requestRecordSelect/requestRecordSelect.component';

/**
 * @ngdoc overview
 * @name merge-requests
 *
 * @description
 * The `merge-requests` module provides components that make up the Merge Requests module in the Mobi application.
 */
angular.module('merge-requests', [])
    .component('commentDisplay', commentDisplayComponent)
    .component('createRequest', createRequestComponent)
    .component('editRequestOverlay', editRequestOverlayComponent)
    .component('mergeRequestDiscussion', mergeRequestDiscussionComponent)
    .component('mergeRequestList', mergeRequestListComponent)
    .component('mergeRequestsPage', mergeRequestsPageComponent)
    .component('mergeRequestTabset', mergeRequestTabsetComponent)
    .component('mergeRequestView', mergeRequestViewComponent)
    .component('replyComment', replyCommentComponent)
    .component('requestBranchSelect', requestBranchSelectComponent)
    .component('requestDetailsForm', requestDetailsFormComponent)
    .component('requestRecordSelect', requestRecordSelectComponent);
