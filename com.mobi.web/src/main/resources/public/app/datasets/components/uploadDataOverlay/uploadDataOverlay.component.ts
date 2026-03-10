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
import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
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
  error?: RESTError = undefined;
  fileObj?: File = undefined;
  datasetTitle = '';
  uploadPhase: 'idle' | 'uploading' | 'processing' = 'idle';
  uploadProgress = 0;

  constructor(private dialogRef: MatDialogRef<UploadDataOverlayComponent>, public dm: DatasetManagerService,
    public state: DatasetStateService, private toast: ToastService) { }

  ngOnInit(): void {
    this.datasetTitle = getDctermsValue(this.state.selectedDataset.record, 'title');
  }
  /**
   * Submits the RDF file for upload to the selected dataset.
   *
   * This method initiates the file upload process using the `DatasetManagerService.uploadData` method.
   * It tracks upload progress via HttpEvents, showing a determinate progress bar during upload and
   * an indeterminate bar while the server processes the file.
   *
   * Flags:
   * - `uploadPhase`: Tracks the current phase of the upload ('idle', 'uploading', 'processing').
   * - `uploadProgress`: Tracks the upload progress percentage (0-100).
   */
  submit(): void {
    this.error = undefined;
    this.uploadPhase = 'uploading';
    this.uploadProgress = 0;
    this.dm.uploadData(this.state.selectedDataset.record['@id'], this.fileObj).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = event.total
            ? Math.round((100 * event.loaded) / event.total)
            : 0;
        } else if (event.type === HttpEventType.ResponseHeader) {
          this.uploadPhase = 'processing';
        } else if (event.type === HttpEventType.Response) {
          this.toast.createSuccessToast(`Data successfully uploaded to ${this.datasetTitle}`);
          this.dialogRef.close();
        }
      },
      error: (errorMessage) => {
        this._onError(errorMessage);
      }
    });
  }
  private _onError(errorMessage: RESTError): void {
    this.uploadPhase = 'idle';
    this.error = errorMessage;
  }
}
