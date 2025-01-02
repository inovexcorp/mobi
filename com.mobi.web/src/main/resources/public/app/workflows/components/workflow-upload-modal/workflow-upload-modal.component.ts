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
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { map as mapL, trim, uniq } from 'lodash';
import { catchError, map, switchMap } from 'rxjs/operators';
import { EMPTY, forkJoin } from 'rxjs';

import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowSchema } from '../../models/workflow-record.interface';
import { WorkflowRecordConfig } from '../../models/workflowRecordConfig.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';

@Component({
  selector: 'app-workflow-upload-modal',
  templateUrl: './workflow-upload-modal.component.html'})
export class WorkflowUploadModalComponent implements OnInit {
  file: File = undefined;
  error: string | RESTError;

  constructor(private _fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) private _data: { file: File },
    private _dialogRef: MatDialogRef<WorkflowUploadModalComponent>,
    public wms: WorkflowsManagerService) { }

  uploadWorkflowForm: UntypedFormGroup = this._fb.group({
    title: ['', [Validators.required]],
    description: [''],
    keywords: [[]],
  });

  ngOnInit(): void {
    this.uploadWorkflowForm.controls.title.setValue(this._data.file.name.replace(/\.[^/.]+$/, ''));
  }

  cancel(): void {
    this._data.file = undefined;
    this._dialogRef.close();
  }

  submit(): void {
    let isDialogClosed = false;
    let requestErrorFlag = false;
    const newWorkflowRecord: WorkflowRecordConfig = {
      title: this.uploadWorkflowForm.controls.title.value,
      description: this.uploadWorkflowForm.controls.description.value,
      keywords: uniq(mapL(this.uploadWorkflowForm.controls.keywords.value, trim)),
      file: this._data.file
    };
    this.wms.createWorkflowRecord(newWorkflowRecord).pipe(
      switchMap(result => {
        const masterBranchId = result['branchId'];
        const recordId = result['recordId'];
    
        const newWorkflow: WorkflowSchema = {
          iri: recordId,
          title: newWorkflowRecord.title,
          issued: new Date(),
          modified: new Date(),
          description: newWorkflowRecord.description,
          active: false,
          workflowIRI: result['WorkflowId'],
          executorIri: undefined,
          executionId: undefined,
          executorUsername: undefined,
          executorDisplayName: undefined,
          startTime: undefined,
          endTime: undefined,
          succeeded: undefined,
          status: 'never_run',
          master: masterBranchId,
          canModifyMasterBranch: false,
          canDeleteWorkflow: false
        };
        return forkJoin({
          modifyPermission: this.wms.checkMasterBranchPermissions(masterBranchId, recordId),
          deletePermission: this.wms.checkMultiWorkflowDeletePermissions([newWorkflow])
        }).pipe(
          map(({ modifyPermission, deletePermission }) => {
            return {
              ...newWorkflow,
              canModifyMasterBranch: modifyPermission,
              canDeleteWorkflow: deletePermission.some(permission => permission.decision === 'Permit')
            };
        })
      )}),
      catchError((error: RESTError) => {
        this.error = error;
        requestErrorFlag = true;
        return EMPTY;
      })
    ).subscribe({
        next: (newWorkflow: WorkflowSchema) => {
          this._dialogRef.close({ status: true, newWorkflow });
          isDialogClosed = true;
        },
        complete: () => {
          if (!isDialogClosed && !requestErrorFlag) {
            this._dialogRef.close({ status: false });
            isDialogClosed = true;
          }
        }
      });
    }
}
