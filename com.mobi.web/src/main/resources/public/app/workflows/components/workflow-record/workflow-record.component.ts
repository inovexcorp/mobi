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
  localCatalogIri: string;
  currentlyRunning = false;
  executingActivities: JSONLDObject[] = [];
  workflowRdf: JSONLDObject[] = [];

  disableClickFeature = true; // Used to disable buttons until future tickets are done

  private executionActivityEventsSubscription: Subscription;
  
  constructor(private _workflowsState: WorkflowsStateService,
    public cm: CatalogManagerService,
    private _toast: ToastService,
    private _wm: WorkflowsManagerService,
    private _dialog: MatDialog) { }

  ngOnInit(): void {
    this.localCatalogIri = get(this.cm.localCatalog, '@id', '');
    this.setRecordBranches();
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
    this.cm.getRecordBranches(this.record.iri, this.localCatalogIri, paginatedConfig)
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
            this.cm.getResource(getPropertyId(this.branch.branch, `${CATALOG}head`), this.record.master, 
              this.record.iri, this.localCatalogIri).subscribe(response => {
              if (typeof response !== 'string') {
                this.workflowRdf = response as JSONLDObject[];
              }
            }, error => {
              this._toast.createErrorToast(`Issue fetching latest workflow RDF: ${error}`);
            });
        }, error => {
          this.branches = [];
          this.branch = undefined;
          this._toast.createErrorToast(error);
        });
  }
  goBack(): void {
    this._workflowsState.selectedRecord = undefined;
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
            this._toast.createErrorToast(`Error executing workflow: ${error}`);
          }
        });
      }
    });
  }
  deleteWorkflow(): void {
    const workflowTitle = this.record.title;

    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `Are you sure you want to delete <strong>${workflowTitle}</strong>?`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.cm.deleteRecord(this.record.iri, this.localCatalogIri).subscribe({
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
  
  downloadWorkflow(): void {
    this._dialog.open(WorkflowDownloadModalComponent, { data: { workflows: [this.record] } });
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
}
