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
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';

import { Subscription } from 'rxjs';
import { find, get, sortBy } from 'lodash';

import { CATALOG, DCTERMS, PROV, WORKFLOWS } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PaginatedConfig } from '../../../shared/models/paginatedConfig.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { getDate, getDctermsValue, getPropertyId } from '../../../shared/utility';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { WorkflowSchema } from '../../models/workflow-record.interface';
import { WorkflowDownloadModalComponent } from '../workflow-download-modal/workflow-download-modal.component';
import { BranchInfo } from '../../models/branch-info.interface';
import { WorkflowUploadChangesModalComponent } from '../workflow-upload-changes-modal/workflow-upload-changes-modal.component';
import { Difference } from '../../../shared/models/difference.class';
import { WorkflowSHACLDefinitions } from '../../models/workflow-shacl-definitions.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';

/**
 * @class workflows.WorkflowRecordComponent
 * 
 * Represents a component for displaying workflow details
 * @implements OnInit
 */
@Component({
  selector: 'app-workflow-record',
  templateUrl: './workflow-record.component.html',
  styleUrls: ['./workflow-record.component.scss']
})
export class WorkflowRecordComponent implements OnInit, OnDestroy {
  @Input() record: WorkflowSchema;

  branch: BranchInfo;
  branches: BranchInfo[] = [];
  currentlyRunning = false;
  executingActivities: JSONLDObject[] = [];
  workflowRdf: JSONLDObject[] = [];
  catalogId: string;

  shaclDefinitions: WorkflowSHACLDefinitions;

  private executionActivityEventsSubscription: Subscription;
  
  constructor(public workflowsState: WorkflowsStateService,
    public cm: CatalogManagerService,
    private _toast: ToastService,
    private _wm: WorkflowsManagerService,
    private _dialog: MatDialog) {
      this.catalogId = get(this.cm.localCatalog, '@id', '');
     }

  ngOnInit(): void {
    this.setRecordBranches();
    this.setShaclDefinitions();
    this.executionActivityEventsSubscription = this._wm.getExecutionActivitiesEvents().subscribe(activities => {
      this.currentlyRunning = activities.length > 0;
      this.executingActivities = sortBy(
        activities.filter(activity => getPropertyId(activity, `${PROV}used`) === this.record.iri),
        activity => new Date(getPropertyId(activity, `${PROV}startedAtTime`))
      );
    });
  }
  ngOnDestroy(): void {
    if (this.executionActivityEventsSubscription) {
      this.executionActivityEventsSubscription.unsubscribe();
    }
  }
  setRecordBranches(): void {
    const paginatedConfig: PaginatedConfig = {
      pageIndex: 0,
      limit: 1,
      sortOption: find(this.cm.sortOptions, {field: `${DCTERMS}issued`, asc: true})
    };
    this.workflowRdf = [];
    this.cm.getRecordBranches(this.record.iri, this.catalogId, paginatedConfig)
        .subscribe((response: HttpResponse<JSONLDObject[]>) => {
            this.branches = response.body
              .filter(branch => !this.cm.isUserBranch(branch))
              .map((branch: JSONLDObject): BranchInfo => ({
                branch,
                title: getDctermsValue(branch, 'title'),
                description: getDctermsValue(branch, 'description'),
                date: getDate(getDctermsValue(branch, 'modified'), 'short'),
                head: getPropertyId(branch, `${CATALOG}head`),
                type: `${WORKFLOWS}WorkflowRecord`
              }))
              .filter((branch: BranchInfo) => branch.title === 'MASTER');
            this.branch = this.branches[0];

            this.setWorkflowRdf();
        }, error => {
          this.branches = [];
          this.branch = undefined;
          this._toast.createErrorToast(error);
        });
  }
  goBack(): void {
    if (this.workflowsState.isEditMode) {
      this._dialog.open(ConfirmModalComponent, {
        data: {
          content: 'Are you sure you want to go back? You will lose changes made during editing.'
        }
      }).afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.workflowsState.selectedRecord = undefined;
          this.workflowsState.isEditMode = false;
          this.workflowsState.hasChanges = false;
        }
      });
    } else {
      this.workflowsState.selectedRecord = undefined;
      this.workflowsState.isEditMode = false;
      this.workflowsState.hasChanges = false;
    }
  }

  /**
   * Updates the status of a workflow.
   *
   * @param {MatSlideToggleChange} $event - The MatSlideToggleChange event object.
   * @param {WorkflowSchema} record Workflow record
   *
   * @return {void} - This method does not return any value.
   */
  toggleRecordActive($event: MatSlideToggleChange, record: WorkflowSchema): void {
    const { checked } = $event;
    this._wm.updateWorkflowActiveStatus(record.iri, checked).subscribe(() => {
      record.active = checked;
    });
  }
  /**
   * Opens a confirmation dialog to run a workflow and executes the workflow if confirmed.
   * Displays success or error toast messages accordingly.
   */
  runWorkflow(): void {
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `Are you sure you want to run <strong>${this.record.title}</strong>?`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this._wm.executeWorkflow(this.record.iri).subscribe({
          next: () => {
            this._toast.createSuccessToast('Successfully started workflow');
          },
          error: (error) => {
            const message = error.errorMessage ? error.errorMessage : error;
            this._toast.createErrorToast(`Error executing workflow: ${message}`);
          }
        });
      }
    });
  }
  /**
   * Opens a confirmation dialog to delete a workflow and deletes it if confirmed.
   * Navigates back after successful deletion or displays an error toast on failure.
   */
  deleteWorkflow(): void {
    const workflowTitle = this.record.title;

    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `Are you sure you want to delete <strong>${workflowTitle}</strong>?`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.cm.deleteRecord(this.record.iri, this.catalogId).subscribe({
          next: () => {
            this.goBack();
          },
          error: () => {
            this._toast.createErrorToast(`Error deleting workflow: ${workflowTitle}`);
          }
        });
      }
    });
  }
  
  /**
   * Opens a modal dialog to download the workflow.
   * Passes the workflow record to the modal component along with a flag indicating whether to
   * get the resources most recent in progress commit.
   */
  downloadWorkflow(): void {
    this._dialog.open(WorkflowDownloadModalComponent, { data: { workflows: [this.record], applyInProgressCommit: this.workflowsState.isEditMode } });
  }
  /**
   * returns the status based on the given boolean value.
   *
   * @param {boolean} active - The boolean value indicating whether the status is active or not.
   *
   * @return {string} - The recorded status ('Active' if `active` is `true`, 'Inactive' if `active` is `false`).
   */
  recordStatus(active: boolean): string {
    return active ? 'Active' : 'Inactive';
  }

  /**
   * Toggles the edit mode for the workflow.
   * Updates the state and clears any pending changes.
   * Deletes any in-progress commit, if it exists.
   */
  toggleEditMode(): void {
    this.workflowsState.isEditMode = !this.workflowsState.isEditMode;
    this.workflowsState.hasChanges = false;
    this.cm.getInProgressCommit(this.record.iri, this.catalogId).subscribe((response: Difference) => {
      if (response.additions.length > 0 || response.deletions.length < 0) {
        this.cm.deleteInProgressCommit(this.record.iri, this.catalogId).subscribe();
      }
    });
  }

  /**
   * Opens a modal dialog for uploading workflow changes.
   * Retrieves the head commit of the branch and opens the upload changes modal with necessary data.
   * Updates the state and fetches the latest workflow RDF if changes are uploaded successfully.
   * Displays a warning toast if no changes are detected with the new upload.
   */
  uploadChangesModal(): void {
    this.cm.getBranchHeadCommit(this.branch.branch['@id'] ,this.record.iri, this.catalogId).subscribe(response => {
      this._dialog.open(WorkflowUploadChangesModalComponent, {data: {recordId: this.record.iri, branchId: this.branch.branch['@id'], commitId: response.commit['@id'], catalogId: this.catalogId}})
      .afterClosed().subscribe((result) => {
        if (result && result.status === 200) {
          this.workflowsState.hasChanges = true;
          this.setWorkflowRdf();
        } else if (result && result.status === 204) {
          this._toast.createWarningToast('No changes detected with new upload');
        }
      });
    });
  }

  setWorkflowRdf(): void {
    this.cm.getResource(getPropertyId(this.branch.branch, `${CATALOG}head`), this.record.master, this.record.iri,
      this.catalogId, this.workflowsState.hasChanges
    ).subscribe(response => {
      if (typeof response !== 'string') {
        this.workflowRdf = response as JSONLDObject[];
      }
    }, error => {
      this._toast.createErrorToast(`Issue fetching latest workflow RDF: ${error}`);
    });
  }

  setShaclDefinitions(): void {
    this._wm.getShaclDefinitions(true).subscribe(definitions => {
      this.shaclDefinitions = definitions;
    }, (error: RESTError) => {
      this._toast.createErrorToast(`Issue fetching Workflow SHACL definitions: ${error.errorMessage}`);
    });
  }

  /**
   * Commits the pending changes to the workflow.
   * If there are pending changes, creates a new branch commit with a commit message.
   * Toggles edit mode and updates commit tab after committing changes.
   * If there are no pending changes, simply toggles edit mode.
   */
  commitChanges(): void {
    if (this.workflowsState.hasChanges) {
      this.cm.createBranchCommit(this.branch.branch['@id'], this.record.iri, this.catalogId, 'Commit for new Workflow Changes').subscribe(() => {
        this.toggleEditMode();
        this.setRecordBranches();
      },
      () => {
        this._toast.createErrorToast('Error saving changes to workflow');
      });
    } else {
      this.toggleEditMode();
    }
  }
}
