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
import { get } from 'lodash';
import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { switchMap, tap } from 'rxjs/operators';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../../shared/injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { VersionedRdfStateBase } from '../../../shared/models/versionedRdfStateBase.interface';

interface BranchConfig {
    title: string,
    description?: string
}

/**
 * @class versioned-rdf-record-editor.CreateBranchModal
 * 
 * A component that creates content for a modal to create a branch for the VersionedRDFRecord. The form in the modal
 * contains an input and textarea for the title and description of the branch.
 */
@Component({
    selector: 'app-create-branch-modal',
    templateUrl: './create-branch-modal.component.html'
})
export class CreateBranchModalComponent<TData extends VersionedRdfListItem> {
    catalogId: string = get(this._cm.localCatalog, '@id', '');

    createBranchForm = this._fb.group({
        title: ['', [Validators.required, Validators.maxLength(150)]],
        description: ['']
    });

    constructor(@Inject(stateServiceToken) private _state: VersionedRdfState<TData>, private _toast: ToastService, 
        private _cm: CatalogManagerService, private _fb: UntypedFormBuilder, 
        private _dialogRef: MatDialogRef<CreateBranchModalComponent<TData>>) {}

    createBranch(): void {
        const branchConfig: BranchConfig = {
            title: this.createBranchForm.controls.title.value,
            description: this.createBranchForm.controls.description.value
        };
        let branchId;
        this._cm.createRecordBranch(this._state.listItem.versionedRdfRecord.recordId, this.catalogId, branchConfig,
          this._state.listItem.versionedRdfRecord.commitId).pipe(
              switchMap(response => {
                  branchId = response;
                  const state: VersionedRdfStateBase = {
                      recordId: this._state.listItem.versionedRdfRecord.recordId,
                      branchId: branchId,
                      commitId: this._state.listItem.versionedRdfRecord.commitId,
                      tagId: undefined
                  };
                  return this._state.updateState(state);
              }),
              tap(() => {
                  this._state.listItem.versionedRdfRecord.branchId = branchId;
                  this._state.listItem.versionedRdfRecord.tagId = undefined;
                  this._state.listItem.currentVersionTitle = this.createBranchForm.controls.title.value;
                  this._state.listItem.upToDate = true;
              })
          ).subscribe(() => this._dialogRef.close(true), error => {
              this._dialogRef.close(false);
              this._toast.createErrorToast(error);
          });
    }
}
