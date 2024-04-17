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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MockComponent, MockProvider } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { of, Subject, throwError } from 'rxjs';
import { cloneDeep, forEach } from 'lodash';

import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PROV, WORKFLOWS } from '../../../prefixes';
import { WorkflowDataRow } from '../../models/workflow-record-table';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { workflow_data_row_mocks, workflow_mocks } from '../../models/mock_data/workflow-mocks';
import { WorkflowControlsComponent } from '../workflow-controls/workflow-controls.component';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { WorkflowRecordsComponent } from './workflow-records.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { PolicyEnforcementService } from '../../../shared/services/policyEnforcement.service';
import { WorkflowDownloadModalComponent } from '../workflow-download-modal/workflow-download-modal.component';
import { MatSortModule } from '@angular/material/sort';
import { WorkflowPaginatedConfig } from '../../models/workflow-paginated-config.interface';
import { WorkflowTableFilterComponent } from '../workflow-table-filter/workflow-table-filter.component';
import { WorkflowCreationModalComponent } from '../workflow-creation-modal/workflow-creation-modal.component';
import { RESTError } from '../../../shared/models/RESTError.interface';

describe('WorkflowRecordsComponent', () => {
  let component: WorkflowRecordsComponent;
  let fixture: ComponentFixture<WorkflowRecordsComponent>;
  let workflowManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let element: DebugElement;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let workflowsManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
  let policyManagerServiceStub: jasmine.SpyObj<PolicyManagerService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let executionActivitiesSubject: Subject<JSONLDObject[]>;

  const error: RESTError = {
    errorMessage: 'Error message',
    error: '',
    errorDetails: []
  };
  let wfRecord: WorkflowDataRow;
  const paginationConfig: WorkflowPaginatedConfig = {
    limit: 20,
    pageIndex: 0,
    searchText: '',
    sortOption: {
      asc: true,
      field: 'title',
      label: ''
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        MockProvider(WorkflowsStateService),
        MockProvider(WorkflowsManagerService),
        MockProvider(CatalogManagerService),
        MockProvider(ToastService),
        MockProvider(PolicyManagerService),
        MockProvider(PolicyEnforcementService),
        MockProvider(ProgressSpinnerService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: {afterClosed: () => of(true)}
          })
        }
      ],
      imports: [
        NoopAnimationsModule,
        MatTableModule,
        MatSlideToggleModule,
        MatPaginatorModule,
        FormsModule,
        MatCheckboxModule,
        HttpClientTestingModule,
        MatIconModule,
        MatSortModule
      ],
      declarations: [
        WorkflowRecordsComponent,
        MockComponent(WorkflowControlsComponent),
        MockComponent(WorkflowTableFilterComponent),
        MockComponent(InfoMessageComponent),
        MockComponent(ErrorDisplayComponent),
        MockComponent(ConfirmModalComponent)
      ],
    }).compileComponents();

    executionActivitiesSubject = new Subject<JSONLDObject[]>();
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    workflowsManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
    policyEnforcementStub.evaluateMultiDecisionRequest.and.returnValue(of([]));

    workflowsStateStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    workflowsStateStub.getResults.and.returnValue(of({page: [], totalCount: 0}));

    workflowManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    workflowManagerStub.getExecutionActivitiesEvents.and.returnValue(executionActivitiesSubject.asObservable());
    workflowManagerStub.checkCreatePermission.and.returnValue(of('Permit'));

    fixture = TestBed.createComponent(WorkflowRecordsComponent);
    component = fixture.componentInstance;
    component.paginationConfig = paginationConfig;
    element = fixture.debugElement;
  });

  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
    matDialog = null;
    workflowsManagerStub = null;
    workflowsStateStub = null;
    policyEnforcementStub = null;
    policyManagerServiceStub = null;
    toastStub = null;
    catalogManagerStub = null;
    executionActivitiesSubject = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize properly', () => {
    spyOn(component.dataSource, 'retrieveWorkflows').and.callThrough();
    component.ngOnInit();
    expect(component.dataSource.retrieveWorkflows).toHaveBeenCalledWith(component.paginationConfig);
  });
  describe('component methods', () => {
    it('should get a page of events', () => {
      spyOn(component.dataSource, 'retrieveWorkflows').and.callThrough();
      const event = new PageEvent();
      event.pageIndex = 10;
      component.onPageChange(event);
      expect(component.paginationConfig.pageIndex).toEqual(10);
      expect(component.dataSource.retrieveWorkflows).toHaveBeenCalledWith(paginationConfig);
    });
    describe('should set the workflow results', () => {
      it('successfully', async () => {
        workflowsStateStub.getResults.and.returnValue(of({page: workflow_data_row_mocks, totalCount: workflow_data_row_mocks.length}));
        component.updateWorkflowRecords();

        fixture.detectChanges();
        await fixture.whenStable(); // Wait for asynchronous changes to finish
        expect(workflowsStateStub.getResults).toHaveBeenCalledWith(paginationConfig);
        component.dataSource.connect().subscribe(async (data) => {
          await expect(data).toEqual(workflow_data_row_mocks);
          expect(component.columnsToDisplay.length).toEqual(8);
        });
      });
      it('if some workflows have been selected', async () => {
        component.selectedWorkflows = [cloneDeep(workflow_data_row_mocks[0])];
        workflowsStateStub.getResults.and.returnValue(of(cloneDeep({page: workflow_data_row_mocks, totalCount: workflow_data_row_mocks.length})));
        component.updateWorkflowRecords();
        fixture.detectChanges();
        await fixture.whenStable(); // Wait for asynchronous changes to finish
        expect(workflowsStateStub.getResults).toHaveBeenCalledWith(component.paginationConfig);
        component.dataSource.connect().subscribe(data => {
          expect(data.length).toEqual(workflow_data_row_mocks.length);
          expect(data[0].checked).toBeTrue();
        });
      });
      it('when no data is returned', async () => {
        workflowsStateStub.getResults.and.returnValue(of({page: [], totalCount: 0}));
        component.updateWorkflowRecords();
        await fixture.whenRenderingDone();
        fixture.detectChanges();
        await fixture.whenStable();
        // Trigger Change detection
        const infoMsg = element.query(By.css('info-message'));
        expect(infoMsg).toBeTruthy();
        expect(infoMsg.nativeElement.textContent.trim()).toContain(component.dataSource.messageNoData);
        expect(component.columnsToDisplay.length).toEqual(8);
        expect(element.queryAll(By.css('info-message')).length).toEqual(1);
      });
      it('unless an error occurs', async () => {
        workflowsStateStub.getResults.and.returnValue(throwError(error));
        component.updateWorkflowRecords();
        fixture.detectChanges();
        await fixture.whenStable();
        const errorMsg = element.query(By.css('error-display'));
        expect(errorMsg.nativeElement.textContent).toContain(error.errorMessage);
        expect(component.columnsToDisplay.length).toEqual(8);
      });
      it('when workflows should be updated based on new activity details', fakeAsync(() => {
        const runningWorkflow: WorkflowDataRow = {
          record: {
            iri: 'urn:workflowARecordIri',
            title: 'Workflow A',
            description: '',
            issued: new Date(),
            modified: new Date(),
            workflowIRI: 'urn:workflowA',
            master: 'urn:workflowAMasterIri',
            active: true,
            canModifyMasterBranch: true,
            canDeleteWorkflow: false,
          },
          statusDisplay: 'started',
          executorDisplay: 'batman',
          executionIdDisplay: '1234',
          startTimeDisplay: 'Today',
          runningTimeDisplay: '(none)',
        };
        const notStartedWorkflow: WorkflowDataRow = {
          record: {
            iri: 'urn:workflowBRecordIri',
            title: 'Workflow B',
            description: '',
            issued: new Date(),
            modified: new Date(),
            workflowIRI: 'urn:workflowB',
            master: 'urn:workflowBMasterIri',
            active: true,
            canModifyMasterBranch: true,
            canDeleteWorkflow: false,
          },
          statusDisplay: '(none)',
          executorDisplay: '(none)',
          executionIdDisplay: '(none)',
          startTimeDisplay: '(none)',
          runningTimeDisplay: '(none)',
        };
        const runningActivity: JSONLDObject = {
          '@id': 'urn:running',
          '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
          [`${PROV}used`]: [{ '@id': notStartedWorkflow.record.iri }]
        };
        const finishedActivity: JSONLDObject = {
          '@id': 'urn:finishedActivity',
          '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
          [`${PROV}used`]: [{ '@id': runningActivity.recordIRI }]
        };
        executionActivitiesSubject.next([runningActivity]);
        workflowsStateStub.getResults.and.returnValue(of({page: [runningWorkflow, notStartedWorkflow], totalCount: 2}));
        workflowsManagerStub.getLatestExecutionActivity.and.returnValue(of(finishedActivity));
        workflowsManagerStub.getExecutionActivitiesEvents.and.returnValue(of([runningActivity]));
        component.dataSource.retrieveWorkflows(paginationConfig).subscribe();
        component.dataSource.connect().subscribe(async (data) => {
          expect(data).toEqual([runningWorkflow, notStartedWorkflow]);
          expect(workflowsStateStub.updateWorkflowWithActivity).toHaveBeenCalledWith(notStartedWorkflow, runningActivity);
          expect(workflowsManagerStub.getLatestExecutionActivity).toHaveBeenCalledWith(runningWorkflow.record.iri, true);
          expect(workflowsStateStub.updateWorkflowWithActivity).toHaveBeenCalledWith(runningWorkflow, finishedActivity);
        });
        tick();
      }));
    });
    it('should open a workflow record', () => {
      component.openRecord(workflow_data_row_mocks[0]);
      expect(workflowsStateStub.selectedRecord).toEqual(workflow_data_row_mocks[0].record);
    });
    describe('should run a workflow', () => {
      beforeEach(() => {
        component.selectedWorkflows = cloneDeep(workflow_data_row_mocks);
      });
      it('unless an error occurs', fakeAsync(() => {
        workflowManagerStub.executeWorkflow.and.returnValue(throwError(error));
        component.runWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_data_row_mocks[0].record.title)}}));
        expect(workflowManagerStub.executeWorkflow).toHaveBeenCalledWith(workflow_data_row_mocks[0].record.iri);
        expect(component.selectedWorkflows.length).toBe(0);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error executing workflow: Error message');
      }));
      it('successfully', fakeAsync(() => {
        workflowManagerStub.executeWorkflow.and.returnValue(of('someActivity.iri.com'));
        component.runWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_data_row_mocks[0].record.title)}}));
        expect(workflowManagerStub.executeWorkflow).toHaveBeenCalledWith(workflow_data_row_mocks[0].record.iri);
        expect(component.selectedWorkflows.length).toBe(0);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
    });
    it('should open download dialog', fakeAsync(() => {
      catalogManagerStub.downloadResource.and.returnValue(null);
      component.downloadWorkflow();
      expect(matDialog.open).toHaveBeenCalledWith(WorkflowDownloadModalComponent, jasmine.objectContaining({ data: { workflows: component.getSelectedRecords() } }));
    }));
    it('should open create dialog', fakeAsync(() => {
      component.createWorkflow();
      expect(matDialog.open).toHaveBeenCalledWith(WorkflowCreationModalComponent);
    }));
    describe('should delete a workflow', () => {
      beforeEach(() => {
        component.selectedWorkflows = cloneDeep(workflow_data_row_mocks);
      });
      it('unless an error occurs', fakeAsync(() => {
        catalogManagerStub.deleteRecord.and.returnValue(throwError(error));
        component.deleteWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_data_row_mocks[0].record.title)}}));
        expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(workflow_data_row_mocks[0].record.iri, component.catalogId);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(`Error deleting workflow: ${workflow_data_row_mocks[0].record.title}`);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(`Error deleting workflow: ${workflow_data_row_mocks[1].record.title}`);
        expect(component.selectedWorkflows.length).toBe(0);
      }));
      it('when one is selected', fakeAsync(() => {
        component.selectedWorkflows = [];
        component.selectedWorkflows.push(workflow_data_row_mocks[0]);
        catalogManagerStub.deleteRecord.and.returnValue(of(null));
        component.deleteWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_data_row_mocks[0].record.title)}}));
        expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(workflow_data_row_mocks[0].record.iri, component.catalogId);
        expect(component.selectedWorkflows.length).toBe(0);
      }));
      it('when more than one is selected', fakeAsync(() => {
        catalogManagerStub.deleteRecord.and.returnValue(of(null));
        component.deleteWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_data_row_mocks[0].record.title)}}));
        expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(workflow_data_row_mocks[0].record.iri, component.catalogId);
        expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(workflow_data_row_mocks[1].record.iri, component.catalogId);
        expect(component.selectedWorkflows.length).toBe(0);
      }));
    });
    it('should retrieve the workflow records of the selected workflows', () => {
      component.selectedWorkflows = workflow_data_row_mocks;
      expect(component.getSelectedRecords()).toEqual(workflow_mocks);
    });
    it('should toggle whether a workflow is selected', () => {
      expect(component.selectedWorkflows).toEqual([]);
      const clone = cloneDeep(workflow_data_row_mocks[0]);
      component.toggleWorkflow(clone, true);
      expect(clone.checked).toBeTrue();
      expect(component.selectedWorkflows).toEqual([clone]);
      component.toggleWorkflow(clone, false);
      expect(clone.checked).toBeFalse();
      expect(component.selectedWorkflows).toEqual([]);
    });
    describe('should validate the toggle active status', () => {
      beforeEach(() => {
        wfRecord = cloneDeep(workflow_data_row_mocks[0]);
      });
      it('When toggle is false', async () => {
        workflowsStateStub.getResults.and.returnValue(of({page: workflow_data_row_mocks, totalCount: workflow_data_row_mocks.length}));
        component.updateWorkflowRecords();
        workflowManagerStub.updateWorkflowActiveStatus.and.returnValue(of([]));
        const mockEvent: MatSlideToggleChange = {
          checked: false,
          source: jasmine.createSpyObj('MatSlideToggleChange', ['source'])
        };
        fixture.detectChanges();
        await fixture.whenStable();
        component.updateStatus(mockEvent, wfRecord);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(workflowManagerStub.updateWorkflowActiveStatus).toHaveBeenCalledWith(wfRecord.record.iri, false);
        expect(wfRecord.record.active).toBeFalse();
      });
      it('When toggle is true', async () => {
        workflowsStateStub.getResults.and.returnValue(of({page: workflow_data_row_mocks, totalCount: workflow_data_row_mocks.length}));
        component.updateWorkflowRecords();
        workflowManagerStub.updateWorkflowActiveStatus.and.returnValue(of([]));
        const mockEvent: MatSlideToggleChange = {
          checked: true,
          source: jasmine.createSpyObj('MatSlideToggleChange', ['source',])
        };
        fixture.detectChanges();
        await fixture.whenStable();
        component.updateStatus(mockEvent, wfRecord);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(workflowManagerStub.updateWorkflowActiveStatus).toHaveBeenCalledWith(wfRecord.record.iri, true);
        expect(wfRecord.record.active).toBeTruthy();
      });
    });
  });
  describe('contains the correct html', function() {
    describe('when datasource has data', () => {
      beforeEach(async () => {
        executionActivitiesSubject.next([]);
        workflowsStateStub.getResults.and.returnValue(of({page: workflow_data_row_mocks, totalCount: workflow_data_row_mocks.length}));
        component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
      });
      it('for wrapping containers', function() {
        expect(element.queryAll(By.css('.workflow-records')).length).toEqual(1);
        expect(element.queryAll(By.css('.workflow-table')).length).toEqual(1);
        expect(element.queryAll(By.css('.workflow-top-bar')).length).toEqual(1);
      });
      forEach(['table', 'thead', 'tbody', 'app-workflow-controls'], item => {
        it(`with a ${item}`, function() {
          expect(element.queryAll(By.css(item)).length).withContext(`${item} should present`).toEqual(1);
        });
      });
      it('table heads', function() {
        expect(element.queryAll(By.css('th')).length).toEqual(component.columnsToDisplay.length);
      });
      it('table rows', function() {
        expect(element.queryAll(By.css('tbody tr')).length).toEqual(2);
      });
      it('mat-slide-toggle', function() {
        expect(element.queryAll(By.css('mat-slide-toggle')).length).toEqual(2);
      });
      it('badge', function() {
        expect(element.queryAll(By.css('.badge')).length).toEqual(2);
      });
    });
    describe('when datasource is empty', () => {
      beforeEach(async  () => {
        executionActivitiesSubject.next([]);
        component.dataSource.infoMessage = component.dataSource.messageNoData;
        workflowsStateStub.getResults.and.returnValue(of({page: [], totalCount: 0}));
        component.ngOnInit();
        fixture.detectChanges();
        await fixture.whenStable();
      });
      forEach(['table', 'thead', 'tbody'], item => {
        it(`with a ${item}`, function() {
          expect(element.queryAll(By.css(item)).length).withContext(`${item} should present`).toEqual(0);
        });
      });
      it('table heads', function() {
        expect(element.queryAll(By.css('th')).length).toEqual(0);
      });
      it('table rows', function() {
        expect(element.queryAll(By.css('tbody tr')).length).toEqual(0);
      });
    });
  });
});
