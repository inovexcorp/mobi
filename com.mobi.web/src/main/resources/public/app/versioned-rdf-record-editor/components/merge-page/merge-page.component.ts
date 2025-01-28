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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { find, get, reject } from 'lodash';
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { switchMap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { UserManagerService } from '../../../shared/services/userManager.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';
import { getDctermsValue, getPropertyId } from '../../../shared/utility';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../../shared/injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { Commit } from '../../../shared/models/commit.interface';

/**
 * @class versioned-rdf-record-editor.MergePageComponent
 *
 * A component that creates a page that displays all the current users's saved changes
 * (aka inProgressCommit) of the current VersionedRDFRecord. The changes are grouped by
 * subject. The display will include a button to remove all the saved changes if there are any. If there are
 * no changes, an {@link shared.InfoMessageComponent} is shown stating as such. If the current branch is
 * not up to date and there are changes, an {@link shared.ErrorDisplayComponent} is shown. If there are
 * no changes and the current branch is not up to date, an `errorDisplay` is shown with a link to pull in the
 * latest changes. If there are no changes and the user is on a UserBranch then an `errorDisplay` is shown with
 * a link to "pull changes" which will perform a merge of the UserBranch into the parent branch. If there are
 * no changes, the user is on a UserBranch, and the parent branch no longer exists, an `errorDisplay` is shown
 * with a link to restore the parent branch with the UserBranch.
 */
@Component({
  selector: 'app-merge-page',
  templateUrl: './merge-page.component.html',
  styleUrls: ['./merge-page.component.scss']
})
export class MergePageComponent<TData extends VersionedRdfListItem> implements OnInit, OnDestroy {

  constructor(private _cm: CatalogManagerService,
        private _toast: ToastService,
        @Inject(stateServiceToken) public state: VersionedRdfState<TData>,
        public um: UserManagerService,
        private _lm: LoginManagerService,
        private _pep: PolicyEnforcementService) {}

  catalogId = '';
  error = '';
  commits = [];
  conflictError = '';
  branches: JSONLDObject[] = [];
  branch: JSONLDObject;
  branchTitle = '';
  targetHeadCommitId = undefined;
  isSubmitDisabled = false;
  permissionMessage = 'You do not have permission to perform this merge';
  private isAdminUser: boolean;
  
  ngOnInit(): void {
    this.catalogId = get(this._cm.localCatalog, '@id', '');
    this._cm.getRecordBranches(this.state.listItem.versionedRdfRecord.recordId, this.catalogId)
      .subscribe((response: HttpResponse<JSONLDObject[]>) => {
        this.branches = reject(response.body, {'@id': this.state.listItem.versionedRdfRecord.branchId});
        this.branch = find(response.body, {'@id': this.state.listItem.versionedRdfRecord.branchId});
        this.branchTitle = getDctermsValue(this.branch, 'title');
        this.state.listItem.merge.difference = undefined;
        this.state.listItem.merge.startIndex = 0;
        this.state.listItem.merge.target = undefined;
      }, error => this._toast.createErrorToast(error));
  }
  ngOnDestroy(): void {
    if (this.state.listItem && this.state.listItem.merge) {
      this.state.listItem.merge.difference = undefined;
      this.state.listItem.merge.startIndex = 0;
    }
  }
  getEntityName(entityIRI: string): string {
    return this.state.getEntityName(entityIRI);
  }
  changeTarget(value: JSONLDObject): void {
    this.state.listItem.merge.difference = undefined;
    this.state.listItem.merge.startIndex = 0;
    this.state.listItem.merge.target = value;
    if (this.state.listItem.merge.target) {
      this._cm.getRecordBranch(this.state.listItem.merge.target['@id'], this.state.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(
        switchMap((target: JSONLDObject) => {
          this.targetHeadCommitId = getPropertyId(target, `${CATALOG}head`);
          return this.state.getMergeDifferences(this.state.listItem.versionedRdfRecord.commitId, this.targetHeadCommitId, this._cm.differencePageSize, 0);
        }))
        .subscribe(() => {}, errorMessage => {
          this._toast.createErrorToast(errorMessage);
          this.state.listItem.merge.difference = undefined;
        });

      this.isAdminUser = this.um.isAdminUser(this._lm.currentUserIRI);
      if (!this.isAdminUser) {
        const managePermissionRequest = {
          resourceId: this.state.listItem.versionedRdfRecord.recordId,
          actionId: `${CATALOG}Modify`,
          actionAttrs: {
            [`${CATALOG}branch`]: this.state.listItem.merge.target['@id']
          }
        };

        this._pep.evaluateRequest(managePermissionRequest).subscribe(decision => {
          this.isSubmitDisabled = decision === this._pep.deny;
          if (this.isSubmitDisabled) {
            this.error = this.permissionMessage;
          }
        }, () => {
          this.isSubmitDisabled = false;
        });
      }
    } else {
      this.state.listItem.merge.difference = undefined;
    }
  }
  retrieveMoreResults(event: {limit: number, offset: number}): void {
    this.state.getMergeDifferences(this.state.listItem.versionedRdfRecord.commitId, this.targetHeadCommitId, event.limit, event.offset)
      .subscribe(() => {}, error => this._toast.createErrorToast(error));
  }
  submit(): void {
    this.state.attemptMerge()
      .subscribe(() => {
        this._toast.createSuccessToast('Your merge was successful.');
        this.state.cancelMerge();
      }, error => this.error = error);
  }
  submitConflictMerge(): void {
    this.state.merge()
      .subscribe(() => {
        this._toast.createSuccessToast('Your merge was successful with resolutions.');
        this.state.cancelMerge();
      }, error => this.conflictError = error);
  }
  cancelMerge(): void {
    this.state.cancelMerge();
  }
  receiveCommits(value: Commit[]): void {
    this.commits = value;
  }
}
