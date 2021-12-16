/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';


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
                private sm: ShapesGraphManagerService, private state: ShapesGraphStateService, @Inject('utilService') private util, @Inject('catalogManagerService') private cm, @Inject(MAT_DIALOG_DATA) public data: any) {}

    uploadChanges(): void {
        this.error = '';
        const updateParams: RdfUpdate = {
            recordId: this.state.currentShapesGraphRecordIri,
            file: this.selectedFile,
            replaceInProgressCommit: false
        };
        if (this.state.currentShapesGraphBranchIri) {
            updateParams.branchId = this.state.currentShapesGraphBranchIri;
        }
        if (this.state.currentShapesGraphCommitIri) {
            updateParams.commitId = this.state.currentShapesGraphCommitIri;
        }
        this.sm.uploadChanges(updateParams)
            .then((response) => {
                if (response.status === 204) {
                    this.util.createWarningToast('No changes were found in the uploaded file.');
                    return Promise.reject('No changes');
                }
                return this.cm.getInProgressCommit(this.state.currentShapesGraphRecordIri, this.catalogId);
            }, error => {
                return Promise.reject(error);
            }).then(commit => {
                this.state.inProgressCommit = commit;
                this.util.createSuccessToast('Record ' + this.state.currentShapesGraphRecordIri + ' successfully updated.');
                this.dialogRef.close(true);
        }, error => {
            if (error !== 'No changes') {
                this.error = error;
            }
        });
    }
}
