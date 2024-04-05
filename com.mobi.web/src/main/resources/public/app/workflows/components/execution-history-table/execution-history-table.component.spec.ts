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
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement, SimpleChange } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import moment from 'moment';

import { WorkflowExecutionActivityDisplayI } from '../../models/workflow-execution-activity.interface';
import { WorkflowTableFilterComponent } from '../workflow-table-filter/workflow-table-filter.component';
import { WorkflowTableFilterEvent } from '../../models/workflow-table-filter-event.interface';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PROV, WORKFLOWS } from '../../../prefixes';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { workflow_mocks } from '../../models/mock_data/workflow-mocks';
import { ExecutionHistoryTableComponent } from './execution-history-table.component';

describe('ExecutionHistoryTableComponent', () => {
  let component: ExecutionHistoryTableComponent;
  let fixture: ComponentFixture<ExecutionHistoryTableComponent>;
  let element: DebugElement;
  let workflowsManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let activities: WorkflowExecutionActivityDisplayI[];

  const runningActivity: JSONLDObject = {
    '@id': 'urn:activity',
    '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
    [`${PROV}startedAtTime`]: [{ '@value': new Date().toISOString() }],
  };
  const successActivity: JSONLDObject = {
    '@id': 'urn:activity',
    '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
    [`${PROV}startedAtTime`]: [{ '@value': new Date().toISOString() }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'true' }]
  };
  const failedActivity: JSONLDObject = {
    '@id': 'urn:activity',
    '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
    [`${PROV}startedAtTime`]: [{ '@value': new Date().toISOString() }],
    [`${WORKFLOWS}succeeded`]: [{ '@value': 'false' }]
  };
  const actionExecutions: JSONLDObject[] = [
    { '@id': 'actionExec1', '@type': [`${WORKFLOWS}ActionExecution`] }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CommonModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatPaginatorModule,
      ],
      declarations: [ 
        ExecutionHistoryTableComponent,
        MockComponent(WorkflowTableFilterComponent),
        MockComponent(InfoMessageComponent)
      ],
      providers: [
        MockProvider(WorkflowsStateService),
        MockProvider(WorkflowsManagerService)
      ]
    })
    .compileComponents();

    activities = [
      {
        executionId: 'http://mobi.com/activities/executionId1',
        executorIri: 'http://mobi.com/users/admin',
        executorUsername: 'admin',
        executorDisplayName: 'admin',
        startTime: new Date('2024-02-15T14:42:38.657699-05:00'),
        endTime: new Date('2024-02-15T14:42:48.708031-05:00'),
        succeeded: true,
        status: 'success',
        isLatestActivity: true,
        executionIdLabel: 'exeId31',
        startTimeLabel: '2:42:38PM 2/15/2024',
        runningTimeLabel: '10.051 sec'
      },
      {
        executionId: 'http://mobi.com/activities/executionId2',
        executorIri: 'http://mobi.com/users/admin',
        executorUsername: 'admin',
        executorDisplayName: 'admin',
        startTime: new Date('2024-02-15T14:42:34.36645-05:00'),
        endTime: new Date('2024-02-15T14:42:44.456373-05:00'),
        succeeded: true,
        status: 'failure',
        isLatestActivity: false,
        executionIdLabel: 'exeId2',
        startTimeLabel: '2:42:34PM 2/15/2024',
        runningTimeLabel: '10.09 sec'
      },
      {
        executionId: 'http://mobi.com/activities/executionId3',
        executorIri: 'http://mobi.com/users/admin',
        executorUsername: 'admin',
        executorDisplayName: 'admin',
        startTime: new Date('2024-02-15T14:42:09.761747-05:00'),
        endTime: new Date('2024-02-15T14:42:19.990385-05:00'),
        succeeded: true,
        status: 'success',
        isLatestActivity: false,
        executionIdLabel: 'exeId3',
        startTimeLabel: '2:42:09PM 2/15/2024',
        runningTimeLabel: '10.229 sec'
      }
    ];
    workflowsStateStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    workflowsManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    workflowsManagerStub.findWorkflowExecutionActivities.and.returnValue(of({
      page: activities,
      totalCount: 3
    }));
    workflowsManagerStub.getActionExecutions.and.returnValue(of(actionExecutions));
    fixture = TestBed.createComponent(ExecutionHistoryTableComponent);
    component = fixture.componentInstance;
    component.workflow = workflow_mocks[0];
    component.executingActivities = [];
    element = fixture.debugElement;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
    workflowsStateStub = null;
    workflowsManagerStub = null;
    activities = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should handle updates to executing activities', () => {
    beforeEach(() => {
      spyOn(component, 'findWorkflowExecutionActivities');
    });
    it('unless it is the first change', () => {
      const change: SimpleChange = new SimpleChange([], [runningActivity], true);
      component.ngOnChanges({ 'executingActivities': change });
      expect(component.findWorkflowExecutionActivities).not.toHaveBeenCalled();
    });
    it('if there are no filters set', fakeAsync(() => {
      const change: SimpleChange = new SimpleChange([], [runningActivity], false);
      component.ngOnChanges({ 'executingActivities': change });
      tick();
      expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
    }));
    describe('if an activity was added', () => {
      it('and the list is filtered on started status', fakeAsync(() => {
        const change: SimpleChange = new SimpleChange([], [runningActivity], false);
        component.paginationConfig.status = 'started';
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
      }));
      it('and the list is filtered on a failure status', fakeAsync(() => {
        const change: SimpleChange = new SimpleChange([], [runningActivity], false);
        component.paginationConfig.status = 'failure';
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).not.toHaveBeenCalled();
      }));
      it('and the list is filtered on a success status', fakeAsync(() => {
        const change: SimpleChange = new SimpleChange([], [runningActivity], false);
        component.paginationConfig.status = 'success';
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).not.toHaveBeenCalled();
      }));
      it('and the activity fits in the time range filter', fakeAsync(() => {
        const change: SimpleChange = new SimpleChange([], [runningActivity], false);
        component.paginationConfig.startingAfter = moment(new Date()).subtract(1, 'hours').toISOString();
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
      }));
      it('and the activity is outside of the time range filter', fakeAsync(() => {
        const change: SimpleChange = new SimpleChange([], [runningActivity], false);
        component.paginationConfig.startingAfter = moment(new Date()).add(1, 'hours').toISOString();
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).not.toHaveBeenCalled();
      }));
    });
    describe('if an activity was removed', () => {
      const change: SimpleChange = new SimpleChange([runningActivity], [], false);
      it('and the list is filtered on started status', fakeAsync(() => {
        component.paginationConfig.status = 'started';
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
      }));
      describe('and the list is filtered on a failure status', () => {
        beforeEach(() => {
          component.paginationConfig.status = 'failure';
        });
        it('and the activity succeeded', fakeAsync(() => {
          workflowsManagerStub.getWorkflowExecutionActivity.and.returnValue(of(successActivity));
          component.ngOnChanges({ 'executingActivities': change });
          tick();
          expect(component.findWorkflowExecutionActivities).not.toHaveBeenCalled();
        }));
        it('and the activity failed', fakeAsync(() => {
          workflowsManagerStub.getWorkflowExecutionActivity.and.returnValue(of(failedActivity));
          component.ngOnChanges({ 'executingActivities': change });
          tick();
          expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
        }));
      });
      describe('and the list is filtered on a success status', () => {
        beforeEach(() => {
          component.paginationConfig.status = 'success';
        });
        it('and the activity succeeded', fakeAsync(() => {
          workflowsManagerStub.getWorkflowExecutionActivity.and.returnValue(of(successActivity));
          component.ngOnChanges({ 'executingActivities': change });
          tick();
          expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
        }));
        it('and the activity failed', fakeAsync(() => {
          workflowsManagerStub.getWorkflowExecutionActivity.and.returnValue(of(failedActivity));
          component.ngOnChanges({ 'executingActivities': change });
          tick();
          expect(component.findWorkflowExecutionActivities).not.toHaveBeenCalled();
        }));
      });
      it('and the activity fits in the time range filter', fakeAsync(() => {
        component.paginationConfig.startingAfter = moment(new Date()).subtract(1, 'hours').toISOString();
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
      }));
      it('and the activity is outside of the time range filter', fakeAsync(() => {
        component.paginationConfig.startingAfter = moment(new Date()).add(1, 'hours').toISOString();
        component.ngOnChanges({ 'executingActivities': change });
        tick();
        expect(component.findWorkflowExecutionActivities).not.toHaveBeenCalled();
      }));
    });
  });
  describe('execute controller methods', () => {
    it('filterEvent with status payload', () => {
      spyOn(component, 'resetLimitOffset');
      spyOn(component, 'findWorkflowExecutionActivities');
      const workflowTableFilterEvent: WorkflowTableFilterEvent = {
        filter: 'status',
        data: {
          status: 'success'
        }
      };
      component.paginationConfig.status = 'failure';
      component.filterEvent(workflowTableFilterEvent);
      expect(component.paginationConfig.status).toEqual('success');
      expect(component.resetLimitOffset).toHaveBeenCalledWith();
      expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
    });
    it('filterEvent with timeRange payload', () => {
      spyOn(component, 'resetLimitOffset');
      spyOn(component, 'findWorkflowExecutionActivities');
      const workflowTableFilterEvent: WorkflowTableFilterEvent = {
        filter: 'timeRange',
        data: {
          startingAfterISOString: '2024-02-15T14:42:09.761747-06:00',
          endingBeforeISOString: '2024-02-15T14:42:09.761747-07:00'
        }
      };
      expect( component.paginationConfig?.startingAfter).toEqual(null);
      expect( component.paginationConfig?.endingBefore).toEqual(null);
      component.filterEvent(workflowTableFilterEvent);
      expect( component.paginationConfig?.startingAfter).toEqual('2024-02-15T14:42:09.761747-06:00');
      expect( component.paginationConfig?.endingBefore).toEqual('2024-02-15T14:42:09.761747-07:00');
      expect(component.resetLimitOffset).toHaveBeenCalledWith();
      expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
    });
    it('resetLimitOffset with paginator', () => {
      component.paginationConfig.limit = 25;
      expect(component.paginationConfig.limit).toEqual(25);
      expect(component.paginationConfig.offset).toEqual(undefined);
      component.resetLimitOffset();
      expect(component.paginationConfig.limit).toEqual(10);
      expect(component.paginationConfig.offset).toEqual(0);
    });
    it('resetLimitOffset with paginator being null', () => {
      component.paginationConfig.limit = 25;
      expect(component.paginationConfig.limit).toEqual(25);
      expect(component.paginationConfig.offset).toEqual(undefined);
      component.paginator = null;
      component.resetLimitOffset();
      expect(component.paginationConfig.limit).toEqual(10);
      expect(component.paginationConfig.offset).toEqual(0);
    });
    it('findWorkflowExecutionActivities', () => {
      expect(component.totalCount).toEqual(3);
      expect(component.dataSource.data).toEqual(activities);
      component.expandedRow = activities[0];
      component.actions = actionExecutions;
      workflowsManagerStub.findWorkflowExecutionActivities.and.returnValue(of({
        page: [],
        totalCount: 0
      }));
      component.findWorkflowExecutionActivities();
      expect(component.totalCount).toEqual(0);
      expect(component.dataSource.data).toEqual([]);
      expect(component.expandedRow).toBeUndefined();
      expect(component.actions).toEqual([]);
    });
    it('onPaginatorPage', () => {
      spyOn(component, 'findWorkflowExecutionActivities');
      expect(component.paginationConfig.limit).toEqual(10);
      expect(component.paginationConfig.offset).toEqual(undefined);
      component.onPaginatorPage({
        pageIndex: 2,
        pageSize: 10,
        length: 10
      });
      expect(component.findWorkflowExecutionActivities).toHaveBeenCalledWith();
      expect(component.paginationConfig.limit).toEqual(10);
      expect(component.paginationConfig.offset).toEqual(20);
    });
    describe('toggleRow', () => {
      it('on', fakeAsync(() => {
        const event = new PointerEvent('');
        component.toggleRow(event, activities[0]);
        tick();
        expect(component.expandedRow).toEqual(activities[0]);
        expect(workflowsManagerStub.getActionExecutions).toHaveBeenCalledWith(workflow_mocks[0].iri, activities[0].executionId, true);
        expect(component.actions).toEqual(actionExecutions);
      }));
      it('off', () => {
        const event = new PointerEvent('');
        component.expandedRow = activities[0];
        component.actions = actionExecutions;
        component.toggleRow(event, activities[0]);
        expect(component.expandedRow).toBeUndefined();
        expect(workflowsManagerStub.getActionExecutions).not.toHaveBeenCalled();
        expect(component.actions).toEqual([]);
      });
    });
  });
  it('viewLogs should open the log viewer', () => {
    const event = new PointerEvent('');
    spyOn(event, 'stopPropagation');
    component.workflowRdf = [{'@id': 'workflow'}];
    component.viewLogs(event, activities[0]);
    expect(event.stopPropagation).toHaveBeenCalledWith();
    expect(workflowsStateStub.selectedActivity).toEqual(activities[0]);
    expect(workflowsStateStub.selectedWorkflowRdf).toEqual([{'@id': 'workflow'}]);
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
        expect(element.queryAll(By.css('div.execution-history-table')).length).toEqual(1);
        expect(element.queryAll(By.css('div.execution-history-table div.form-wrapper')).length).toEqual(1);
        expect(element.queryAll(By.css('div.execution-history-table div.table-wrapper')).length).toEqual(1);
        expect(element.queryAll(By.css('div.message-wrapper')).length).toEqual(0);
    });
    it('for table header', () => {
      expect(element.queryAll(By.css('table.mat-table')).length).toEqual(1);
      expect(element.queryAll(By.css('table.mat-table th')).length).toEqual(7);
      const columnHeaders = ['Status', 'Executor', 'Execution ID', 'Start Time', 'Running Time', 'Details', 'Logs'];
      expect(element.queryAll(By.css('table.mat-table th')).map((debugElement) => debugElement.nativeElement.innerText)).toEqual(columnHeaders);
    });
    it('for table rows', () => {
      expect(element.queryAll(By.css('table.mat-table')).length).toEqual(1);
      expect(element.queryAll(By.css('table tbody tr.mat-row')).length).toEqual(6);
      const row1 = ['success', 'admin', 'exeId31', '2:42:38PM 2/15/2024', '10.051 sec', 'expand_more', 'description'];
      const row2 = ['failure', 'admin', 'exeId2', '2:42:34PM 2/15/2024', '10.09 sec', 'expand_more', 'description'];
      const row3 = ['success', 'admin', 'exeId3', '2:42:09PM 2/15/2024', '10.229 sec', 'expand_more', 'description'];
      expect(element.queryAll(By.css('table tbody tr.mat-row.activity-row:nth-child(1) td')).map((debugElement) => debugElement.nativeElement.innerText)).toEqual(row1);
      expect(element.queryAll(By.css('table tbody tr.mat-row.activity-row:nth-child(3) td')).map((debugElement) => debugElement.nativeElement.innerText)).toEqual(row2);
      expect(element.queryAll(By.css('table tbody tr.mat-row.activity-row:nth-child(5) td')).map((debugElement) => debugElement.nativeElement.innerText)).toEqual(row3);
    });
    it('for table mat-paginator', () => {
      expect(element.queryAll(By.css('mat-paginator')).length).toEqual(1);
    });
  });
  describe('contains the correct html with no data', () => {
    beforeEach(async () => {
      workflowsManagerStub.findWorkflowExecutionActivities.and.returnValue(of({
        page: [],
        totalCount: 0
      }));
      component.findWorkflowExecutionActivities();
      fixture.detectChanges();
    });
    it('for table', () => {
      expect(element.queryAll(By.css('table.mat-table')).length).toEqual(0);
    });
    it('for table rows', () => {
      expect(element.queryAll(By.css('table.mat-table')).length).toEqual(0);
      expect(element.queryAll(By.css('table tbody tr.mat-row')).length).toEqual(0);
    });
    it('for table mat-paginator', () => {
      expect(element.queryAll(By.css('div.table-wrapper mat-paginator')).length).toEqual(0);
    });
    it('for message-wrapper', () => {
      expect(element.queryAll(By.css('div.message-wrapper')).length).toEqual(1);
    });
  });
});
