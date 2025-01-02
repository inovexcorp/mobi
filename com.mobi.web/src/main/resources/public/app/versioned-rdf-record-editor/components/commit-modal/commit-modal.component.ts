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
import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { get } from 'lodash';
import { switchMap } from 'rxjs/operators';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { CATALOG } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { getPropertyId } from '../../../shared/utility';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { RESTError } from '../../../shared/models/RESTError.interface';

/**
 * @class versioned-rdf-editor.CommitModalComponent
 * 
 * A component that creates content for a modal to commit the changes to the VersionedRDFRecord. The form in the modal
 * contains a `textarea for the commit message.
 */
@Component({
    selector: 'app-commit-modal',
    templateUrl: './commit-modal.component.html'
})
export class CommitModalComponent<TData extends VersionedRdfListItem> {

    errorMessage = '';
    catalogId: string = get(this._cm.localCatalog, '@id', '');

    createCommitForm = this._fb.group({
        comment: ['', Validators.required]
    });

    constructor(@Inject(stateServiceToken) private _state: VersionedRdfState<TData>, private _toast: ToastService, 
        private _cm: CatalogManagerService, private _fb: UntypedFormBuilder, 
        private _dialogRef: MatDialogRef<CommitModalComponent<TData>>) {}

    commit(): void {
        this._cm.getRecordBranch(this._state.listItem.versionedRdfRecord.branchId, this._state.listItem.versionedRdfRecord.recordId, this.catalogId)
            .subscribe(branch => {
                this._state.listItem.upToDate = getPropertyId(branch, `${CATALOG}head`) === this._state.listItem.versionedRdfRecord.commitId;
                if (this._state.listItem.upToDate) {
                    this.createCommit(this._state.listItem.versionedRdfRecord.branchId);
                } else {
                    // TODO: add user branch creation, no more listItem.branches
                    this.errorMessage = 'Cannot commit. Branch is behind HEAD. Please update.';
                    // const branch = find(this.os.listItem.branches, {'@id': this.os.listItem.versionedRdfRecord.branchId});
                    // const branchConfig: NewConfig = {title: getDctermsValue(branch, 'title')};
                    // const description = getDctermsValue(branch, 'description');
                    // if (description) {
                    //     branchConfig.description = description;
                    // }
                    // let branchId;
                    // this.cm.createRecordUserBranch(this.os.listItem.versionedRdfRecord.recordId, this.catalogId, branchConfig, this.os.listItem.versionedRdfRecord.commitId, this.os.listItem.versionedRdfRecord.branchId)
                    //     .pipe(switchMap((branchIri: string) => {
                    //         branchId = branchIri;
                    //         return this.cm.getRecordBranch(branchId, this.os.listItem.versionedRdfRecord.recordId, this.catalogId);
                    //     }))
                    //     .subscribe(branch => {
                    //         this.os.listItem.branches.push(branch);
                    //         this.os.listItem.versionedRdfRecord.branchId = branch['@id'];
                    //         this.os.listItem.upToDate = true;
                    //         this.os.listItem.userBranch = true;
                    //         this._createCommit(branch['@id']);
                    //     }, error => this._onError(error));
                }
            }, error => this._toast.createErrorToast(error));
    }
    createCommit(branchId: string): void {
        this._cm.createBranchCommit(branchId, this._state.listItem.versionedRdfRecord.recordId, this.catalogId,
            this.createCommitForm.controls.comment.value).pipe(
                switchMap(commitIri => this._state.changeVersion(this._state.listItem.versionedRdfRecord.recordId, 
                        this._state.listItem.versionedRdfRecord.branchId, commitIri, undefined, undefined, true, true,
                        this._state.listItem.changesPageOpen)
                )
            ).subscribe(() => {
                this._toast.createSuccessToast('Successfully Committed Changes');
                this._dialogRef.close(true);
            }, (error: RESTError|string) => {
                this.errorMessage = typeof error === 'string' ? error : error.errorMessage;
            });
    }
}
