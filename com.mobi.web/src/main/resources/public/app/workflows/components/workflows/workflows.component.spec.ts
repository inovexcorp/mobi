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
// @angular
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
// Ng-Mocks
import { MockComponent, MockProvider } from 'ng-mocks';
// local
import { WorkflowRecordsComponent } from '../workflow-records/workflow-records.component';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { WorkflowRecordComponent } from '../workflow-record/workflow-record.component';
import { workflow_mocks } from '../../models/mock_data/workflow-mocks';
import { LogsPreviewComponent } from '../logs-preview/logs-preview.component';
import { WorkflowsComponent } from './workflows.component';

describe('WorkflowsComponent', () => {
  let component: WorkflowsComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<WorkflowsComponent>;
  let workflowServiceStub: jasmine.SpyObj<WorkflowsStateService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        WorkflowsComponent,
        MockComponent(WorkflowRecordsComponent),
        MockComponent(WorkflowRecordComponent),
        MockComponent(LogsPreviewComponent)
      ],
      providers: [
        MockProvider(WorkflowsStateService)
      ]
    })
    .compileComponents();

    workflowServiceStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    workflowServiceStub.selectedRecord = undefined;
    fixture = TestBed.createComponent(WorkflowsComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
    workflowServiceStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('.workflows-page')).length).toBe(1);
      expect(element.queryAll(By.css('.row')).length).toBe(1);
    });
    it('for workflow list component', function() {
      expect(element.queryAll(By.css('app-workflow-records')).length).toBe(1);
    });
    it('for workflow individual component', function() {
      workflowServiceStub.selectedRecord = workflow_mocks[0];
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-workflow-record')).length).toBe(1);
    });
    it('for log viewer component', function() {
      workflowServiceStub.selectedRecord = workflow_mocks[0];
      workflowServiceStub.selectedActivity = {
        executionId: '',
        executionIdLabel: '',
        executorIri: '',
        executorDisplayName: '',
        executorUsername: '',
        startTime: new Date,
        startTimeLabel: '',
        endTime: new Date(),
        runningTimeLabel: '',
        succeeded: true,
        status: 'success',
        isLatestActivity: false
      };
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-logs-preview')).length).toBe(1);
    });
  });
});
