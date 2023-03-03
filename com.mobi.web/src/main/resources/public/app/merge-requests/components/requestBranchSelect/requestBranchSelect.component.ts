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
import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { get } from 'lodash';

import { CATALOG } from '../../../prefixes';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { Commit } from '../../../shared/models/commit.interface';
import { UtilService } from '../../../shared/services/util.service';


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
    @Input() updateCommits:any;
    branches: JSONLDObject[] = [];
    sourceCommitId = '';
    targetCommitId = '';
    branchTitle = '';
    recordTitle = '';
    commits = [];
    @Output() emitCommits = new EventEmitter<{commits: Commit[]}>();

    @ViewChild('commitDifferenceTabset', { static: true }) commitDifferenceTabset: ElementRef;

    constructor(public state: MergeRequestsStateService, public cm: CatalogManagerService,
        private spinnerSvc: ProgressSpinnerService, public util: UtilService) {}

    ngOnInit(): void {
        this.recordTitle = this.util.getDctermsValue(this.state.selectedRecord, 'title');
        this.state.clearDifference();
        this.state.sameBranch = false;
        this.cm.getRecordBranches(this.state.requestConfig.recordId, get(this.cm.localCatalog, '@id'))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.branches = response.body;
                this.state.updateRequestConfigBranch('sourceBranch', this.branches);
                this.state.updateRequestConfigBranch( 'targetBranch', this.branches);
                if (this.state.requestConfig.sourceBranch && this.state.requestConfig.targetBranch) {
                    this.state.sameBranch = this.state.requestConfig.sourceBranch['@id'] === this.state.requestConfig.targetBranch['@id'];
                    this.branchTitle = this.util.getDctermsValue(this.state.requestConfig.sourceBranch, 'title');
                    this.sourceCommitId = this.util.getPropertyId(this.state.requestConfig.sourceBranch, CATALOG + 'head');
                    this.targetCommitId = this.util.getPropertyId(this.state.requestConfig.targetBranch, CATALOG + 'head');
                    this._updateDifference(true);
                }
            }, error => {
                this.util.createErrorToast(error);
                this.branches = [];
            });
    }
    ngOnDestroy(): void {
        this.state.clearDifference();
        this.state.sameBranch = false;
    }
    getEntityName(iri: string): string {
        return this.state.getEntityNameLabel(iri);
    }
    changeSource(value: JSONLDObject): void {
        this.state.requestConfig.sourceBranch = value;
        this.state.sameBranch = false;
        this.state.clearDifference();
        if (this.state.requestConfig.sourceBranch) {
            this.branchTitle = this.util.getDctermsValue(this.state.requestConfig.sourceBranch, 'title');
            this.sourceCommitId = this.util.getPropertyId(this.state.requestConfig.sourceBranch, CATALOG + 'head');
            this.state.requestConfig.sourceBranchId = this.state.requestConfig.sourceBranch['@id'];
            if (this.state.requestConfig.targetBranch) {
                this.state.sameBranch = this.state.requestConfig.sourceBranch['@id'] === this.state.requestConfig.targetBranch['@id'];
                this._updateDifference(false);
            }
        } else {
            this.branchTitle = '';
            this.sourceCommitId = '';
        }
    }
    changeTarget(value: JSONLDObject): void {
        this.state.requestConfig.targetBranch = value;
        this.state.sameBranch = false;
        this.state.clearDifference();
        if (this.state.requestConfig.targetBranch) {
            this.targetCommitId = this.util.getPropertyId(this.state.requestConfig.targetBranch, CATALOG + 'head');
            this.state.requestConfig.targetBranchId = this.state.requestConfig.targetBranch['@id'];
            if (this.state.requestConfig.sourceBranch) {
                this.state.sameBranch = this.state.requestConfig.sourceBranch['@id'] === this.state.requestConfig.targetBranch['@id'];
                this._updateDifference(false);
            }
        } else {
            this.targetCommitId = '';
        }
    }

    receiveCommits(value):void {
        this.commits = value;
        this.emitCommits.emit({commits: this.commits});
    }
    
    private _updateDifference(clearBranches: boolean): void {
        this.spinnerSvc.startLoadingForComponent(this.commitDifferenceTabset);
        this.state.updateRequestConfigDifference().subscribe(() => {
            this.spinnerSvc.finishLoadingForComponent(this.commitDifferenceTabset);
        }, error => {
            this.util.createErrorToast(error);
            if (clearBranches) {
                this.branches = [];
            }
            this.spinnerSvc.finishLoadingForComponent(this.commitDifferenceTabset);
        });
    }
}
