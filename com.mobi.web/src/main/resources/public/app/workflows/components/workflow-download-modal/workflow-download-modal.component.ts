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
import { Component, Inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { get } from 'lodash';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CATALOG } from '../../../prefixes';
import { ToastService } from '../../../shared/services/toast.service';
import { WorkflowSchema } from '../../models/workflow-record.interface';

/**
 * @class workflows.WorkflowDownloadModalComponent
 * 
 * A component that creates content for a modal to download the provided list of workflows into separate files. Contains
 * a {@link shared.SerializationSelectComponent} to pick the RDF format for the downloads. Meant to be used in
 * conjunction with the `MatDialog` service.
 */
@Component({
  selector: 'app-workflow-download-modal',
  templateUrl: './workflow-download-modal.component.html',
  styleUrls: ['./workflow-download-modal.component.scss']
})
export class WorkflowDownloadModalComponent {
  displayInfoMessage: boolean;
  workflowTitles: string;
  catalogId: string;
  catalogHead = `${CATALOG}head`;

  downloadForm: UntypedFormGroup = this._fb.group({
    serialization: ['turtle', [Validators.required]]
  });

  constructor(private _fb: UntypedFormBuilder,
    private _cms: CatalogManagerService,
    private _dialogRef: MatDialogRef<WorkflowDownloadModalComponent>,
    private toast: ToastService,
    @Inject(MAT_DIALOG_DATA) public data: { workflows: WorkflowSchema[], applyInProgressCommit: boolean }) {
    this.workflowTitles = this.data.workflows.map(workflow => workflow.title).join(', ');
    this.catalogId = get(this._cms.localCatalog, '@id', '');
    this.displayInfoMessage = this.data.workflows.length > 1;
  }

  /**
   * Initiates the download process for the workflows provided in the dialog data.
   * For each workflow, fetches the corresponding JSON-LD object from the catalog service,
   * extracts necessary information such as master branch ID, and head commit ID,
   * and attempts to download the resource associated with the workflow.
   * If any errors occur during the process, appropriate error messages are displayed
   * using the toast service.
   * Once all downloads are attempted, closes the dialog window.
   */
  download(): void {
    this.data.workflows.forEach(workflow => {
      const workflowName = workflow.title;
      this._cms.getRecordBranch('master', workflow.iri, this.catalogId)
        .subscribe((jsonLDObject: JSONLDObject) => {
          if (!jsonLDObject || !jsonLDObject['@id'] || !jsonLDObject[this.catalogHead] || !jsonLDObject[this.catalogHead][0]['@id']) {
            this.toast.createErrorToast('Invalid JSON-LD object received for: ' + workflowName);
            return;
          }
          const fileName = workflowName.replace(/[ &/\\#,+()$~%.'":*?<>{}]/g, '');
          const masterBranchId = workflow.master ? workflow.master : jsonLDObject['@id'];
          const headCommitId = jsonLDObject[this.catalogHead][0]['@id'];

          try {
            this._cms.downloadResource(headCommitId, masterBranchId, workflow.iri, this.catalogId,
              this.data.applyInProgressCommit, this.downloadForm.controls.serialization.value, fileName);
          } catch (downloadError) {
            this.toast.createErrorToast('Error downloading: ' + workflowName);
          }
        });
    });
    this._dialogRef.close(true);
  }
}
