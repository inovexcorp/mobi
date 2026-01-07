/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { get } from 'lodash';

import { CATALOG } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { Commit } from '../../../shared/models/commit.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';

/**
 * @class merge-requests.RequestBranchSelectComponent
 *
 * A component which creates a div containing a form with selects to choose the source and target Branch for a new
 * MergeRequest. The Branch list is derived from the previously selected VersionedRDFRecord for the MergeRequest. The
 * div also contains a {@link shared.CommitDifferenceTabsetComponent} to display the changes and commits between the
 * selected branches.
 */
@Component({
    selector: 'request-branch-select',
    templateUrl: './requestBranchSelect.component.html',
    styleUrls: ['./requestBranchSelect.component.scss']
})
export class RequestBranchSelectComponent implements OnInit, OnDestroy {
    branches: JSONLDObject[] = [];
    sourceCommitId = '';
    targetCommitId = '';
    sourceBranchTitle = '';
    recordTitle = '';
    type = ''
    commits: Commit[] = [];
    @Output() emitCommits = new EventEmitter<{commits: Commit[]}>();

    @ViewChild('commitDifferenceTabset', { static: true }) commitDifferenceTabset: ElementRef;

    constructor(public mrState: MergeRequestsStateService, public cm: CatalogManagerService,
        private spinnerSvc: ProgressSpinnerService, private toast: ToastService) {}

    ngOnInit(): void {
        this.type = this.cm.getType(this.mrState.selectedRecord);
        this.recordTitle = getDctermsValue(this.mrState.selectedRecord, 'title');
        this.mrState.clearDifference();
        this.mrState.sameBranch = false;
        this.cm.getRecordBranches(this.mrState.requestConfig.recordId, get(this.cm.localCatalog, '@id'))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.branches = response.body;
                this.mrState.updateRequestConfigBranch('sourceBranch', this.branches);
                this.mrState.updateRequestConfigBranch( 'targetBranch', this.branches);
                if (this.mrState.requestConfig.sourceBranch && this.mrState.requestConfig.targetBranch) {
                    this.mrState.sameBranch = this.mrState.requestConfig.sourceBranch['@id'] === this.mrState.requestConfig.targetBranch['@id'];
                    this.sourceBranchTitle = getDctermsValue(this.mrState.requestConfig.sourceBranch, 'title');
                    this.sourceCommitId = getPropertyId(this.mrState.requestConfig.sourceBranch, `${CATALOG}head`);
                    this.targetCommitId = getPropertyId(this.mrState.requestConfig.targetBranch, `${CATALOG}head`);
                    this._updateDifference(true);
                }
            }, error => {
                this.toast.createErrorToast(error);
                this.branches = [];
            });
    }
    ngOnDestroy(): void {
        this.mrState.clearDifference();
        this.mrState.sameBranch = false;
    }
    getEntityName(iri: string): string {
        return this.mrState.getEntityNameLabel(iri);
    }
    changeSourceBranch(value: JSONLDObject): void {
        this.mrState.requestConfig.sourceBranch = value;
        this.mrState.sameBranch = false;
        this.mrState.clearDifference();
        if (this.mrState.requestConfig.sourceBranch) {
            this.sourceBranchTitle = getDctermsValue(this.mrState.requestConfig.sourceBranch, 'title');
            this.sourceCommitId = getPropertyId(this.mrState.requestConfig.sourceBranch, `${CATALOG}head`);
            this.mrState.requestConfig.sourceBranchId = this.mrState.requestConfig.sourceBranch['@id'];
            if (this.mrState.requestConfig.targetBranch) {
                this.mrState.sameBranch = this.mrState.requestConfig.sourceBranch['@id'] === this.mrState.requestConfig.targetBranch['@id'];
                this._updateDifference(false);
            }
        } else {
            this.sourceBranchTitle = '';
            this.sourceCommitId = '';
        }
    }
    changeTargetBranch(value: JSONLDObject): void {
        this.mrState.requestConfig.targetBranch = value;
        this.mrState.sameBranch = false;
        this.mrState.clearDifference();
        if (this.mrState.requestConfig.targetBranch) {
            this.targetCommitId = getPropertyId(this.mrState.requestConfig.targetBranch, `${CATALOG}head`);
            this.mrState.requestConfig.targetBranchId = this.mrState.requestConfig.targetBranch['@id'];
            if (this.mrState.requestConfig.sourceBranch) {
                this.mrState.sameBranch = this.mrState.requestConfig.sourceBranch['@id'] === this.mrState.requestConfig.targetBranch['@id'];
                this._updateDifference(false);
            }
        } else {
            this.targetCommitId = '';
        }
    }
    receiveCommits(commits: Commit[]):void {
        this.commits = commits;
        this.emitCommits.emit({commits: this.commits});
    }

    /**
     * Update Difference State in {@link MergeRequestsStateService}
     * @param clearBranches Clear Branches
     */
    private _updateDifference(clearBranches: boolean): void {
        this.spinnerSvc.startLoadingForComponent(this.commitDifferenceTabset);
        this.mrState.updateRequestConfigDifference().subscribe(() => {
            this.spinnerSvc.finishLoadingForComponent(this.commitDifferenceTabset);
        }, error => {
            this.toast.createErrorToast(error);
            if (clearBranches) {
                this.branches = [];
            }
            this.spinnerSvc.finishLoadingForComponent(this.commitDifferenceTabset);
        });
    }
}
