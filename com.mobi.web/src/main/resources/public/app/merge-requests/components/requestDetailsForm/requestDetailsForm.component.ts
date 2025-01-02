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

import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { get } from 'lodash';

import { CATALOG } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';

/**
 * @class merge-requests.RequestDetailsFormComponent
 *
 * A component which creates a div containing a form with inputs for the title, description, and other metadata about a
 * new MergeRequest. The div also contains {@link shared.CommitDifferenceTabsetComponent} to display the changes and
 * commits between the previously selected source and target branch of the Merge Request.
 */
@Component({
    selector: 'request-details-form',
    templateUrl: './requestDetailsForm.component.html',
    styleUrls: ['./requestDetailsForm.component.scss']
})
export class RequestDetailsFormComponent implements OnInit, OnDestroy {
    recordTitle = '';
    sourceCommitId = '';
    targetCommitId = '';
    branchTitle = '';
    targetBranchTitle = '';
    detailsForm: UntypedFormGroup = this.fb.group({
        assignees: [''],
    });

    @ViewChild('assigneeInput') assigneeInput: ElementRef;

    constructor(public state: MergeRequestsStateService, public cm: CatalogManagerService, private fb: UntypedFormBuilder, 
        private toast: ToastService) {}

    ngOnInit(): void {
        this.state.clearDifference();
        this.recordTitle = getDctermsValue(this.state.selectedRecord, 'title');
        this.state.requestConfig.title = getDctermsValue(this.state.requestConfig.sourceBranch, 'title');
        this.cm.getRecordBranches(this.state.requestConfig.recordId, get(this.cm.localCatalog, '@id'))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.state.updateRequestConfigBranch('sourceBranch', response.body);
                this.state.updateRequestConfigBranch( 'targetBranch', response.body);
                if (this.state.requestConfig.sourceBranch && this.state.requestConfig.targetBranch) {
                    this.branchTitle = getDctermsValue(this.state.requestConfig.sourceBranch, 'title');
                    this.sourceCommitId = getPropertyId(this.state.requestConfig.sourceBranch, `${CATALOG}head`);
                    this.targetBranchTitle = getDctermsValue(this.state.requestConfig.targetBranch, 'title');
                    this.targetCommitId = getPropertyId(this.state.requestConfig.targetBranch, `${CATALOG}head`);
                    this.state.updateRequestConfigDifference()
                        .subscribe(() => {}, error => this.toast.createErrorToast(error));
                } else {
                    this.state.createRequestStep = 1;
                    this.state.difference = undefined;
                    this.toast.createErrorToast('Branch was deleted');
                }
            }, error => {
                this.toast.createErrorToast(error);
            });
    }
    ngOnDestroy(): void {
        this.state.clearDifference();
    }
    getEntityName(iri: string): string {
        return this.state.getEntityNameLabel(iri);
    }
}
