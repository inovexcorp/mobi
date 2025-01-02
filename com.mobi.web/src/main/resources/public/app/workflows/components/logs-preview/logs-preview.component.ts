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
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { WorkflowsStateService } from '../../services/workflows-state.service';
import { WorkflowExecutionActivityDisplayI } from '../../models/workflow-execution-activity.interface';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { getEntityName, getPropertyId, getPropertyIds, getPropertyValue } from '../../../shared/utility';
import { WORKFLOWLOGS, WORKFLOWS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { WorkflowStatus } from '../../models/workflow-status.type';
import { sortBy } from 'lodash';

interface LogOption {
  iri: string,
  label: string
}

interface LogGroup {
  groupLabel: string,
  groupStatus: WorkflowStatus,
  logs: LogOption[]
}

/**
 * @class workflows.LogsPreviewComponent
 * 
 * A component that creates a full page for viewing the logs of the provided WorkflowExecutionActivity. Contains a
 * header with some details about the Activity, a mat-select for choosing which log file to view, a button to download
 * the logs, and a codemirror that is populated with the contents of the selected log.
 * 
 * @param {string} workflowRecordIRI The IRI of the WorkflowRecord that the Activity belongs to
 * @param {WorkflowExecutionActivityDisplayI} activity The WorkflowExecutionActivity to display logs from
 * @param {JSONLDObject[]} workflowRdf The JSON-LD of the current Workflow definition within the Record. Used to display
 *    action names
 */
@Component({
  selector: 'app-logs-preview',
  templateUrl: './logs-preview.component.html',
  styleUrls: ['./logs-preview.component.scss']
})
export class LogsPreviewComponent implements OnInit, OnDestroy {
  @Input() workflowRecordIRI: string;
  @Input() activity: WorkflowExecutionActivityDisplayI;
  @Input() workflowRdf: JSONLDObject[];

  @ViewChild('logViewer', { static: true }) logViewer: ElementRef;

  logControl = new FormControl('');
  options = {
    mode: 'text/plain',
    lineNumbers: true,
    lineWrapping: true,
    readOnly: true
  };
  preview = '';
  errorMessage = '';
  limitedResults = false;
  activityLog: LogOption = undefined;
  logFiles: LogGroup[] = [];

  valueChangesSubscription: Subscription;

  constructor(public wss: WorkflowsStateService, private _wm: WorkflowsManagerService, private _spinnerSvc: ProgressSpinnerService) { }

  ngOnInit(): void {
    // Handle updates to selected log file
    this.valueChangesSubscription = this.logControl.valueChanges.subscribe(newValue => this.handleLogFileChange(newValue));

    // Fetch details to populate view
    forkJoin([
      this._wm.getWorkflowExecutionActivity(this.workflowRecordIRI, this.activity.executionId),
      this._wm.getActionExecutions(this.workflowRecordIRI, this.activity.executionId),
    ]).subscribe(responses => {
      const executionLogsIRI = getPropertyId(responses[0], `${WORKFLOWS}logs`);
      this.activityLog = { iri: executionLogsIRI, label: this.getFileName(executionLogsIRI) };
      this.logFiles = sortBy(responses[1].map(actionExec => {
        const succeeded = getPropertyValue(actionExec, `${WORKFLOWS}succeeded`);
        const action = this.workflowRdf.find(obj => obj['@id'] === getPropertyId(actionExec, `${WORKFLOWS}aboutAction`));
        return {
          groupLabel: action ? getEntityName(action) : '(Action Not Found)',
          groupStatus: succeeded ? succeeded === 'true' ? 'success' : 'failure' : 'never_run',
          logs: [...getPropertyIds(actionExec, `${WORKFLOWS}logs`).values()].map(iri => ({ iri, label: this.getFileName(iri) }))
        };
      }), group => group.groupLabel);
      this.logControl.setValue(this.wss.selectedLogFileIRI);
    }, (error: RESTError) => {
      this.errorMessage = error.errorMessage;
    });
  }

  ngOnDestroy(): void {
    if (this.valueChangesSubscription) {
      this.valueChangesSubscription.unsubscribe();
    }
  }

  handleLogFileChange(newValue: string | null): void {
    this.wss.selectedLogFileIRI = newValue;
    this.preview = '';
    this.errorMessage = '';
    this.limitedResults = false;
    if (newValue) {
      this._spinnerSvc.startLoadingForComponent(this.logViewer);
      this._wm.getSpecificLog(this.workflowRecordIRI, this.activity.executionId, newValue, true)
        .pipe(finalize(() => this._spinnerSvc.finishLoadingForComponent(this.logViewer)))
        .subscribe(response => {
          this.limitedResults = !!response.headers.get('X-Total-Size');
          this.preview = response.body;
        }, (error: RESTError) => {
          this.errorMessage = error.errorMessage;
        });
    }
  }

  goBack(): void {
    this.wss.selectedActivity = undefined;
    this.wss.selectedWorkflowRdf = [];
    this.wss.selectedLogFileIRI = '';
  }

  getFileName(iri: string): string {
    return iri.replace(WORKFLOWLOGS, '');
  }

  getStatusCircleClass(status: WorkflowStatus): string {
    switch (status) {
      case 'failure':
        return 'badge-danger';
      case 'started':
        return 'badge-info';
      case 'success':
        return 'badge-success';
      default:
        return 'badge-light';
    }
  }
  
  getStatusIcon(status: WorkflowStatus): string {
    switch (status) {
      case 'failure':
        return 'priority_high';
      case 'started':
        return 'sync';
      case 'success':
        return 'done';
      default:
        return '';
    }
  }

  downloadLogs(): void {
    this._wm.downloadSpecificLog(this.workflowRecordIRI, this.activity.executionId, this.logControl.value);
  }
}
