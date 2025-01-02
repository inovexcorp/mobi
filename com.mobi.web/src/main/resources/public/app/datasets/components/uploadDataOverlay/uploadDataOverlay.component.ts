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
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { getDctermsValue } from '../../../shared/utility';
/**
 * @class datasets.UploadDataOverlayComponent
 *
 * A component that creates content for a modal with a form to select an RDF file to import into the
 * {@link shared.DatasetStateService selected dataset}. Meant to be used in conjunction with the `MatDialog` service.
 */
@Component({
    selector: 'upload-data-overlay',
    templateUrl: './uploadDataOverlay.component.html',
    styleUrls: ['./uploadDataOverlay.component.scss']
})
export class UploadDataOverlayComponent implements OnInit {
    error = '';
    fileObj: File = undefined;
    datasetTitle = '';
    importing = false;

    constructor(private dialogRef: MatDialogRef<UploadDataOverlayComponent>, public dm: DatasetManagerService,
        public state: DatasetStateService, private toast: ToastService) {}
    
    ngOnInit(): void {
        this.datasetTitle = getDctermsValue(this.state.selectedDataset.record, 'title');
    }
    /**
     * Submits the RDF file for upload to the selected dataset.
     * 
     * This method initiates the file upload process using the `DatasetManagerService.uploadData` method. 
     * It provides user feedback during the process and ensures the dialog closes appropriately once the 
     * operation completes.
     * 
     * Flags:
     * - `isDialogClosed`: Prevents the dialog from being closed multiple times.
     * - `requestErrorFlag`: Tracks whether an error occurred during the upload.
     */
    submit(): void {
        this.importing = true;
        let isDialogClosed = false;
        let requestErrorFlag = false;
        this.dm.uploadData(this.state.selectedDataset.record['@id'], this.fileObj, true).subscribe({
            next: () => {
                this.importing = false;
                this.toast.createSuccessToast(`Data successfully uploaded to ${this.datasetTitle}`);
                this.dialogRef.close();
                isDialogClosed = true;
            }, 
            error: (errorMessage) => {
                this._onError(errorMessage);
                requestErrorFlag = true;
            },
            complete: () => {
                if (!isDialogClosed && !requestErrorFlag) {
                    this.dialogRef.close();
                    isDialogClosed = true;
                }
            }
        });
    }
    private _onError(errorMessage: string): void {
        this.importing = false;
        this.error = errorMessage;
    }
}
