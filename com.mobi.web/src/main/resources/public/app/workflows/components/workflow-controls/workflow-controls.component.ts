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
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';

import { WorkflowSchema } from '../../models/workflow-record.interface';
import { WorkflowsStateService } from '../../services/workflows-state.service';

/**
 * @class workflows.WorkflowControlsComponent
 * 
 * Creates a collection of buttons to work against the provided list of Workflows. Includes a button to run, a button
 * to delete, and a button to download. The run button is enabled based on the number of provided workflows, whether a
 * workflow is running, whether all the workflows are active, and whether the user has the modify MASTER permission on
 * all the workflows.
 * 
 * @param {WorkflowSchema} records A list of representations of workflows as the target of the workflow controls
 * @param {String} executingWorkflows A list of IRIs representing the currently running workflows
 * @param {boolean} canCreate Whether the current user is allowed to create workflows
 * @param {Function} onRun A function to call when the run button is clicked. Expects an argument of a workflows array
 * @param {Function} onDownload A function to call when the download button is clicked. Expects an argument of a
 * workflows array
 * @param {Function} onDelete A function to call when the delete button is clicked. Expects an argument of a workflows 
 * array
 * @param {Function} onCreate A function to call when the create button is clicked
 * @param {Function} onUpload A function to call when the upload button is clicked
 */
@Component({
  selector: 'app-workflow-controls',
  templateUrl: './workflow-controls.component.html',
})
export class WorkflowControlsComponent implements OnChanges {
  @Input() records: WorkflowSchema[];
  @Input() executingWorkflows: string[] = [];
  @Input() isEditMode: boolean;
  @Input() canCreate: boolean;
  @Output() onRun = new EventEmitter<WorkflowSchema[]>();
  @Output() onDownload = new EventEmitter<WorkflowSchema[]>();
  @Output() onDelete = new EventEmitter<WorkflowSchema[]>();
  @Output() onCreate = new EventEmitter<WorkflowSchema[]>();
  @Output() onUpload = new EventEmitter<WorkflowSchema[]>();

  currentlyRunning = false;
  runDisabled = false;
  creationTooltip = '';

  constructor(public wss: WorkflowsStateService) {}

  ngOnChanges(): void {
    this.isRunDisabled();
    this.setWorkflowCreationTooltip();
  }

  /**
   * @returns {boolean} Whether the run button should be disabled. True if there are no workflow records provided, a
   *    workflow is currently running, some of the records aren't active, or the user does not have Modify MASTER 
   *    permission to some of the records
   */
  isRunDisabled(): boolean {
    this.currentlyRunning = this.verifyRunningWorkflow();
    const someNotActive = this.records.some(workflow => !workflow.active);
    const someNotPermitted = this.records.some(workflow => !workflow.canModifyMasterBranch);
    this.runDisabled = !this.records.length || this.records.length > 1 || this.currentlyRunning || someNotActive
      || someNotPermitted || this.isEditMode;

    return this.runDisabled;
  }

  /**
   * Determines whether the delete button should be disabled. The delete button is disabled if there are no workflow 
   * records provided or if the user does not have permission to delete some of the workflow records.
   * @returns {boolean} True if there are no workflow records provided or the user does not have permission to delete 
   * some of the records, otherwise false.
   */
  isDeleteDisabled(): boolean {
    const someNotPermitted = this.records.some(workflow => !workflow.canDeleteWorkflow);
    return !this.records.length || someNotPermitted || this.isEditMode;
  }

  /**
   * Determines whether the download button should be disabled. The download button is disabled if there are no workflow
   * records provided.
   * @returns {boolean} True if there are no workflow records provided, otherwise false.
   */
  isDownloadDisabled(): boolean {
    return !this.records.length;
  }
  
  /**
   * Updates the run button tooltip message based on the number of workflows and their properties.
   */
  getRunTooltip(): string {
    const someNotActive = this.records.some(workflow => !workflow.active);
    const someNotPermitted = this.records.some(workflow => !workflow.canModifyMasterBranch);
    if (this.currentlyRunning) {
      return 'A selected workflow is already currently running.';
    } else if (this.records.length > 0) {
      if (this.records.length > 1) {
        return 'Select only one workflow.';
      } else if (someNotPermitted) {
        return 'You do not have permission to execute a selected workflow.';
      } else if (someNotActive) {
        return 'A selected workflow is not active.';
      } else if (this.isEditMode) {
        return 'Cannot run workflow while in edit mode.';
      } else {
        return ''; 
      } 
    } else {
      return 'Select a workflow.';
    }
  }

  /**
   * Updates the delete button tooltip message based on the number of workflows and their properties.
   */
  getDeleteTooltip(): string {
    const someNotPermitted = this.records.some(workflow => !workflow.canDeleteWorkflow);
    const noneSelected = !this.records.length;

    if (noneSelected) {
      return 'Select a workflow.';
    } else if (someNotPermitted) {
      return 'You do not have permission to delete a selected workflow.';
    } else if (this.isEditMode) {
      return 'Cannot delete while in edit mode.';
    } else {
      return '';
    }
  }

  /**
   * Updates the download button tooltip message based on the number of workflows.
   */
  getDownloadTooltip(): string {
    const noneSelected = !this.records.length;

    if (noneSelected) {
      return 'Select a workflow.';
    } else {
      return '';
    }
  }

  /**
   * Updates the create workflow button tooltip message based on permissions.
   */
  setWorkflowCreationTooltip(): void {
    this.creationTooltip = this.canCreate ? '' : 'You do not have permission to create workflow records.';
  }

  runWorkflow(): void {
    this.onRun.emit(this.records);
  }
  deleteWorkflow(): void {
    this.onDelete.emit(this.records);
  }
  downloadWorkflow(): void {
    this.onDownload.emit(this.records); 
  }
  createWorkflow(): void {
    this.onCreate.emit();
  }
  uploadWorkflow(): void {
    this.onUpload.emit();
  }
  verifyRunningWorkflow(): boolean {
    return this.records.some((record: WorkflowSchema) => {
      if (this.executingWorkflows.includes(record.iri)) {
        return true;
      }
    });
  }
}
