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
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpResponse } from '@angular/common/http';

import { RESTError } from '../../../shared/models/RESTError.interface';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';

/**
 * @class workflows.WorkflowUploadChangesModalComponent
 * 
 * A component that creates content for a modal to upload changes to the Workflow Record represented by the provided
 * record IRI, branch IRI, and commit IRI. The form in the modal contains a {@link shared.FileInputComponent} for the
 * changes file. If the uploaded workflow is not valid, a {@link workflows.ShaclValidationReportComponent} is shown.
 * 
 * @param {string} recordId The IRI of the Workflow Record receiving the uploaded changes
 * @param {string} branchId The IRI of the Branch receiving the uploaded changes
 * @param {string} commitId The IRI of the Commit receiving the uploaded changes
 */
@Component({
  selector: 'app-workflow-upload-changes-modal',
  templateUrl: './workflow-upload-changes-modal.component.html'
})
export class WorkflowUploadChangesModalComponent {
  error: RESTError;
  file = undefined;

  constructor(
    private _dialogRef: MatDialogRef<WorkflowUploadChangesModalComponent>, 
    private _wms: WorkflowsManagerService,
    @Inject(MAT_DIALOG_DATA) public data: { recordId: string, branchId: string, commitId: string }) {
  }

  /**
   * Submits the changes by committing them using WorkflowsRest.
   * Uploads changes to the specified record, branch, and commit ID, replacing the new head commit with this commit
   * Closes the dialog on successful upload or sets the error message on upload failure.
   */
  submit(): void {
    let isDialogClosed = false;
    let requestErrorFlag = false;
    this._wms.uploadChanges(this.data.recordId, this.data.branchId, this.data.commitId, this.file)
      .subscribe({
        next: (response: HttpResponse<string>) => {
          this._dialogRef.close(response);
          isDialogClosed = true;
        },
        error: (errorObj) => {
          requestErrorFlag = true;
          this._onError(errorObj);
        },
        complete: () => {
          if (!isDialogClosed && !requestErrorFlag) {
            this._dialogRef.close();
            isDialogClosed = true;
          }
        }
      }
    );
  }
  private _onError(errorObj: string|RESTError): void {
    if (typeof errorObj === 'string') {
      this.error = {
        error: '',
        errorDetails: [],
        errorMessage: errorObj
      };
    } else {
      this.error = errorObj;
    }
  }
}
