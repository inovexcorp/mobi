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
import { Component, Inject, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatStepper } from '@angular/material';

import { MergeRequestManagerService } from '../../../shared/services/mergeRequestManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';

import './createRequest.component.scss';

/**
 * @class merge-requests.CreateRequestComponent
 *
 * A component which creates a div containing the workflow steps of creating a MergeRequest. These steps are
 * {@link merge-requests.RequestRecordSelectComponent}, {@link merge-requests.RequestBranchSelectComponent}, and
 * {@link merge-requests.RequestDetailsFormComponent}.
 */
@Component({
    selector: 'create-request',
    templateUrl: './createRequest.component.html'
})
export class CreateRequestComponent implements OnInit, OnDestroy {
    @Input() commits:[any];
    @ViewChild('requestStepper') requestStepper: MatStepper;

    constructor(public mm: MergeRequestManagerService, public state: MergeRequestsStateService, @Inject('utilService') public util) {}

    // TODO: Come Angular 7, replace with binding on stepper in template 
    ngOnInit(): void {
        this.requestStepper.selectedIndex = this.state.createRequestStep;
    }
    ngOnDestroy(): void {
        this.state.createRequestStep = this.requestStepper.selectedIndex;
    }
    submit(): void {
        this.mm.createRequest(this.state.requestConfig)
            .subscribe(() => {
                this.util.createSuccessToast('Successfully created request');
                this.state.createRequest = false;
            }, error => this.util.createErrorToast(error));
    }
    resetBranchSelect(): void  {
        this.state.requestConfig.sourceBranchId = '';
        this.state.requestConfig.targetBranchId = '';
        delete this.state.requestConfig.sourceBranch;
        delete this.state.requestConfig.targetBranch;
        delete this.state.requestConfig.removeSource;
        this.state.clearDifference();
    }
    resetDetailsForm(): void {
        this.state.requestConfig.title = '';
        this.state.requestConfig.description = '';
        this.state.requestConfig.assignees = [];
        this.state.requestConfig.removeSource = false;
       
    }
    
    updateCommits(commits):void{
        this.commits = commits;
    }
}
