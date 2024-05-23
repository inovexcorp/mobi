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
import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { map, trim, uniq } from 'lodash';

import { REGEX } from '../../../constants';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { splitIRI } from '../../../shared/pipes/splitIRI.pipe';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { DCTERMS, WORKFLOWS } from '../../../prefixes';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowRecordConfig } from '../../models/workflowRecordConfig.interface';
import { WorkflowSchema } from '../../models/workflow-record.interface';

/**
 * @class workflows.WorkflowCreationModalComponent
 *
 * A component that creates content for a modal with a form containing fields for creating a new Workflow Record. The
 * fields are for the title, workflow IRI, description, and {@link shared.KeywordSelectComponent keywords}. Meant to be
 * used in conjunction with the `MatDialog` service.
 */
@Component({
  selector: 'app-workflow-creation-modal',
  templateUrl: './workflow-creation-modal.component.html',
})
export class WorkflowCreationModalComponent implements OnInit {
  error: string | RESTError;
  iriPattern = REGEX.IRI;
  iriHasChanged = false;
  defaultWorkflowNamespace = 'http://mobi.solutions/ontologies/workflows/';

  newWorkflowForm = this._fb.group({
    title: ['', [Validators.required]],
    iri: ['', [Validators.required, Validators.pattern(this.iriPattern)]],
    description: [''],
    keywords: [[]]
  });

  constructor(private _fb: UntypedFormBuilder, private _camelCase: CamelCasePipe,
    private _dialogRef: MatDialogRef<WorkflowCreationModalComponent>,
    public wms: WorkflowsManagerService) { }

  ngOnInit(): void {
    this.newWorkflowForm.controls.iri.setValue(this.defaultWorkflowNamespace);
    this.newWorkflowForm.controls.title.valueChanges.subscribe(newVal => this.nameChanged(newVal));
  }

  /**
   * Updates the IRI of the workflow based on the new name, if the IRI has not been manually changed.
   * 
   * @param {string} newName - The new name of the workflow.
   */
  nameChanged(newName: string): void {
    if (!this.iriHasChanged) {
      const split = splitIRI(this.newWorkflowForm.controls.iri.value);
      this.newWorkflowForm.controls.iri.setValue(split.begin + split.then + this._camelCase.transform(newName, 'class'));
    }
  }

  /**
   * Marks the IRI as manually edited by the user.
   */
  manualIRIEdit(): void {
    this.iriHasChanged = true;
  }

  /**
   * Creates a new workflow record based on the data provided in the new workflow form.
   * After creating the record, it retrieves permissions for modifying the master branch and deleting the workflow.
   * Once permissions are obtained, it closes the dialog with the new workflow data.
   */
  create(): void {
    const newWorkflowIri = this.newWorkflowForm.controls.iri.value;
    const actionId = `${newWorkflowIri}/action`;

    const newWorkflow: JSONLDObject = {
      '@id': newWorkflowIri,
      '@type': [`${WORKFLOWS}Workflow`],
      [`${WORKFLOWS}hasAction`]: [{ '@id': actionId }],
    };
    const newAction: JSONLDObject = {
      '@id': actionId,
      '@type': [`${WORKFLOWS}Action`, `${WORKFLOWS}TestAction`],
      [`${WORKFLOWS}testMessage`]: [{ '@value': `This is a test message from ${actionId}` }]
    };

    if (this.newWorkflowForm.controls.description.value) {
      newWorkflow[`${DCTERMS}description`] = [{ '@value': this.newWorkflowForm.controls.description.value }];
    }
    
    const newWorkflowRecord: WorkflowRecordConfig = {
      title: this.newWorkflowForm.controls.title.value,
      description: this.newWorkflowForm.controls.description.value,
      keywords: uniq(map(this.newWorkflowForm.controls.keywords.value, trim)),
      jsonld: [newWorkflow, newAction]
    };
    this.wms.createWorkflowRecord(newWorkflowRecord)
      .subscribe((result) => {
        const masterBranchId = result['branchId'];
        const recordId = result['recordId'];

        const newWorkflow: WorkflowSchema = {
          iri: recordId,
          title: newWorkflowRecord.title,
          issued: new Date(),
          modified: new Date(),
          description: newWorkflowRecord.description,
          active: false,
          workflowIRI: newWorkflowIri,
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

        forkJoin({
          modifyPermission: this.wms.checkMasterBranchPermissions(masterBranchId, recordId),
          deletePermission: this.wms.checkMultiWorkflowDeletePermissions([newWorkflow])
        }).subscribe(({modifyPermission, deletePermission}) => {
          newWorkflow.canModifyMasterBranch = modifyPermission;
          newWorkflow.canDeleteWorkflow = deletePermission.some(permission => permission.decision === 'Permit');
          this._dialogRef.close({ status: true, newWorkflow: newWorkflow });
        });
      }, (error: RESTError) => {
        this.error = error;
      });
  }
}