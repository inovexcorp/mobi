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
import { Injectable } from '@angular/core';
//RxJs
import { Observable, merge, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
//Local
import { WorkflowsManagerService } from './workflows-manager.service';
import { WorkflowDataRow } from '../models/workflow-record-table';
import { WorkflowPaginatedConfig } from '../models/workflow-paginated-config.interface';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { PROV, WORKFLOWS } from '../../prefixes';
import { UserManagerService } from '../../shared/services/userManager.service';
import {
  condenseCommitId,
  getPropertyId,
  getPropertyValue,
  getStatus,
  orNone,
  runningTime,
  toFormattedDateString
} from '../../shared/utility';
import { LoginManagerService } from '../../shared/services/loginManager.service';
import { EventWithPayload } from '../../shared/models/eventWithPayload.interface';
import { WorkflowSchema } from '../models/workflow-record.interface';
import { WorkflowStatus } from '../models/workflow-status.type';
import { WorkflowExecutionActivityDisplayI } from '../models/workflow-execution-activity.interface';
import { PaginatedResponse } from '../models/paginated-response.interface';

@Injectable({
  providedIn: 'root'
})
export class WorkflowsStateService {
  /**
  *  Define the string value for a workflow that hasn't been run.
  *  never-run is the status label for workflows that haven't started yet
  * @private
  */
  private readonly neverRun = 'never-run';
  /**
   * Search Text for workflow records landing page
   */
  landingPageSearchText = '';

  /**
   * Represents the workflow that is selected
   */
  selectedRecord: WorkflowSchema = undefined;
  /**
   * Represents the workflow activity logs should be displayed for in {@link workflows.LogsPreviewComponent}
   */
  selectedActivity: WorkflowExecutionActivityDisplayI = undefined;
  /**
   * The IRI of the selected log file to view in {@link workflows.LogsPreviewComponent}
   */
  selectedLogFileIRI = '';
  /**
   * The RDF of the current Workflow definition related to the selected Workflow Record. Needed to populate
   * {@link workflows.LogsPreviewComponent}
   */
  selectedWorkflowRdf: JSONLDObject[] = [];

  constructor(private wms: WorkflowsManagerService, 
    private _um: UserManagerService,
    private loginManagerService: LoginManagerService) { 
      this.subscribeToLoginManagerServiceEvents();
  }

  /**
   * Subscribes to {@link LoginManagerService} actions observable for events. 
   * For example it handles event when user logouts.
   * 
   * @returns void
   */
  subscribeToLoginManagerServiceEvents(): void {
    merge(
      this.loginManagerService.loginManagerAction$,
    ).pipe(
      switchMap((event: EventWithPayload) => {
        const eventType = event?.eventType;
        const payload = event?.payload;
        if (eventType && payload){
          const ob = this._handleEventWithPayload(eventType);
          if (ob) {
            return ob;
          }
          return of(false);
        } else {
          console.error('Event type and payload is required');
          return of(false);
        }
      })
    ).subscribe();
  }
  _handleEventWithPayload(eventType: string): Observable<boolean> {
    if (eventType === 'LOGOUT') {
      this.reset();
      return of(false);
    } else {
      console.warn('Event type is not valid');
      return of(false);
    }
  }
  /**
   * Resets all state variables
   */
  reset(): void {
    this.selectedRecord = undefined;
    this.landingPageSearchText = '';
    this.selectedActivity = undefined;
    this.selectedLogFileIRI = '';
    this.selectedWorkflowRdf = [];
  }
  /**
   * Calls the appropriate {@link ./WorkflowsManagerService} method to retrieve results of a Workflows query.
   * @param paginatedConfig - Configuration for pagination (e.g., page number, page size, sorting).
   * @returns An observable that emits an http response containing an array of `WorkflowSchema` objects.
   */
  getResults(paginationConfig: WorkflowPaginatedConfig): Observable<PaginatedResponse<WorkflowDataRow[]>> {
    return this.wms.getWorkflowsRecords(paginationConfig)
      .pipe(
        map((response: PaginatedResponse<WorkflowSchema[]>): PaginatedResponse<WorkflowDataRow[]> => {
          return {
            totalCount: response.totalCount,
            page: response.page.map(record => ({
              record,
              statusDisplay: getStatus(record.status, this.neverRun),
              executorDisplay: orNone(record.executorUsername),
              executionIdDisplay: orNone(record.executionId, condenseCommitId),
              startTimeDisplay: toFormattedDateString(record.startTime),
              runningTimeDisplay: runningTime(record.startTime, record.endTime),
            }))
          };
        })
      );
  }
  /**
  * Updates the metadata on the provided {@link WorkflowDataRow} using the details in the provided 
  * WorkflowExecutionActivity JSON-LD. Assumes the provided Activity is related to the represented WorkflowRecord and
  * the latest activity for that workflow.
  * 
  * @param {WorkflowDataRow} workflow A data row representing a WorkflowRecord to be updated
  * @param {JSONLDObject} activity The JSON-LD of a WorkflowExecutionActivity
  */
  updateWorkflowWithActivity(workflow: WorkflowDataRow, activity: JSONLDObject): void {
    const succeeded = getPropertyValue(activity, `${WORKFLOWS}succeeded`);
    const startedAtTime = new Date(getPropertyValue(activity, `${PROV}startedAtTime`));
    const endedAtTimeStr = getPropertyValue(activity, `${PROV}endedAtTime`);
    const endedAtTime = endedAtTimeStr ? new Date(endedAtTimeStr) : undefined;
    const executorId = getPropertyId(activity, `${PROV}wasAssociatedWith`);
    const executor = this._um.users.find(user => user.iri === executorId);
    // Update underlying record data
    workflow.record.status = endedAtTime ? succeeded === 'true' ? 'success' : 'failure' : 'started';
    workflow.record.executionId = activity['@id'];
    workflow.record.executorIri = executorId;
    workflow.record.executorUsername = executor.username;
    workflow.record.executorDisplayName = executor.displayName;
    workflow.record.startTime = startedAtTime;
    workflow.record.endTime = endedAtTime;
    // Update display data
    workflow.executorDisplay = executor.displayName;
    workflow.executionIdDisplay = condenseCommitId(activity['@id']);
    workflow.statusDisplay = endedAtTime ? succeeded === 'true' ? 'success' : 'failure' : 'started';
    workflow.startTimeDisplay = toFormattedDateString(startedAtTime);
    workflow.runningTimeDisplay = runningTime(startedAtTime, endedAtTime);
  }
  /**
   * Returns the appropriate CSS class for a status pill based on the given WorkflowStatus.
   *
   * @param {string} workflowStatus - The workflow element to determine the CSS class for.
   *                                 Valid values are 'failure', 'started', 'success', or any other value.
   * @return {string} - The CSS class corresponding to the given workflow element.
   *                   The possible returned values are:
   *                   - 'bg-danger text-white' for 'failure'
   *                   - 'bg-info text-white' for 'started'
   *                   - 'bg-success text-white' for 'success'
   *                   - 'bg-light text-dark' for any other value
   */
  getStatusClass(workflowStatus: WorkflowStatus): string {
    switch (workflowStatus) {
      case 'failure':
        return 'bg-danger text-white';
      case 'started':
        return 'bg-info text-white';
      case 'success':
        return 'bg-success text-white';
      default:
        return 'bg-light text-dark';
    }
  }
}