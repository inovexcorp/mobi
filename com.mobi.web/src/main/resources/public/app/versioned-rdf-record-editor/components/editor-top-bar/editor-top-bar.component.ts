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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { Component, Inject, OnDestroy, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { get } from 'lodash';
import { switchMap } from 'rxjs/operators';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { stateServiceToken } from '../../../shared/injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { CreateBranchModalComponent } from '../create-branch-modal/create-branch-modal.component';
import { CreateTagModalComponent } from '../create-tag-modal/create-tag-modal.component';
import { DownloadRecordModalComponent } from '../download-record-modal/download-record-modal.component';
import { UploadChangesModalComponent } from '../upload-changes-modal/upload-changes-modal.component';
import { CommitModalComponent } from '../commit-modal/commit-modal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';

/**
 * @class versioned-rdf-record-editor.EditorTopBarComponent
 *
 * `editor-top-bar` is a component that provides the top navigation bar for editing VersionedRDFRecords.
 */
@Component({
  selector: 'app-editor-top-bar',
  templateUrl: './editor-top-bar.component.html',
  styleUrls: ['./editor-top-bar.component.scss']
})
export class EditorTopBarComponent<TData extends VersionedRdfListItem> implements OnDestroy {
  branches: JSONLDObject[] = [];

  constructor(@Inject(stateServiceToken) public state: VersionedRdfState<TData>, private _dialog: MatDialog, 
   private _cm: CatalogManagerService, private _toast: ToastService, private _viewContainerRef: ViewContainerRef) {}
  
  ngOnDestroy(): void {
    this.state.uploadList.forEach(item => item.sub.unsubscribe());
    this.state.uploadList = [];
    this.state.uploadPending = 0;
  }
  createBranch(): void {
    this._dialog.open(CreateBranchModalComponent, { viewContainerRef: this._viewContainerRef });
  }
  createTag(): void {
    this._dialog.open(CreateTagModalComponent, { viewContainerRef: this._viewContainerRef });
  }
  download(): void {
    this._dialog.open(DownloadRecordModalComponent, {
      viewContainerRef: this._viewContainerRef,
      data: {
        recordId: this.state.listItem.versionedRdfRecord.recordId,
        branchId: this.state.listItem.versionedRdfRecord.branchId,
        commitId: this.state.listItem.versionedRdfRecord.commitId,
        title: this.state.listItem.versionedRdfRecord.title
      }
    });
  }
  upload(): void {
    this._dialog.open(UploadChangesModalComponent, { viewContainerRef: this._viewContainerRef });
  }
  commit(): void {
    this._dialog.open(CommitModalComponent, { viewContainerRef: this._viewContainerRef });
  }
  toggleChanges(): void {
    this.state.listItem.changesPageOpen = !this.state.listItem.changesPageOpen;
  }
  update(): void {
    this._cm.getBranchCommit('head', this.state.listItem.versionedRdfRecord.branchId, 
    this.state.listItem.versionedRdfRecord.recordId, 
    get(this._cm.localCatalog, '@id', '')).pipe(
      switchMap(headCommit => {
        const commitId = get(headCommit, 'commit[\'@id\']', '');
        return this.state.changeVersion(this.state.listItem.versionedRdfRecord.recordId, 
          this.state.listItem.versionedRdfRecord.branchId, 
          commitId,
          undefined, 
          this.state.listItem.versionedRdfRecord.title, true, false, false);
      })
    ).subscribe(
      () => this._toast.createSuccessToast(`${splitIRI(this.state.type).end} branch has been updated.`), 
      error => this._toast.createErrorToast(error)
    );
  }
  updateBranches(branches: JSONLDObject[]): void {
    this.branches = branches;
  }
  getCreateBranchTooltip(): string {
    if (!this.state?.listItem?.versionedRdfRecord?.commitId) {
      return 'Select a record to create a branch';
    } else if (!this.state?.listItem.userCanModify) {
      return 'You do not have permission to create a branch';
    } else {
      return 'Create Branch';
    }
  }
  getMergeTooltip(): string {
    if (!this.state?.listItem) {
      return 'Select a record to merge branches';
    } else if (!this.state?.listItem?.versionedRdfRecord?.branchId) {
      return 'Cannot merge when a branch is not checked out';
    } else if (this.state.isCommittable()) {
      return 'Cannot merge branches with uncommitted changes';
    } else if (!this.state?.canModify()) {
      return 'You do not have permission to merge branches';
    } else if (this.branches.length < 2) {
      return 'Not enough branches to perform a merge';
    } else {
      return 'Merge Branch';
    }
  }
  getCreateTagTooltip(): string {
    if (!this.state?.listItem?.versionedRdfRecord?.recordId) {
      return 'Select a record to create tags';
    } else if (this.state.isCommittable()) {
      return 'Cannot create tags with uncommitted changes';
    } else if (!this.state?.listItem.userCanModify) {
      return 'You do not have permission to create tags';
    } else {
      return 'Create Tag';
    }
  }
  getUploadChangesTooltip(): string {
    if (!this.state?.listItem?.versionedRdfRecord?.recordId) {
      return 'Select a record to upload changes';
    } else if (!this.state?.listItem?.versionedRdfRecord?.branchId) {
      return 'Cannot upload changes if a branch is not checked out';
    } else if (this.state.isCommittable()) {
      return 'Cannot upload changes with uncommitted changes';
    } else if (!this.state?.canModify()) {
      return 'You do not have permission to upload changes';
    } else {
      return 'Upload Changes';
    }
  }
  getCommitTooltip(): string {
    if (!this.state.isCommittable()) {
      return 'No changes to commit';
    } else if (!this.state?.canModify()) {
      return 'You do not have permission to commit';
    } else {
      return '';
    }
  }
}
