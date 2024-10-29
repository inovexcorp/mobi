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
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Observable, ReplaySubject, Subscription, combineLatest, forkJoin, of, throwError } from 'rxjs';
import { DataSource } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { Sort, SortDirection } from '@angular/material/sort';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ComponentType } from '@angular/cdk/overlay';
import { get } from 'lodash';

import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PROV } from '../../../prefixes';
import { PaginatedResponse } from '../../../shared/models/paginated-response.interface';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { SortOption } from '../../../shared/models/sortOption.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { WorkflowDataRow } from '../../models/workflow-record-table';
import { WorkflowDownloadModalComponent } from '../workflow-download-modal/workflow-download-modal.component';
import { WorkflowPaginatedConfig } from '../../models/workflow-paginated-config.interface';
import { WorkflowSchema } from '../../models/workflow-record.interface';
import { WorkflowTableFilterEvent } from '../../models/workflow-table-filter-event.interface';
import { WorkflowActivitySSEEvent, WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { getPropertyId } from '../../../shared/utility';
import { WorkflowCreationModalComponent } from '../workflow-creation-modal/workflow-creation-modal.component';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { WorkflowUploadModalComponent } from '../workflow-upload-modal/workflow-upload-modal.component';

/**
 * Represents the DataSource for Workflows Table
 */
class WorkflowsDataSource extends DataSource<WorkflowDataRow> {
  public readonly messageNoData = 'No Workflow record found';
  public executingWorkflows = [];
  private _activityEventDataStream = new ReplaySubject<WorkflowActivitySSEEvent>();
  private _workflowDataStream = new ReplaySubject<WorkflowDataRow[]>();
  private _length = 0;
  private executionActivitiesSub: Subscription;
  private _executingActivities: JSONLDObject[] = [];
  public errorMessage: string;
  public infoMessage: string;
  public isWorkflowRunning = false;
  public totalCount = 0;
  
  constructor(public _wss: WorkflowsStateService, public _wms: WorkflowsManagerService, 
      public paginationConfig: WorkflowPaginatedConfig) {
    super();
    this._wms.getExecutingActivities().subscribe(activities =>{
      this._executingActivities = activities;
      this._activityEventDataStream.next(undefined);
      this.executionActivitiesSub = this._wms.getWorkflowEvents().subscribe(event => {
        this._activityEventDataStream.next(event);
        this.retrieveWorkflows(this.paginationConfig).subscribe();
      });
    });
  }
  /**
   * Connect function and trigger updates when that stream emits new data array values
   * 
   * @returns Records observable to use for records and updates table columns to be displayed. 
   * Updates data based on stored currently execution activities list.
   */
  connect(): Observable<WorkflowDataRow[]> {
    return combineLatest([this._workflowDataStream, this._activityEventDataStream]).pipe(
      switchMap((latestResults) => {
        const workflowRecords: WorkflowDataRow[] = latestResults[0];
        const activityEvent: WorkflowActivitySSEEvent = latestResults[1];
        return this.mergeWorkflowRecordActivities(workflowRecords, activityEvent);
      }),
      catchError(err => this.handleError(err))
    );
  }
  mergeWorkflowRecordActivities(workflowRecords: WorkflowDataRow[], activityEvent?: WorkflowActivitySSEEvent): Observable<WorkflowDataRow[]> {
    if (activityEvent) {
      const updatedActivity = activityEvent.data[0];
      const usedWorkflow = getPropertyId(updatedActivity, `${PROV}used`);
      if (activityEvent.type.endsWith('START')) {
        const idx = this._executingActivities.findIndex(activity => activity['@id'] === updatedActivity['@id']);
        if (idx < 0) {
          this._executingActivities.push(updatedActivity);
          const workflowIdx = workflowRecords.findIndex(workflow => workflow.record.iri === usedWorkflow);
          if (workflowIdx >= 0) {
            this._wss.updateWorkflowWithActivity(workflowRecords[workflowIdx], updatedActivity);
          }
        }
      } else if (activityEvent.type.endsWith('END')) {
        const idx = this._executingActivities.findIndex(activity => activity['@id'] === updatedActivity['@id']);
        if (idx >= 0) {
          this._executingActivities.splice(idx, 1);
          const workflowIdx = workflowRecords.filter(workflow => workflow.statusDisplay.toLowerCase() === 'started')
            .findIndex(workflow => workflow.record.iri === usedWorkflow);
          if (workflowIdx >= 0) {
            this._wss.updateWorkflowWithActivity(workflowRecords[workflowIdx], updatedActivity);
          }
        }
      }
    }
    this.isWorkflowRunning = this._executingActivities.length > 0;
    return of(workflowRecords);
  }
  /**
   * Retrieves the results with updated columns from the web service.
   */
  retrieveWorkflows(paginationConfig: WorkflowPaginatedConfig): Observable<PaginatedResponse<WorkflowDataRow[]>> {
    return this._wss.getResults(paginationConfig).pipe(
      catchError((e: RESTError): Observable<PaginatedResponse<WorkflowDataRow[]>> => {
        this.errorMessage = e.errorMessage;
        return of({
          totalCount: 0, 
          page: undefined
        });
      }),
      tap((data: PaginatedResponse<WorkflowDataRow[]>) => {
        if (data.page === undefined) {
          this.setData([]);
        } else {
          this.totalCount = data.totalCount;
          if (data.page.length > 0) {
            this.infoMessage = undefined;
            this.errorMessage = undefined;
          } else {
            this.infoMessage = this.messageNoData;
            this.errorMessage = undefined;
          }
          this.setData(data.page);
        }
      })
    );
  }
  /**
   * Disconnect Occurs During the table's ngOnDestroy or when the data source is removed from the table.
   * Since using ngIf, table's ngOnDestroy will be called every time there is no workflows
   */
  disconnect() {
  }

  /**
   * Sets the data for the table
   * @param {WorkflowDataRow[]} workflowDataRows  Workflows Rows Data
   */
  setData(workflowDataRows: WorkflowDataRow[]) {
    this.length = workflowDataRows.length;
    this._workflowDataStream.next(workflowDataRows);
  }

  get length(): number {
    return this._length;
  }

  set length(length: number) {
    this._length = length;
  }
  /**
   * - Handles the given error and returns an Observable that emits an error.
   * - return workflows records if any error happened with activities and emits the error
   *
   * @param {any} e - The error object.
   * @param {WorkflowDataRow[]} workflows The current array of workflows to display
   * @return {Observable<never>} - An Observable that emits an error.
   */
  private handleError(e, workflows: WorkflowDataRow[] = []): Observable<never|WorkflowDataRow[]> {
    if (e?.explicitOriginalTarget) {
      this.errorMessage = 'Error loading executions';
      return of(workflows);
    }
    return throwError(e);
  }

  /**
   * Clean Up. Unsubscribes from Subscription
   */
  cleanUp(){
    if (this.executionActivitiesSub) {
      this.executionActivitiesSub.unsubscribe();
    }
  }
}

/**
 * @class workflows.WorkflowRecordsComponent
 * 
 * Represents a component for displaying and managing workflow records.
 */
@Component({
  selector: 'app-workflow-records',
  templateUrl: './workflow-records.component.html',
  styleUrls: ['./workflow-records.component.scss']
})
export class WorkflowRecordsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('recordSelectFileInput', { static: true }) fileInput: ElementRef;
  /**
   * Variable used to control which field of MatSort component is shown to be sorted
   */
  matSortActive = 'title';
  /**
   * Variable used to control sort direction of MatSort component
   */
  matSortDirection: SortDirection = 'asc';
  /**
   * Array of strings representing the columns to be displayed.
   *
   * @type {string[]}
   */
  readonly columnsToDisplay: string[] =  ['position', 'title', 'active',
    'status', 'executorUsername', 'executorIri', 'startTime', 'runningTime'];
  /**
   * Data Source variable that stores an array of WorkflowDataRow objects.
   * 
   * @type {WorkflowsDataSource}
   */
  dataSource: WorkflowsDataSource;
  /**
   * Data Source Subscription
   */
  dataSourceSub: Subscription;
  /**
   * An array of all selected workflows
   *
   * @type { WorkflowDataRow[]}
   */
  selectedWorkflows: WorkflowDataRow[] = [];
  /**
   * A string of the reasoning behind a disabled execute workflow button
   *
   * @type {string}
   */
  tooltipMessage = 'Select a workflow.';
  /**
   * Default Page Size for workflow records page
   * 
   * @type {number}
   */
  readonly defaultPageSize = 20;
  /**
   * `paginationConfig` holds the configuration to be used when retrieving the results of a
   * Workflow Records query. These configurations are the limit, page index, search text,
   * and sort option. The limit and sortOption are not to be changed for now.
   * @type {PaginatedConfig}
   */
  paginationConfig: WorkflowPaginatedConfig = {
    limit: this.defaultPageSize,
    pageIndex: 0,
    searchText: '',
    ascending: true,
    sortOption: {
      field: 'title',
      asc: true,
      label: ''
    }
  };
  /**
   * A string representation of the catalog ID
   *
   * @type {string}
   */
  catalogId;
    /**
   * A boolean representation of if a user can create a workflow record
   *
   * @type {boolean}
   */
  canCreate = false;
  /**
   * An array of the IRIs of executing workflows.
   *
   * @type {string[]}
   */
  executingWorkflows: string[];

  /**
   * WorkflowRecordsComponent Constructor
   *
   * @param {WorkflowsStateService} wss - The WorkflowsStateService object is a dependency passed as a parameter.
   *                                      It is used for initializing the public property "wss"
   * @param {WorkflowsManagerService} _wms - WorkflowsManagerService object is a dependency passed as a parameter.
   * @param {MatDialog} _dialog - Injects MatDialog
   * @param {CatalogManagerService} _cms - CatalogManagerService
   * @param {ToastService} _toast ToastService
   * @param {PolicyEnforcementService} _pep PolicyEnforcementService
   */
  constructor(public wss: WorkflowsStateService,  
              public _wms: WorkflowsManagerService, 
              private _dialog: MatDialog,
              public _cms: CatalogManagerService,
              private _toast: ToastService,
              protected _pep: PolicyEnforcementService) { 
    this.dataSource = new WorkflowsDataSource(wss, _wms, this.paginationConfig);
  }
  /**
   * Initializes the component, restore search text from state service
   */
  ngOnInit(): void {
    this._wms.checkCreatePermission().subscribe((response) => {
      this.canCreate = response === 'Permit';
    } );
    this.catalogId = get(this._cms.localCatalog, '@id', '');
    this.paginationConfig.searchText = this.wss.landingPageSearchText;
    this.dataSourceSub = this.dataSource.connect().subscribe((workflows) => {
      this._setExecutingWorkflows(workflows);
      this.selectedWorkflows.forEach((selected, idx) => {
        const visibleWorkflow = workflows.find(workflow => workflow.record.iri === selected.record.iri);
        if (visibleWorkflow) {
          visibleWorkflow.checked = true;
          // Done to accommodate any new metadata coming in
          this.selectedWorkflows[idx] = visibleWorkflow;
        }
      });
    });
    this.updateWorkflowRecords();
  }

  /**
   * Clean up subscriptions and save state to be persistent
   */
  ngOnDestroy(): void {
    if (this.dataSourceSub) {
      this.dataSourceSub.unsubscribe();
    }
    if (this.dataSource) {
      this.dataSource.cleanUp();
    }
  }
  /**
   * Track by function for table
   * @param index row index
   * @param item WorkflowDataRow to get id from
   * @returns Unique ID for row
   */
  trackWorkflowDataRow(index: number, item: WorkflowDataRow): string {
    return `${item.record.iri}`;
  }
  /**
   * Updates the page index for pagination and sets the table data.
   *
   * @param {PageEvent} pageEvent - The event object containing the new page index.
   */
  onPageChange(pageEvent: PageEvent): void {
    this.paginationConfig.pageIndex = pageEvent.pageIndex;
    this.paginationConfig.offset = pageEvent.pageIndex * pageEvent.pageSize;
    this.updateWorkflowRecords();
  }
  /**
   * Update Page with new workflow records
   */
  updateWorkflowRecords(): void {
    this.dataSource.retrieveWorkflows(this.paginationConfig).subscribe();
  }
  /**
   * Open Workflow Page
   */
  openRecord(row: WorkflowDataRow, openInEditMode = false): void {
    this.wss.selectedRecord = row.record;
    if (openInEditMode) {
      this.wss.isEditMode = true;
    }
  }
  /**
   * Executes the selected workflow after confirming with the user.
   */
  runWorkflow(): void {
    const workflow = this.selectedWorkflows[0];
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `Are you sure you want to run <strong>${workflow.record.title}</strong>?`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        this._wms.executeWorkflow(workflow.record.iri).subscribe({
          next: () => {
            this.selectedWorkflows = [];
          },
          error: (error: RESTError) => {
            const message = error.errorMessage ? error.errorMessage : error;
            this._toast.createErrorToast(`Error executing workflow: ${message}`);
            this.selectedWorkflows.forEach(workflow => {
              workflow.checked = false;
            });
            this.selectedWorkflows = [];
            this.tooltipMessage = 'Select a workflow.';
          }
        });
      }
    });
  }
  
  getSelectedRecords(): WorkflowSchema[] {
    return this.selectedWorkflows.map(workflow => workflow.record);
  }

  /**
   * Deletes the selected workflows after confirming with the user and handles error scenarios.
   *
   * @returns {void}
   */
  deleteWorkflow(): void {
    const workflowTitles = this.selectedWorkflows.map(workflow => workflow.record.title).join(', ');
  
    this._dialog.open(ConfirmModalComponent, {
      data: {
        content: `Are you sure you want to delete <strong>${workflowTitles}</strong>?`
      }
    }).afterClosed().subscribe((result: boolean) => {
      if (result) {
        const deleteRequests = this.selectedWorkflows.map(workflow => {
          return this._cms.deleteRecord(workflow.record.iri, this.catalogId).pipe(
            catchError(() => {
              this._toast.createErrorToast(`Error deleting workflow: ${workflow.record.title}`);
              return of(null); // Return a non-error observable to continue the forkJoin
            })
          );
        });
        forkJoin(deleteRequests).subscribe({
          next: () => {
            this.paginationConfig.offset = 0;
            this.paginationConfig.pageIndex = 0;
            this.selectedWorkflows = [];
            this.updateWorkflowRecords();
          },
          error: () => {
            this._toast.createErrorToast('Error making batch request to delete workflows');
            this.resetLimitOffset();
            this.selectedWorkflows = [];
          }
        });
      }
    });
  }
  /**
   * Opens a dialog window for downloading selected workflows.
   */
  downloadWorkflow(): void {
    this._dialog.open(WorkflowDownloadModalComponent,
       { data: { workflows: this.getSelectedRecords(), applyInProgressCommit: this.wss.isEditMode } })
      .afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.selectedWorkflows = [];
          this.resetLimitOffset();
          this.updateWorkflowRecords();
        }
      });
  }

  /**
   * Opens a dialog window for creating workflows
   */
  createWorkflow(): void {
    this.openDialog(WorkflowCreationModalComponent);
  }

  /**
   * Opens a dialog window for uploading a workflow file when triggered by a file input event.
   * 
   * @param event The event object triggered by selecting a file using a file input element.
   *              It should contain the selected file in the target property.
   */
  uploadWorkflow(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.openDialog(WorkflowUploadModalComponent, { file });
    }
  }

  /**
   * Opens a dialog window for either creating a new workflow or uploading a workflow file.
   * @private
   * 
   * @param component The type of dialog component to open. It should be either WorkflowCreationModalComponent or
   * WorkflowUploadModalComponent.
   * @param data Optional data to pass to the dialog component. For upload workflow, it should contain the selected file.
   */
  private openDialog(component: ComponentType<WorkflowCreationModalComponent |
     WorkflowUploadModalComponent>, data?: { file: File }): void {
    this._dialog.open(component, { data }).afterClosed().subscribe((result) => {
      if (result?.status) {
        const newWorkflowDataRow: WorkflowDataRow = {
          record: result.newWorkflow,
          statusDisplay: undefined,
          executorDisplay: undefined,
          executionIdDisplay: undefined,
          startTimeDisplay: undefined,
          runningTimeDisplay: undefined
        };
        this.openRecord(newWorkflowDataRow, true);
      }
    });
  }

  /**
   * Opens the browser file selection dialog when the associated button is clicked.
   * Resets the value of the file input element before triggering a click event
   * to ensure that the dialog opens even if the same file is selected again.
   */
  openFileSelection(): void {
    this.fileInput.nativeElement.value = null;
    this.fileInput.nativeElement.click();
  }
  /**
   * Updates the selected workflows based on the provided workflow element, and updates boolean validity and tooltip accordingly.
   *
   * @param {WorkflowDataRow} workflow - The workflow element to be selected or deselected.
   * @param {boolean} value - The new selected state of the workflow.
   */
  toggleWorkflow(workflow: WorkflowDataRow, value: boolean): void {
    workflow.checked = value;
    const idx = this.selectedWorkflows.findIndex(selected => selected.record.iri === workflow.record.iri);
    if (value && idx < 0) {
      this.selectedWorkflows.push(workflow);
    } else if (!value && idx >= 0) {
      this.selectedWorkflows.splice(idx, 1);
    }
  }
  /**
   * Event used to apply filters to the workflow table.
   * @param workflowTableFilterEvent Event object representing a filter applied to the workflow table.
   */
  filterEvent(workflowTableFilterEvent: WorkflowTableFilterEvent): void {
    if (workflowTableFilterEvent.filter === 'status') {
      this.paginationConfig.status = workflowTableFilterEvent.data.status;
    } else if (workflowTableFilterEvent.filter === 'timeRange') {
      this.paginationConfig.startingAfter = workflowTableFilterEvent.data?.startingAfterISOString;
      this.paginationConfig.endingBefore = workflowTableFilterEvent.data?.endingBeforeISOString;
    } else if (workflowTableFilterEvent.filter === 'searchText') {
      this.paginationConfig.searchText = workflowTableFilterEvent.data?.text;
      this.wss.landingPageSearchText = this.paginationConfig.searchText;
    }
    this.resetLimitOffset();
    this.updateWorkflowRecords();
  }
  /**
   * Resets Limit and Offset
   */
  resetLimitOffset(): void  {
    this.paginationConfig.offset = 0;
    this.paginationConfig.pageIndex = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.paginationConfig.limit = this.paginator.pageSize;
    } else {
      this.paginationConfig.limit = this.defaultPageSize;
    }
  }
  /**
   * Occurs when table is sorted
   * @param sortState Sort Event
   */
  sortChange(sortState: Sort): void {
    const sortOption: SortOption = {
      field: '',
      asc: true,
      label: ''
    };
    if (sortState.direction === 'asc') {
      sortOption.asc = true;
    } else if (sortState.direction === 'desc') {
      sortOption.asc = false;
    }
    if (sortState?.active) {
      this.matSortActive = sortState.active;
      sortOption.field = sortState.active;
    }
    this.paginationConfig.sortOption = sortOption;
    this.resetLimitOffset();
    this.updateWorkflowRecords();
  }
  /**
   * Updates the status of a workflow.
   *
   * @param {MatSlideToggleChange} $event - The MatSlideToggleChange event object.
   * @param {WorkflowDataRow} workflow - The WorkflowDataRow object representing the workflow.
   */
  updateStatus($event: MatSlideToggleChange, workflow: WorkflowDataRow): void {
    const { checked } = $event;
    this._wms.updateWorkflowActiveStatus(workflow.record.iri, checked).subscribe(() =>{
      workflow.record.active = checked;
    });
  }

  /**
   * Processes the provided list of Workflow Record rows and sets `executingWorkflows` to the record IRIs of the ones
   * which are currently executing.
   * 
   * @private
   * @param {WorkflowDataRow[]} workflows An array of rows of Workflow Records
   */
  private _setExecutingWorkflows(workflows: WorkflowDataRow[]): void {
    this.executingWorkflows = [];
     workflows.forEach(workflow => {
      if (workflow.record.status === 'started') {
        this.executingWorkflows.push(workflow.record.iri);
      }
    });
  }
}
