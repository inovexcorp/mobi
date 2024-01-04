/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { get, reject, find } from 'lodash';
import { flatMap } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { throwError } from 'rxjs';
import { UntypedFormBuilder } from '@angular/forms';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { OntologyStateService } from '../../../shared/services/ontologyState.service';
import { CATALOG } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { Commit } from '../../../shared/models/commit.interface';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import {UserManagerService} from '../../../shared/services/userManager.service';
import {LoginManagerService} from '../../../shared/services/loginManager.service';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';

/**
 * @class ontology-editor.MergeBlockComponent
 *
 * `mergeBlock` is a component that creates a form for merging the current branch of the opened
 * {@link shared.OntologyStateService#listItem ontology} into another branch. The form contains a
 * {@link shared.BranchSelectComponent} for the target branch, a {@link shared.CheckboxComponent} for indicating
 * whether the source branch should be removed after the merge, a button to submit the merge, and a button to cancel
 * the merge. Once a target is selected, a {@link shared.CommitDifferenceTabsetComponent} is displayed. The form
 * calls the appropriate methods to check for conflicts before performing the merge. 
 */
@Component({
    selector: 'merge-block',
    templateUrl: './mergeBlock.component.html',
    styleUrls: ['./mergeBlock.component.scss']
})
export class MergeBlockComponent implements OnInit, OnDestroy {

    constructor(public os: OntologyStateService,
                public cm: CatalogManagerService,
                private toast: ToastService,
                private pep: PolicyEnforcementService,
                public um: UserManagerService,
                private lm: LoginManagerService,
                private fb: UntypedFormBuilder) {}

    catalogId = '';
    error = '';
    branches = [];
    branchTitle = '';
    targetHeadCommitId = undefined;   
    commits = [];
    mergeRequestForm = this.fb.group({});
    isSubmitDisabled: boolean;
    permissionMessage = 'You do not have permission to perform this merge';

    private isAdminUser: boolean;

    ngOnInit(): void {
        this.catalogId = get(this.cm.localCatalog, '@id', '');
        this.branches = reject(this.os.listItem.branches, {'@id': this.os.listItem.versionedRdfRecord.branchId});
        const branch = find(this.os.listItem.branches, {'@id': this.os.listItem.versionedRdfRecord.branchId});
        this.branchTitle = getDctermsValue(branch, 'title');
        this.changeTarget(undefined);
    }
    ngOnDestroy(): void {
        if (this.os.listItem?.merge) {
            this.os.listItem.merge.difference = undefined;
            this.os.listItem.merge.startIndex = 0;
        }
    }
    getEntityName(entityIRI: string): string {
        if (this.os && Object.prototype.hasOwnProperty.call(this.os,'listItem')) {
            return this.os.getEntityNameByListItem(entityIRI, this.os.listItem);
        } else {
            return this.os.getEntityNameByListItem(entityIRI);
        }

    }
    changeTarget(value: JSONLDObject): void {

        this.os.listItem.merge.difference = undefined;
        this.os.listItem.merge.startIndex = 0;
        this.os.listItem.merge.target = value;

        if (this.os.listItem.merge.target) {

            this.isAdminUser = this.um.isAdminUser(this.lm.currentUserIRI);
            if (!this.isAdminUser) {
                const managePermissionRequest = {
                    resourceId: this.os.listItem.versionedRdfRecord.recordId,
                    actionId: `${CATALOG}Modify`,
                    actionAttrs: {
                        [`${CATALOG}branch`]: this.os.listItem.merge.target['@id']
                    }
                };

                this.pep.evaluateRequest(managePermissionRequest).subscribe(decision => {
                    this.isSubmitDisabled = decision === this.pep.deny;
                    if (this.isSubmitDisabled) {
                        this.error = this.permissionMessage;
                    }
                }, () => {
                    this.isSubmitDisabled = false;
                });
            }

            this.cm.getRecordBranch(this.os.listItem.merge.target['@id'], this.os.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(
                flatMap(target => {
                    this.targetHeadCommitId = getPropertyId(target, `${CATALOG}head`);
                    return this.os.getMergeDifferences(this.os.listItem.versionedRdfRecord.commitId, this.targetHeadCommitId, this.cm.differencePageSize, 0);
                })
            ).subscribe(() => {}, errorMessage => {
                this.toast.createErrorToast(errorMessage);
                this.os.listItem.merge.difference = undefined;
                return throwError(errorMessage);
            });
        } else {
            this.os.listItem.merge.difference = undefined;
        }
    }
    retrieveMoreResults(event: {limit: number, offset: number}): void {
        this.os.getMergeDifferences(this.os.listItem.versionedRdfRecord.commitId, this.targetHeadCommitId, event.limit, event.offset)
          .subscribe(() => {}, error => this.toast.createErrorToast(error));
    }
    submit(): void {
        this.os.attemptMerge()
            .subscribe(() => {
                this.os.resetStateTabs();
                this.toast.createSuccessToast('Your merge was successful.');
                this.os.cancelMerge();
            }, error => this.error = error);
    }
    receiveCommits(value: Commit[]): void {
        this.commits = value;
    }

}
