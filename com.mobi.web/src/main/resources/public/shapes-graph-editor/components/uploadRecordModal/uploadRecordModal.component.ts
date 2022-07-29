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
import { Component, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder } from '@angular/forms';
import { get } from 'lodash';
import { first } from 'rxjs/operators';

import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';

/**
 * @class shapes-graph-editor.UploadRecordModalComponent
 * 
 * A component that creates content for a modal to update a ShapesGraphRecord.
 */
@Component({
    selector: 'upload-record-modal',
    templateUrl: './uploadRecordModal.component.html'
})
export class UploadRecordModalComponent {
    error: any = '';
    selectedFile: File;
    catalogId: string = get(this.cm.localCatalog, '@id', '');

    constructor(private dialogRef: MatDialogRef<UploadRecordModalComponent>, private fb: FormBuilder,
                private sm: ShapesGraphManagerService, private state: ShapesGraphStateService,
                @Inject('utilService') private util, private cm: CatalogManagerService,
                @Inject(MAT_DIALOG_DATA) public data: any) {}

    uploadChanges(): void {
        this.error = '';
        const updateParams: RdfUpdate = {
            recordId: this.state.listItem.versionedRdfRecord.recordId,
            file: this.selectedFile,
            replaceInProgressCommit: false
        };
        if (this.state?.listItem?.versionedRdfRecord?.branchId) {
            updateParams.branchId = this.state.listItem.versionedRdfRecord.branchId;
        }
        if (this.state?.listItem?.versionedRdfRecord?.commitId) {
            updateParams.commitId = this.state.listItem.versionedRdfRecord.commitId;
        }
        this.sm.uploadChanges(updateParams)
            .then((response) => {
                if (response.status === 204) {
                    this.util.createWarningToast('No changes were found in the uploaded file.');
                    return Promise.reject('No changes');
                }
                return this.cm.getInProgressCommit(this.state.listItem.versionedRdfRecord.recordId, this.catalogId).pipe(first()).toPromise();
            }, error => {
                return Promise.reject(error);
            }).then(commit => {
                this.state.listItem.inProgressCommit.additions = commit.additions;
                this.state.listItem.inProgressCommit.deletions = commit.deletions;
                return this.state.updateShapesGraphMetadata(this.state.listItem.versionedRdfRecord.recordId, this.state.listItem.versionedRdfRecord.branchId, this.state.listItem.versionedRdfRecord.commitId);
            })
            .then(() => {
                this.util.createSuccessToast('Record ' + this.state.listItem.versionedRdfRecord.recordId + ' successfully updated.');
                this.dialogRef.close(true);
            })
            .catch(error => {
                if (error !== 'No changes') {
                    this.error = error;
                }
            });
        }
}
