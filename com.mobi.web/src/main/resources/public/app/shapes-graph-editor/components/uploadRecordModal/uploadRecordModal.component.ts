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
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { get } from 'lodash';
import { switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { RdfUpdate } from '../../../shared/models/rdfUpdate.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { Difference } from '../../../shared/models/difference.class';

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
    error: RESTError = {
        error: '',
        errorDetails: [],
        errorMessage: ''
    };
    selectedFile: File;
    catalogId: string = get(this.cm.localCatalog, '@id', '');

    constructor(private dialogRef: MatDialogRef<UploadRecordModalComponent>, private sm: ShapesGraphManagerService,
        private state: ShapesGraphStateService, private toast: ToastService, private cm: CatalogManagerService) {}

    uploadChanges(): void {
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
        this.sm.uploadChanges(updateParams).pipe(
            switchMap((response) => {
                if (response.status === 204) {
                    return throwError('No changes');
                }
                return this.cm.getInProgressCommit(this.state.listItem.versionedRdfRecord.recordId, this.catalogId);
            }),
            switchMap((inProgressCommit: Difference) => {
                this.state.listItem.inProgressCommit.additions = inProgressCommit.additions;
                this.state.listItem.inProgressCommit.deletions = inProgressCommit.deletions;
                return this.state.updateShapesGraphMetadata(this.state.listItem.versionedRdfRecord.recordId,
                    this.state.listItem.versionedRdfRecord.branchId, this.state.listItem.versionedRdfRecord.commitId);
            })
        ).subscribe(() => {
            this.toast.createSuccessToast(`Record ${this.state.listItem.versionedRdfRecord.recordId} successfully updated.`);
            this.dialogRef.close(true);
        }, error => {
            if (typeof error === 'string') {
                this.error = {
                    error: '',
                    errorDetails: [],
                    errorMessage: error
                };
            } else {
                this.error = error;
            }
        });
    }
}
