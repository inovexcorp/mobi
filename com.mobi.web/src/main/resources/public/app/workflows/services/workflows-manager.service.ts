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
//Angular
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
//Lodash
import { get, has, isObject } from 'lodash';
//RxJs
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
//Local
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { PaginatedResponse } from '../models/paginated-response.interface';
import { ProgressSpinnerService } from '../../shared/components/progress-spinner/services/progressSpinner.service';
import { REST_PREFIX } from '../../constants';
import { SseService } from '../../shared/services/sse.service';
import { WorkflowExecutionActivityDisplayI } from '../models/workflow-execution-activity.interface';
import { WorkflowExecutionActivityI } from '../models/workflow-execution-activity.interface';
import { WorkflowPaginatedConfig } from '../models/workflow-paginated-config.interface';
import { WorkflowSchema } from '../models/workflow-record.interface';
import { condenseCommitId, handleErrorObject, paginatedConfigToHttpParams, runningTime, toFormattedDateString } from '../../shared/utility';
import { XACMLRequest } from '../../shared/models/XACMLRequest.interface';
import { PolicyManagerService } from '../../shared/services/policyManager.service';
import { CATALOG, WORKFLOWS } from '../../prefixes';
import { PolicyEnforcementService } from '../../shared/services/policyEnforcement.service';
import { CatalogManagerService } from '../../shared/services/catalogManager.service';
import { XACMLDecision } from '../../shared/models/XACMLDecision.interface';

/**
 * WorkflowsManagerService is an angular service class that is responsible for managing workflows.
 * It provides methods for retrieving workflow records and handling pagination.
 */
@Injectable({
  providedIn: 'root'
})
export class WorkflowsManagerService {
  /**
   * Define the URL for the workflows
   */
  readonly workflows_prefix = `${REST_PREFIX}workflows`;
  /**
   * The URL for workflow executions
   */
  readonly executions_prefix = `${REST_PREFIX}workflow-executions`;

  constructor(private _http: HttpClient, 
    private _spinnerSrv: ProgressSpinnerService, 
    private _polm: PolicyManagerService,
    private _pe: PolicyEnforcementService,
    private _sse: SseService, 
    private _zone: NgZone,
    public _cm: CatalogManagerService
  ) { }

  /**
   * Retrieves workflow records based on the provided pagination configuration.
   * @param paginatedConfig - Configuration for pagination (e.g., page number, page size, sorting).
   * @returns An observable that emits an http response containing an array of `WorkflowSchema` objects.
   */
  getWorkflowsRecords(paginatedConfig: WorkflowPaginatedConfig): Observable<PaginatedResponse<WorkflowSchema[]>> {
    // Convert paginated configuration to HTTP parameters
    let params = paginatedConfigToHttpParams(paginatedConfig);
    // Check if ascending sorting is specified
    if (has(paginatedConfig, 'sortOption')) {
      const sortOption = paginatedConfig.sortOption;
      params = params.set('ascending', sortOption.asc);
      if (sortOption.field !== undefined) {
        params = params.set('sort', sortOption.field);
      }
    }
    if (has(paginatedConfig, 'searchText')) {
      if (paginatedConfig.searchText) {
        params = params.set('searchText', paginatedConfig.searchText);
      }
    }
    if (has(paginatedConfig, 'status')) {
      if (paginatedConfig.status) {
        params = params.set('status', paginatedConfig.status);
      }
    }
    if (has(paginatedConfig, 'startingAfter')) {
      if (paginatedConfig.startingAfter) {
        params = params.set('startingAfter', paginatedConfig.startingAfter);
      }
    }
    if (has(paginatedConfig, 'endingBefore')) {
      if (paginatedConfig.endingBefore) {
        params = params.set('endingBefore', paginatedConfig.endingBefore);
      }
    }
    const request = this._http.get<WorkflowSchema[]>(this.workflows_prefix, {params, observe: 'response'})
        .pipe(
          catchError(handleErrorObject),
          switchMap((response: HttpResponse<WorkflowSchema[]>) => {
            const results = {
              totalCount: Number(response.headers.get('x-total-count')) || 0, 
              page: response.body
            };
            if (results.totalCount === 0) {
              return of(results);
            } else {
              // Get delete permissions for all workflows
              const deletePermissions$ = this.checkWorkflowDeletePermissions(response.body);

              // Get master branch permissions for all workflows
              const masterPermissions$ = forkJoin(
                response.body.map(workflow => this.checkMasterBranchPermissions(workflow.master, workflow.iri))
              );

              // Combine both permission checks
              return forkJoin([deletePermissions$, masterPermissions$]).pipe(
                map(([deletePermissions, masterPermissions]) => {
                  const updatedRecords = response.body.map((workflow, index) => {
                    const deletePermissionForResource = deletePermissions.find(permission => permission[this._polm.resourceCategory] === workflow.iri);
                    const deleteDecision = deletePermissionForResource ? deletePermissionForResource.decision : 'Deny';
                    const masterPermission = masterPermissions[index];
                    const canModifyMasterBranch = masterPermission;

                    return {
                      ...workflow,
                      canModifyMasterBranch: canModifyMasterBranch,
                      canDeleteWorkflow: deleteDecision === 'Permit'
                    };
                  });
                  results.page = updatedRecords;
                  return results;
                }),
                catchError(handleErrorObject)
              );
            }
          })
        );
    // Track the request using the spinner service
    return this._spinnerSrv.track(request);
}

  /**
   * Checks the permissions for deleting workflows.
   * 
   * @param {WorkflowSchema[]} workflows Array of WorkflowSchema objects for which delete permissions need to be checked.
   * @returns {Observable<XACMLDecision[]>} An Observable that resolves with the permissions for deleting workflows
   */
  checkWorkflowDeletePermissions(workflows: WorkflowSchema[]): Observable<XACMLDecision[]> {
    const deleteRequest: XACMLRequest = {
      resourceId: workflows.map(record => record.iri),
      actionId: [this._polm.actionDelete]
    };
    return this._pe.evaluateMultiDecisionRequest(deleteRequest, true);
  }

  /**
   * Hits the GET /workflows/{workflowId}/executions/latest endpoint to get the latest execution activity for a specific
   * WorkflowRecord.
   * 
   * @param {string} workflowId The IRI of a WorkflowRecord
   * @param {boolean} [isTracked=false] Whether the request should be tracked by the
   *    {@link shared.ProgressSpinnerService} 
   * @returns {Observable} An Observable that either resolves with the full JSON-LD of the WorkflowExecutionActivity or
   *    rejects with an error message.
   */
  getLatestExecutionActivity(workflowId: string, isTracked = false): Observable<JSONLDObject> {
    const url = `${this._buildWorkflowUrl(workflowId)}executions/latest`;
    return this._spinnerSrv.trackedRequest(this._http.get<JSONLDObject>(url), isTracked)
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Hits the GET /workflows/{workflowId}/executions/{activityId} endpoint to retrieve the JSON-LD of a specific
   * execution activity attached to the specified WorkflowRecord.
   * 
   * @param {string} workflowId The IRI of a WorkflowRecord
   * @param {string} activityId The IRI of the WorkflowExecutionActivity to retrieve
   * @param {boolean} [isTracked=false] Whether the request should be tracked by the
   *    {@link shared.ProgressSpinnerService} 
   * @returns {Observable} An Observable that either resolves with the full JSON-LD of the WorkflowExecutionActivity or
   *    rejects with an error message.
   */
  getWorkflowExecutionActivity(workflowId: string, activityId: string, isTracked = false): Observable<JSONLDObject> {
    const url = this._buildWorkflowExecutionUrl(workflowId, activityId);
    return this._spinnerSrv.trackedRequest(this._http.get<JSONLDObject>(url), isTracked)
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Creates an Observable of an EventSource for the /workflow-executions SSE endpoint that returns events with a
   * JSON-LD array of the current execution WorkflowExecutionActivities
   * 
   * @returns {Observable} An Observable that emits a JSON-LD array of WorkflowExecutionActivity instances every time
   *    one starts or stops.
   */
  getExecutionActivitiesEvents(): Observable<JSONLDObject[]> {
    return new Observable(observer => {
      const source = this._sse.getEventSource(this.executions_prefix);
      source.onmessage = event => {
        this._zone.run(() => {
          observer.next(JSON.parse(event.data) as JSONLDObject[]);
        });
      };
      source.onerror = error => {
        this._zone.run(() => {
          observer.error(error);
        });
      };
      return () => source.close();
    });
  }

  /**
   * Retrieves Workflow Execution Activities based on the provided pagination configuration.
   * 
   * @param {string} workflowRecordIRI Workflow IRI to get Execution Activities for.
   * @param {WorkflowPaginatedConfig} paginatedConfig Configuration for pagination (eg. page number, page size, sorting)
   * @returns {Observable} An Observable that emits an PaginatedResponse containing an array objects representing
   *    individual WorkflowExecutionActivity instances
   */
  findWorkflowExecutionActivities(workflowRecordIRI: string, paginatedConfig: WorkflowPaginatedConfig): 
    Observable<PaginatedResponse<WorkflowExecutionActivityDisplayI[]>> {
    let params = paginatedConfigToHttpParams(paginatedConfig);
    const url = `${this._buildWorkflowUrl(workflowRecordIRI)}executions`;

    if (has(paginatedConfig, 'ascending')) {
      params = params.set('ascending', paginatedConfig.ascending);
    }
    if (has(paginatedConfig, 'status')) {
      if (paginatedConfig.status) {
        params = params.set('status', paginatedConfig.status);
      }
    }
    if (has(paginatedConfig, 'startingAfter')) {
      if (paginatedConfig.startingAfter) {
        params = params.set('startingAfter', paginatedConfig.startingAfter);
      }
    }
    if (has(paginatedConfig, 'endingBefore')) {
      if (paginatedConfig.endingBefore) {
        params = params.set('endingBefore', paginatedConfig.endingBefore);
      }
    }

    // WE could return without the variables assignment
    // request is not being used.
    const request = this._http.get<WorkflowExecutionActivityDisplayI[]>(url, {params, observe: 'response'})
        .pipe(
          catchError(handleErrorObject),
          map((response: HttpResponse<WorkflowExecutionActivityI[]>) => {
            const displayActivities = response.body.map((value: WorkflowExecutionActivityI): WorkflowExecutionActivityDisplayI => {
              return {...value,
                executionIdLabel: condenseCommitId(value.executionId),
                startTimeLabel: toFormattedDateString(value.startTime),
                runningTimeLabel: runningTime(value.startTime, value.endTime)
              };
            });
            const paginatedResponse: PaginatedResponse<WorkflowExecutionActivityDisplayI[]> = {
              totalCount: Number(response.headers.get('x-total-count')) || 0,
              page: displayActivities
            };
            return paginatedResponse;
          }),
        );
    return this._spinnerSrv.track(request);
  }

  /**
   * Hits the GET /workflows/{workflowId}/executions/{executionId}/actions endpoint to retrieve the list of
   * ActionExecution instances related to the WorkflowExecutionActivity with the provided IRI associated with the
   * WorkflowRecord with the provided IRI.
   * 
   * @param {string} workflowRecordIRI The IRI of a WorkflowRecord
   * @param {string} activityIRI The IRI of a WorkflowExecutionActivity
   * @param {boolean} [isTracked=false] Whether the request should be tracked by the
   *    {@link shared.ProgressSpinnerService} 
   * @returns {Observable} An Observable that emits the JSON-LD array of associated ActionExecutions
   */
  getActionExecutions(workflowRecordIRI: string, activityIRI: string, isTracked = false): Observable<JSONLDObject[]> {
    const url = `${this._buildWorkflowExecutionUrl(workflowRecordIRI, activityIRI)}/actions`;
    return this._spinnerSrv.trackedRequest(this._http.get<JSONLDObject[]>(url), isTracked)
      .pipe(catchError(handleErrorObject));
  }
  
  /**
   * Executes the provided workflow by sending a POST request to the server.
   *
   * @param {string} workflowRecordIRI - The workflow to be executed.
   * @returns {Observable<string>} - An observable string representing the execution status.
   */
  executeWorkflow(workflowRecordIRI: string): Observable<string> {
    const url = `${this._buildWorkflowUrl(workflowRecordIRI)}executions`;
    const request = this._http.post(url, null, { responseType: 'text' }).pipe(catchError(handleErrorObject));
    return this._spinnerSrv.track(request);
  }

  /**
  * Checks if the current user has permissions to modify the master branch for the provided workflow record.
  *
  * @param {string} masterBranchIri - The IRI of the master branch.
  * @param {string} workflowRecordIRI - The IRI of the workflow record.
  * @returns {Observable<boolean>} - An observable that emits a boolean indicating whether the user has permission.
  */
  checkMasterBranchPermissions(masterBranchIri: string, workflowRecordIRI: string): Observable<boolean> {
    const modifyMasterRequest: XACMLRequest = {
      resourceId: workflowRecordIRI,
      actionId: this._polm.actionModify,
      actionAttrs: { [`${CATALOG}branch`]: masterBranchIri }
    };

    return this._pe.evaluateRequest(modifyMasterRequest).pipe(
      map(currentPermissions => this._pe.permit === currentPermissions)
    );
  }

  /**
   * Update the workflow status of a record.
   *
   * @param {JSONLDObject[]} record The record to update.
   * @param {string} catalogId The catalog ID of the record.
   * @param {string} value The new value for the workflow status.
   * @returns {Observable<JSONLDObject[]>} An Observable that emits the updated record or an empty array.
   */
  updateWorkflowStatus(record: JSONLDObject[], catalogId: string, value: boolean): Observable<JSONLDObject[]> {
    const [workflow] = record;
    const activeStatusKey = `${WORKFLOWS}active`;
    if (isObject(workflow[activeStatusKey])) {
      workflow[`${WORKFLOWS}active`][0]['@value'] = value;
      return this._cm.updateRecord(workflow['@id'], catalogId, record);
    }
    return of([]);
  }

  /**
   * Updates the active status of a workflow.
   *
   * @param {string} workflowRecordIRI The IRI of the WorkflowRecord to update
   * @param {boolean} status Whether the WorkflowRecord should be active
   * @returns {Observable<any>} - An Observable that represents the result of the update request.
   */
  updateWorkflowActiveStatus(workflowRecordIRI: string, status: boolean): Observable<JSONLDObject[]> {
    const localCatalogId = get(this._cm.localCatalog, '@id', '');
    return this._cm.getRecord(workflowRecordIRI, localCatalogId).pipe(
      switchMap((data) => this.updateWorkflowStatus(data, localCatalogId, status))
    );
  }

  /**
   * Hits the GET /workflows/{workflowId}/executions/{executionId}/logs endpoint to retrieve a preview of the logs for
   * the WorkflowExecutionActivity with the provided IRI associated with the WorkflowRecord with the provided IRI. If
   * the full log contents are more than the backend limit, a 'X-Total-Size' header will be set with the total size in
   * bytes.
   * 
   * @param {string} workflowRecordIRI The IRI of the WorkflowRecord with the Activity
   * @param {string} activityIRI The IRI of the WorkflowExecutionActivity with the logs
   * @param {boolean} [isTracked=false] Whether the request should be tracked by the
   *    {@link shared.ProgressSpinnerService} 
   * @returns {Observable} An Observable that resolves with the full HTTP response containing the logs preview
   */
  getExecutionLogs(workflowRecordIRI: string, activityIRI: string, isTracked = false): Observable<HttpResponse<string>> {
    const url = `${this._buildWorkflowExecutionUrl(workflowRecordIRI, activityIRI)}/logs`;
    return this._spinnerSrv.trackedRequest(this._http.get(url, { observe: 'response', responseType: 'text' }), isTracked)
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Hits the GET /workflows/{workflowId}/executions/{executionId}/logs endpoint with download headers to retrieve the
   * log file for the WorkflowExecutionActivity with the provided IRI associated with the WorkflowRecord with the 
   * provided IRI.
   * 
   * @param {string} workflowRecordIRI The IRI of the WorkflowRecord with the Activity
   * @param {string} activityIRI The IRI of the WorkflowExecutionActivity with the logs
   */
  downloadExecutionLogs(workflowRecordIRI: string, activityIRI: string): void {
    const url = `${this._buildWorkflowExecutionUrl(workflowRecordIRI, activityIRI)}/logs`;
    window.open(url);
  }

  /**
   * Hits the GET /workflows/{workflowId}/executions/{executionId}/logs/{logId} endpoint to retrieve  a preview of the
   * specified log file from the WorkflowExecutionActivity or one of its ActionExecutions with the provided IRI
   * associated with the WorkflowRecord with the provided IRI. If the full log contents are more than the backend limit,
   * a 'X-Total-Size' header will be set with the total size in bytes.
   * 
   * @param {string} workflowRecordIRI The IRI of the WorkflowRecord with the Activity
   * @param {string} activityIRI The IRI of the WorkflowExecutionActivity with the logs
   * @param {string} logIRI The IRI of the log file to retrieve
   * @param {boolean} [isTracked=false] Whether the request should be tracked by the
   *    {@link shared.ProgressSpinnerService} 
   * @returns {Observable} An Observable that resolves with the full HTTP response containing the logs preview
   */
  getSpecificLog(workflowRecordIRI: string, activityIRI: string, logIRI: string, isTracked = false): Observable<HttpResponse<string>> {
    const url = `${this._buildWorkflowExecutionUrl(workflowRecordIRI, activityIRI)}/logs/${encodeURIComponent(logIRI)}`;
    return this._spinnerSrv.trackedRequest(this._http.get(url, { observe: 'response', responseType: 'text' }), isTracked)
      .pipe(catchError(handleErrorObject));
  }

  /**
   * Hits the GET /workflows/{workflowId}/executions/{executionId}/logs/{logId} endpoint with download headers to
   * retrieve the specified log file from the WorkflowExecutionActivity or one of its ActionExecutions with the provided
   * IRI associated with the WorkflowRecord with the provided IRI.
   * 
   * @param {string} workflowRecordIRI The IRI of the WorkflowRecord with the Activity
   * @param {string} activityIRI The IRI of the WorkflowExecutionActivity with the logs
   * @param {string} logIRI The IRI of the log file to retrieve
   */
  downloadSpecificLog(workflowRecordIRI: string, activityIRI: string, logIRI: string): void {
    const url = `${this._buildWorkflowExecutionUrl(workflowRecordIRI, activityIRI)}/logs/${encodeURIComponent(logIRI)}`;
    window.open(url);
  }

  private _buildWorkflowUrl(workflowRecordIRI: string): string {
    return `${this.workflows_prefix}/${encodeURIComponent(workflowRecordIRI)}/`;
  }

  private _buildWorkflowExecutionUrl(workflowRecordIRI: string, activityIRI: string): string {
    return `${this._buildWorkflowUrl(workflowRecordIRI)}executions/${encodeURIComponent(activityIRI)}`;
  }
}
