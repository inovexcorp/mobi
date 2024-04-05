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
import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { some } from 'lodash';

import { PaginatedResponse } from '../../models/paginated-response.interface';
import { WorkflowExecutionActivityDisplayI } from '../../models/workflow-execution-activity.interface';
import { WorkflowPaginatedConfig } from '../../models/workflow-paginated-config.interface';
import { WorkflowTableFilterEvent } from '../../models/workflow-table-filter-event.interface';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { getPropertyValue } from '../../../shared/utility';
import { PROV, WORKFLOWS } from '../../../prefixes';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { WorkflowSchema } from '../../models/workflow-record.interface';

/**
 * @class workflows.ExecutionHistoryTableComponent
 * 
 * Represents a component for displaying Activity Execution History
 * @implements OnInit, AfterViewInit
 */
@Component({
  selector: 'app-execution-history-table',
  templateUrl: './execution-history-table.component.html',
  styleUrls: ['./execution-history-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ExecutionHistoryTableComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() workflow: WorkflowSchema;
  @Input() workflowRdf: JSONLDObject[] = [];
  @Input() executingActivities: JSONLDObject[] = [];
  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly displayedColumns: string[] = ['status', 'executor', 'executionId', 'startTime', 
    'runningTime', 'details', 'logs'];
  readonly defaultLimit = 10;
  readonly pageSizeOptions = [10, 20, 30, 40, 50];
  dataSource = new MatTableDataSource<WorkflowExecutionActivityDisplayI>();
  paginationConfig: WorkflowPaginatedConfig = {
    limit: this.defaultLimit,
    pageIndex: 0,
    ascending: false,
    status: null,
    startingAfter: null,
    endingBefore: null
  };
  totalCount = 0;
  expandedRow: WorkflowExecutionActivityDisplayI | undefined;
  actions: JSONLDObject[] = [];

  constructor(public wss: WorkflowsStateService, private _wms: WorkflowsManagerService) { }

  ngOnInit(): void {
    this.findWorkflowExecutionActivities();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['executingActivities']) {
      if (changes['executingActivities'].firstChange) {
        return;
      }
      const previousActivities: JSONLDObject[] = changes['executingActivities'].previousValue;
      const currentActivities: JSONLDObject[] = changes['executingActivities'].currentValue;
   
      let shouldRefetch$: Observable<boolean> = of(false);
      // If no filters, refetch page
      if (!this.paginationConfig.startingAfter && !this.paginationConfig.status) {
        shouldRefetch$ = of(true);
      } else if (currentActivities.length > previousActivities.length) { // If a new activity was started
        shouldRefetch$ = this._shouldRefetchBecauseNewActivities(currentActivities
          .filter(activity => previousActivities.findIndex(prevAct => prevAct['@id'] === activity['@id']) < 0));
      } else { // If a running activity ended
        shouldRefetch$ = this._shouldRefetchBecauseEndedActivities(previousActivities
          .filter(activity => currentActivities.findIndex(currAct => currAct['@id'] === activity['@id']) < 0));
      }
  
      shouldRefetch$.subscribe(result => {
        if (result) {
          this.findWorkflowExecutionActivities();
        }
      });
    }
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }
  filterEvent(workflowTableFilterEvent: WorkflowTableFilterEvent): void {
    if (workflowTableFilterEvent.filter === 'status') {
      this.paginationConfig.status = workflowTableFilterEvent.data.status;
    } else if (workflowTableFilterEvent.filter === 'timeRange') {
      this.paginationConfig.startingAfter = workflowTableFilterEvent.data?.startingAfterISOString;
      this.paginationConfig.endingBefore = workflowTableFilterEvent.data?.endingBeforeISOString;
    }
    this.resetLimitOffset();
    this.findWorkflowExecutionActivities();
  }
  resetLimitOffset(): void  {
    this.paginationConfig.offset = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
      this.paginationConfig.limit = this.paginator.pageSize;
    } else {
      this.paginationConfig.limit = this.defaultLimit;
    }
  }
  findWorkflowExecutionActivities(): void {
    this.expandedRow = undefined;
    this.actions = [];
    this._wms.findWorkflowExecutionActivities(this.workflow.iri, this.paginationConfig)
      .subscribe((activities: PaginatedResponse<WorkflowExecutionActivityDisplayI[]>) => {
        this.totalCount = activities.totalCount;
        this.dataSource.data = activities.page;
    });
  }
  onPaginatorPage(pageEvent: PageEvent): void {
    this.paginationConfig.limit = pageEvent.pageSize;
    this.paginationConfig.offset = pageEvent.pageIndex * pageEvent.pageSize;
    this.findWorkflowExecutionActivities();
  }
  /**
   * Toggles the expansion of a row in the execution history table.
   *  
   * @param {PointerEvent} event The Event from the button click
   * @param {WorkflowExecutionActivityDisplayI} activity The table row that was clicked
   */
  toggleRow(event: PointerEvent, activity: WorkflowExecutionActivityDisplayI): void {
    event.stopPropagation();
    this.expandedRow = this.expandedRow === activity ? undefined : activity;
    this.actions = [];
    if (this.expandedRow) {
      this._wms.getActionExecutions(this.workflow.iri, activity.executionId, true).subscribe(actions => {
        this.actions = actions;
      });
    }
  }
  /**
   * Opens the LogPreview page for the provided activity.
   * 
   * @param {PointerEvent} event The Event from the button click 
   * @param {WorkflowExecutionActivityDisplayI} activity The table row that was clicked 
   */
  viewLogs(event: PointerEvent, activity: WorkflowExecutionActivityDisplayI): void {
    event.stopPropagation();
    this.wss.selectedActivity = activity;
    this.wss.selectedWorkflowRdf = this.workflowRdf;
  }

  /**
   * Determines whether the page of results should be refetched when a new activity is started. If the table is filtered
   * to the started status, refetch. Otherwise, if one of the new activities is within the time range filter, refetch.
   * 
   * @param {JSONLDObject[]} newActivities The list of newly started activities
   * @returns {Observable} An Observable with a boolean determining whether to refetch the page of results
   */
  private _shouldRefetchBecauseNewActivities(newActivities: JSONLDObject[]): Observable<boolean> {
    // If the status filter is set to started, refetch the page
    if (this.paginationConfig.status && this.paginationConfig.status === 'started') {
      return of(true);
    } else {
      return of(some(newActivities, activity => this._activityWithinTimeRangeFilter(activity)));
    }
  }

  /**
   * Determines whether the page of results should be refetched when an activity has ended. If the table is filtered to 
   * the started status, refetch. If the table is filtered to a different status, collects the latest details of the
   * ended activities and checks if any match the current status filter. Otherwise, if one of the ended activities is
   * within the time range filter, refetch.
   * 
   * @param {JSONLDObject[]} endedActivities The list of recently ended activities
   * @returns {Observable} An Observable with a boolean determining whether to refetch the page of results
   */
  private _shouldRefetchBecauseEndedActivities(endedActivities: JSONLDObject[]): Observable<boolean> {
    // If status filter is set, need to fetch the final status of the ended activities
    if (this.paginationConfig.status) {
      // If status filter is started, refetch because activity that just finished should no longer be counted
      if (this.paginationConfig.status === 'started') {
        return of(true);
      }
      // Otherwise, we need to determine if the ended activity status matches the status filter
      return forkJoin(endedActivities.map(activity => this._wms
        .getWorkflowExecutionActivity(this.workflow.iri, activity['@id'], true))
      ).pipe(map(responses => {
        return some(responses, activity => {
          const succeeded = getPropertyValue(activity, `${WORKFLOWS}succeeded`);
          return (this.paginationConfig.status === 'success' && succeeded === 'true')
            || (this.paginationConfig.status === 'failure' && succeeded === 'false');
        });
      }));
    // Otherwise can just check the time range filter
    } else {
      return of(some(endedActivities, activity => this._activityWithinTimeRangeFilter(activity)));
    }
  }

  /**
   * Determines whether the provided WorkflowExecutionActivity start time is within the bounds of the current time range
   * filter on the pagination configuration. Accounts for an endingBefore filter not being set.
   * 
   * @param {JSONLDObject} activity The JSON-LD of a WorkflowExecutionActivity
   * @returns {boolean} Whether the activity start time fits within the time range filter bounds
   */
  private _activityWithinTimeRangeFilter(activity: JSONLDObject): boolean {
    const startTime = new Date(getPropertyValue(activity, `${PROV}startedAtTime`));
    // If the time range filter is set (which is should be by this point in the logic)
    if (this.paginationConfig.startingAfter) {
      const filterStartTime = new Date(this.paginationConfig.startingAfter);
      // If the activity started after the filter start time and, if it's set, before the filter end time
      return startTime >= filterStartTime 
        && (!this.paginationConfig.endingBefore || startTime <= new Date(this.paginationConfig.endingBefore));
    }
    return false;
  }
}
