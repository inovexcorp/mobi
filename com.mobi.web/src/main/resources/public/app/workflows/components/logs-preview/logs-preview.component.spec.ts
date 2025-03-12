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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

import { of, throwError } from 'rxjs';
import { MockComponent, MockProvider } from 'ng-mocks';
import { CodemirrorComponent } from '@ctrl/ngx-codemirror';

import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { WarningMessageComponent } from '../../../shared/components/warningMessage/warningMessage.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { PROV, WORKFLOWLOGS, WORKFLOWS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { LogsPreviewComponent } from './logs-preview.component';

describe('LogsPreviewComponent', () => {
  let component: LogsPreviewComponent;
  let fixture: ComponentFixture<LogsPreviewComponent>;
  let element: DebugElement;
  let workflowsManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

  const error: RESTError = {
    error: '',
    errorDetails: [],
    errorMessage: 'Error Message'
  };
  const executionLogFileName = 'execution.log';
  const executionLogsIRI = `${WORKFLOWLOGS}${executionLogFileName}`;
  const date = new Date();
  const activity: JSONLDObject = {
    '@id': 'urn:activity',
    '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
    [`${PROV}startedAtTime`]: [{ '@value': date.toISOString() }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'false' }],
    [`${WORKFLOWS}logs`]: [{ '@id': executionLogsIRI }],
  };
  const succeededActionExec: JSONLDObject = {
    '@id': 'succeeded',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'succeededAction' }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'true' }],
    [`${WORKFLOWS}startedAt`]: [{ '@value': date.toISOString() }],
    [`${WORKFLOWS}endedAt`]: [{ '@value': date.toISOString() }],
    [`${WORKFLOWS}logs`]: [{ '@id': `${WORKFLOWLOGS}log1` }]
  };
  const failedActionExec: JSONLDObject = {
    '@id': 'failed',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'failedAction' }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'false' }],
    [`${WORKFLOWS}startedAt`]: [{ '@value': date.toISOString() }],
    [`${WORKFLOWS}endedAt`]: [{ '@value': date.toISOString() }],
    [`${WORKFLOWS}logs`]: [{ '@id': `${WORKFLOWLOGS}log2` }, { '@id': `${WORKFLOWLOGS}log3` }]
  };
  const skippedActionExec: JSONLDObject = {
    '@id': 'skipped',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'skippedAction' }],
  };
  const missingActionExec: JSONLDObject = {
    '@id': 'missing',
    '@type': [`${WORKFLOWS}ActionExecution`],
    [`${WORKFLOWS}aboutAction`]: [{ '@id': 'missingAction' }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'true' }],
    [`${WORKFLOWS}startedAt`]: [{ '@value': date.toISOString() }],
    [`${WORKFLOWS}endedAt`]: [{ '@value': date.toISOString() }],
    [`${WORKFLOWS}logs`]: [{ '@id': `${WORKFLOWLOGS}log4` }]
  };
  const workflow: JSONLDObject[] = [
    { '@id': 'workflow', '@type': [`${WORKFLOWS}Workflow`] },
    { '@id': 'succeededAction', '@type': [`${WORKFLOWS}Action`] },
    { '@id': 'failedAction', '@type': [`${WORKFLOWS}Action`] },
    { '@id': 'skippedAction', '@type': [`${WORKFLOWS}Action`] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
      ],
      declarations: [
        LogsPreviewComponent,
        MockComponent(WarningMessageComponent),
        MockComponent(ErrorDisplayComponent),
        MockComponent(CodemirrorComponent),
      ],
      providers: [
        MockProvider(ProgressSpinnerService),
        MockProvider(WorkflowsManagerService),
        MockProvider(WorkflowsStateService),
      ]
    })
    .compileComponents();

    progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
    workflowsManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    workflowsManagerStub.getWorkflowExecutionActivity.and.returnValue(of(activity));
    workflowsManagerStub.getActionExecutions.and.returnValue(of([succeededActionExec, failedActionExec, skippedActionExec, missingActionExec]));
    workflowsManagerStub.getSpecificLog.and.returnValue(of(new HttpResponse<string>({ body: 'preview' })));
    workflowsStateStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    fixture = TestBed.createComponent(LogsPreviewComponent);
    component = fixture.componentInstance;
    component.workflowRdf = workflow;
    component.workflowRecordIRI = workflow[0]['@id'];
    component.activity = {
      executionId: activity['@id'],
      executionIdLabel: 'activity',
      executorIri: 'urn:batman',
      executorDisplayName: 'batman',
      executorUsername: 'batman',
      startTime: date,
      startTimeLabel: date.toISOString(),
      endTime: date,
      runningTimeLabel: 'too long',
      succeeded: false,
      status: 'failure',
      isLatestActivity: false
    };
    element = fixture.debugElement;
  });

  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
    workflowsStateStub = null;
    workflowsManagerStub = null;
  });

  describe('should initialize correctly', () => {
    beforeEach(() => {
      spyOn(component, 'getFileName').and.returnValue('filename');
      workflowsStateStub.selectedLogFileIRI = executionLogsIRI;
    });
    it('when everything succeeds', () => {
      fixture.detectChanges();
      expect(workflowsManagerStub.getWorkflowExecutionActivity).toHaveBeenCalledWith(component.workflowRecordIRI, activity['@id']);
      expect(workflowsManagerStub.getActionExecutions).toHaveBeenCalledWith(component.workflowRecordIRI, activity['@id']);
      expect(component.activityLog).toEqual({ iri: executionLogsIRI, label: 'filename' });
      expect(component.logFiles).toEqual([
        { groupLabel: '(Action Not Found)', groupStatus: 'success', logs: [{ iri: `${WORKFLOWLOGS}log4`, label: 'filename' }] },
        { groupLabel: 'Failed Action', groupStatus: 'failure', logs: [{ iri: `${WORKFLOWLOGS}log2`, label: 'filename' }, { iri: `${WORKFLOWLOGS}log3`, label: 'filename' }] },
        { groupLabel: 'Skipped Action', groupStatus: 'never_run', logs: [] },
        { groupLabel: 'Succeeded Action', groupStatus: 'success', logs: [{ iri: `${WORKFLOWLOGS}log1`, label: 'filename' }] },
      ]);
      expect(component.logControl.value).toEqual(executionLogsIRI);
      expect(component.errorMessage).toEqual('');
    });
    it('when an error occurs', () => {
      workflowsManagerStub.getWorkflowExecutionActivity.and.returnValue(throwError(error));
      fixture.detectChanges();
      expect(workflowsManagerStub.getWorkflowExecutionActivity).toHaveBeenCalledWith(component.workflowRecordIRI, activity['@id']);
      expect(workflowsManagerStub.getActionExecutions).toHaveBeenCalledWith(component.workflowRecordIRI, activity['@id']);
      expect(component.activityLog).toBeUndefined();
      expect(component.logFiles).toEqual([]);
      expect(component.logControl.value).toEqual('');
      expect(component.errorMessage).toEqual(error.errorMessage);
    });
  });
  describe('controller methods', () => {
    describe('should handle updates to the selected log file', () => {
      beforeEach(() => {
        component.preview = 'test';
        component.errorMessage = 'test';
        component.limitedResults = true;
      });
      describe('if there is a value provided', () => {
        it('unless an error occurs', fakeAsync(() => {
          workflowsManagerStub.getSpecificLog.and.returnValue(throwError(error));
          component.handleLogFileChange(`${WORKFLOWLOGS}log1`);
          tick();
          expect(workflowsStateStub.selectedLogFileIRI).toEqual(`${WORKFLOWLOGS}log1`);
          expect(component.limitedResults).toBeFalse();
          expect(component.preview).toEqual('');
          expect(component.errorMessage).toEqual(error.errorMessage);
          expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.logViewer);
          expect(workflowsManagerStub.getSpecificLog).toHaveBeenCalledWith(component.workflowRecordIRI, component.activity.executionId, `${WORKFLOWLOGS}log1`, true);
          expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.logViewer);
        }));
        it('successfully', fakeAsync(() => {
          component.handleLogFileChange(`${WORKFLOWLOGS}log1`);
          tick();
          expect(workflowsStateStub.selectedLogFileIRI).toEqual(`${WORKFLOWLOGS}log1`);
          expect(component.limitedResults).toBeFalse();
          expect(component.preview).toEqual('preview');
          expect(component.errorMessage).toEqual('');
          expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.logViewer);
          expect(workflowsManagerStub.getSpecificLog).toHaveBeenCalledWith(component.workflowRecordIRI, component.activity.executionId, `${WORKFLOWLOGS}log1`, true);
          expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.logViewer);
        }));
        it('and it is limited', fakeAsync(() => {
          workflowsManagerStub.getSpecificLog.and.returnValue(of(new HttpResponse<string>({ body: 'preview', headers: new HttpHeaders({'X-Total-Size': '10000000'}) })));
          component.handleLogFileChange(`${WORKFLOWLOGS}log1`);
          tick();
          expect(workflowsStateStub.selectedLogFileIRI).toEqual(`${WORKFLOWLOGS}log1`);
          expect(component.limitedResults).toBeTrue();
          expect(component.preview).toEqual('preview');
          expect(component.errorMessage).toEqual('');
          expect(progressSpinnerStub.startLoadingForComponent).toHaveBeenCalledWith(component.logViewer);
          expect(workflowsManagerStub.getSpecificLog).toHaveBeenCalledWith(component.workflowRecordIRI, component.activity.executionId, `${WORKFLOWLOGS}log1`, true);
          expect(progressSpinnerStub.finishLoadingForComponent).toHaveBeenCalledWith(component.logViewer);
        }));
      });
      it('if no value is provided', () => {
        component.handleLogFileChange(null);
        expect(workflowsStateStub.selectedLogFileIRI).toBeNull();
        expect(component.limitedResults).toBeFalse();
        expect(component.preview).toEqual('');
        expect(component.errorMessage).toEqual('');
        expect(progressSpinnerStub.startLoadingForComponent).not.toHaveBeenCalled();
        expect(workflowsManagerStub.getSpecificLog).not.toHaveBeenCalled();
        expect(progressSpinnerStub.finishLoadingForComponent).not.toHaveBeenCalled();
      });
    });
    it('should go back to the individual workflow page', () => {
      workflowsStateStub.selectedActivity = component.activity;
      workflowsStateStub.selectedWorkflowRdf = component.workflowRdf;
      workflowsStateStub.selectedLogFileIRI = `${WORKFLOWLOGS}log1`;
      component.goBack();
      expect(workflowsStateStub.selectedActivity).toBeUndefined();
      expect(workflowsStateStub.selectedWorkflowRdf).toEqual([]);
      expect(workflowsStateStub.selectedLogFileIRI).toEqual('');
    });
    it('should get a file name from a log file IRI', () => {
      expect(component.getFileName(`${WORKFLOWLOGS}log-name-that-is-very_long.log`)).toEqual('log-name-that-is-very_long.log');
    });
    it('should get the correct classes for a status circle', () => {
      expect(component.getStatusCircleClass('failure')).toEqual('text-danger');
      expect(component.getStatusCircleClass('success')).toEqual('text-success');
      expect(component.getStatusCircleClass('never_run')).toEqual('text-light');
      expect(component.getStatusCircleClass('started')).toEqual('text-info');
    });
    it('should get the correct icon name for a status circle', () => {
      expect(component.getStatusIcon('failure')).toEqual('priority_high');
      expect(component.getStatusIcon('success')).toEqual('done');
      expect(component.getStatusIcon('never_run')).toEqual('');
      expect(component.getStatusIcon('started')).toEqual('sync');
    });
    it('should download the selected logs', () => {
      component.logControl.setValue(`${WORKFLOWLOGS}log1`);
      component.downloadLogs();
      expect(workflowsManagerStub.downloadSpecificLog).toHaveBeenCalledWith(component.workflowRecordIRI, component.activity.executionId, `${WORKFLOWLOGS}log1`);
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.logs-preview')).length).toBe(1);
      expect(element.queryAll(By.css('.back-sidebar')).length).toBe(1);
      expect(element.queryAll(By.css('.logs-preview-main')).length).toBe(1);
      expect(element.queryAll(By.css('.log-control')).length).toBe(1);
      expect(element.queryAll(By.css('.log-header')).length).toBe(1);
      expect(element.queryAll(By.css('.log-viewer')).length).toBe(1);
    });
    it('with activity details', () => {
      const h1 = element.query(By.css('h1'));
      expect(h1).toBeTruthy();
      expect(h1.nativeElement.innerHTML).toContain(component.activity.executionIdLabel);
      const badge = element.query(By.css('.badge'));
      expect(badge).toBeTruthy();
      expect(badge.nativeElement.innerHTML).toContain(component.activity.status);
      const para = element.query(By.css('.log-header p'));
      expect(para).toBeTruthy();
      expect(para.nativeElement.innerText).toContain(`Executed by ${component.activity.executorDisplayName} at ${component.activity.startTimeLabel} for ${component.activity.runningTimeLabel}`);
    });
    it('with a select for log options', () => {
      expect(element.queryAll(By.css('mat-form-field')).length).toBe(1);
      expect(element.queryAll(By.css('mat-select')).length).toBe(1);
      const matSelect = element.query(By.css('.mat-select-trigger')).nativeElement;
      matSelect.click();
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-option')).length).toEqual(5);
      expect(element.queryAll(By.css('.mat-option')).length).toEqual(5);
    });
    it('with a button to download the logs', () => {
      const button = element.query(By.css('.log-header button.mat-icon-button'));
      expect(button).toBeTruthy();
      expect(button.nativeElement.disabled).toBeTrue();

      component.logControl.setValue(`${WORKFLOWLOGS}log1`);
      fixture.detectChanges();
      expect(button.nativeElement.disabled).toBeFalse();
    });
    it('if a log preview has been pulled', () => {
      expect(element.queryAll(By.css('warning-message')).length).toBe(1);
      expect(element.queryAll(By.css('ngx-codemirror')).length).toBe(0);
      
      component.preview = 'test';
      fixture.detectChanges();
      expect(element.queryAll(By.css('warning-message')).length).toBe(0);
      expect(element.queryAll(By.css('ngx-codemirror')).length).toBe(1);
    });
    it('if the results are limited', () => {
      expect(element.queryAll(By.css('warning-message')).length).toBe(1);
      
      component.limitedResults = true;
      fixture.detectChanges();
      expect(element.queryAll(By.css('warning-message')).length).toBe(2);
    });
    it('if an error has occurred', () => {
      expect(element.queryAll(By.css('error-display')).length).toBe(0);
      
      component.errorMessage = error.errorMessage;
      fixture.detectChanges();
      expect(element.queryAll(By.css('error-display')).length).toBe(1);
    });
  });
});
