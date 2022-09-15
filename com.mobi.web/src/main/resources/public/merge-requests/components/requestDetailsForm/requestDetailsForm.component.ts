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

import { HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { get } from 'lodash';

import { CATALOG } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { MergeRequestsStateService } from '../../../shared/services/mergeRequestsState.service';
import { UtilService } from '../../../shared/services/util.service';

import './requestDetailsForm.component.scss';

/**
 * @class merge-requests.RequestDetailsFormComponent
 *
 * A component which creates a div containing a form with inputs for the title, description, and other metadata about a
 * new MergeRequest. The div also contains {@link shared.CommitDifferenceTabsetComponent} to display the changes and
 * commits between the previously selected source and target branch of the Merge Request.
 */
@Component({
    selector: 'request-details-form',
    templateUrl: './requestDetailsForm.component.html'
})
export class RequestDetailsFormComponent implements OnInit, OnDestroy {
    recordTitle = '';
    sourceCommitId = '';
    targetCommitId = '';
    branchTitle = '';
    targetBranchTitle = '';
    detailsForm: FormGroup = this.fb.group({
        assignees: [''],
    });

    @ViewChild('assigneeInput') assigneeInput: ElementRef;

    constructor(public state: MergeRequestsStateService, public cm: CatalogManagerService, private fb: FormBuilder, 
        public util: UtilService) {}

    ngOnInit(): void {
        this.state.clearDifference();
        this.recordTitle = this.util.getDctermsValue(this.state.selectedRecord, 'title');
        this.state.requestConfig.title = this.util.getDctermsValue(this.state.requestConfig.sourceBranch, 'title');
        this.cm.getRecordBranches(this.state.requestConfig.recordId, get(this.cm.localCatalog, '@id'))
            .subscribe((response: HttpResponse<JSONLDObject[]>) => {
                this.state.updateRequestConfigBranch('sourceBranch', response.body);
                this.state.updateRequestConfigBranch( 'targetBranch', response.body);
                if (this.state.requestConfig.sourceBranch && this.state.requestConfig.targetBranch) {
                    this.branchTitle = this.util.getDctermsValue(this.state.requestConfig.sourceBranch, 'title');
                    this.sourceCommitId = this.util.getPropertyId(this.state.requestConfig.sourceBranch, CATALOG + 'head');
                    this.targetBranchTitle = this.util.getDctermsValue(this.state.requestConfig.targetBranch, 'title');
                    this.targetCommitId = this.util.getPropertyId(this.state.requestConfig.targetBranch, CATALOG + 'head');
                    this.state.updateRequestConfigDifference()
                        .subscribe(() => {}, error => this.util.createErrorToast(error));
                } else {
                    this.state.createRequestStep = 1;
                    this.state.difference = undefined;
                    this.util.createErrorToast('Branch was deleted');
                }
            }, error => {
                this.util.createErrorToast(error);
            });
    }
    ngOnDestroy(): void {
        this.state.clearDifference();
    }
    getEntityName(iri: string): string {
        return this.state.getEntityNameLabel(iri);
    }
}