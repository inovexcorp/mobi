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
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggle, MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { CATALOG, DCTERMS, PROV, WORKFLOWS } from '../../../prefixes';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ExecutionHistoryTableComponent } from '../execution-history-table/execution-history-table.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { WorkflowDisplayComponent } from '../workflow-display/workflow-display.component';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { WorkflowControlsComponent } from '../workflow-controls/workflow-controls.component';
import { workflow_mocks, workflowRecordJSONLD } from '../../models/mock_data/workflow-mocks';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { WorkflowDownloadModalComponent } from '../workflow-download-modal/workflow-download-modal.component';
import { Difference } from '../../../shared/models/difference.class';
import { WorkflowUploadChangesModalComponent } from '../workflow-upload-changes-modal/workflow-upload-changes-modal.component';
import { CommitDifference } from '../../../shared/models/commitDifference.interface';
import { WorkflowSHACLDefinitions } from '../../models/workflow-shacl-definitions.interface';
import { WorkflowRecordComponent } from './workflow-record.component';

describe('WorkflowRecordComponent', () => {
  let component: WorkflowRecordComponent;
  let fixture: ComponentFixture<WorkflowRecordComponent>;
  let element: DebugElement;
  let workflowsManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const catalogId = 'catalogId';
  const branches: JSONLDObject[] = [{
    '@id': '',
    '@type': [],
    [`${DCTERMS}title`]: [{ '@value': 'MASTER' }],
    [`${DCTERMS}description`]: [{ '@value': 'description' }],
    [`${DCTERMS}modified`]: [{ '@value': '2023-01-01T00:00:00Z' }],
    [`${CATALOG}head`]: [{ '@id': 'commitId' }]
  }];
  const sortOption = { field: `${DCTERMS}issued`, label: '', asc: true} ;
  const totalSize = 10;
  const headers = {'x-total-count': '' + totalSize};
  const activity1: JSONLDObject = {
    '@id': 'urn:activity1',
    '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
    [`${PROV}used`]: [{ '@id': workflow_mocks[0].iri }]
  };
  const activity2: JSONLDObject = {
    '@id': 'urn:activity2',
    '@type': [`${WORKFLOWS}WorkflowExecutionActivity`],
    [`${PROV}used`]: [{ '@id': 'urn:OtherWorkflow' }]
  };
  const workflow: JSONLDObject[] = [
    { '@id': 'workflow', '@type': [`${WORKFLOWS}Workflow`]},
    { '@id': 'action1', '@type': [`${WORKFLOWS}Action`]},
  ];
  const mockJSONLDObject: JSONLDObject = {
    '@id': 'mockId',
    '@type': ['mockType'],
  };
  const wfShaclDefinition: WorkflowSHACLDefinitions = {
    actions: {
      'id:1': [activity1]
    },
    triggers: {
      'id:2': [activity2]
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CommonModule,
        FormsModule,
        MatIconModule,
        MatTabsModule,
        MatButtonModule,
        MatSlideToggleModule
      ],
      declarations: [ 
        WorkflowRecordComponent,
        MockComponent(WorkflowControlsComponent),
        MockComponent(WorkflowDisplayComponent),
        MockComponent(ExecutionHistoryTableComponent)
      ],
      providers: [
        MockProvider(WorkflowsManagerService),
        MockProvider(WorkflowsStateService, {
          isEditMode: false,
          hasChanges: false
        }),
        MockProvider(CatalogManagerService),
        MockProvider(ToastService),
        { 
          provide: MatDialog, 
          useFactory: () => {
            const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
            matDialogSpy.open.and.returnValue({
              afterClosed: () => of({ status: 200 })
            });
            return matDialogSpy;
          }
        } 
      ]
    })
    .compileComponents();

    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    workflowsManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    workflowsStateStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    workflowsStateStub.convertJSONLDToWorkflowSchema.and.returnValue(of(workflow_mocks[0]));
    workflowsManagerStub.getExecutionActivitiesEvents.and.returnValue(of([activity1, activity2]));
    workflowsManagerStub.getShaclDefinitions.and.returnValue(of(wfShaclDefinition));

    catalogManagerStub.localCatalog = {'@id': catalogId, '@type': []};
    catalogManagerStub.sortOptions = [sortOption];
    catalogManagerStub.isVersionedRDFRecord.and.returnValue(true);
    catalogManagerStub.getRecordBranches.and.
      returnValue(of(new HttpResponse<JSONLDObject[]>({body: branches, headers: new HttpHeaders(headers)})));
    catalogManagerStub.getResource.and.returnValue(of(workflow));
    catalogManagerStub.getRecord.and.returnValue(of(workflowRecordJSONLD));

    fixture = TestBed.createComponent(WorkflowRecordComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.record = workflow_mocks[0];
    fixture.detectChanges();
  });
  afterEach(() => {
    catalogManagerStub = null;
    workflowsManagerStub = null;
    workflowsStateStub = null;
    fixture = null;
    component = null;
    element = null;
    toastStub = null;
    matDialog = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize properly', fakeAsync(() => {
    spyOn(component, 'setRecordBranches');
    component.ngOnInit();
    tick();
    expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(workflow_mocks[0].iri, catalogId);
    expect(component.setRecordBranches).toHaveBeenCalledWith();
    expect(workflowsManagerStub.getExecutionActivitiesEvents).toHaveBeenCalledWith();
    expect(component.executingActivities).toEqual([activity1]);
    expect(workflowsStateStub.isEditMode).toBeFalse();
    expect(workflowsStateStub.hasChanges).toBeFalse();
  }));
  describe('controller methods', () => {
    describe('should retrieve the branches of the workflow record', () => {
      it('successfully', fakeAsync(() => {
        component.setRecordBranches();
        tick();
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(workflow_mocks[0].iri, catalogId, {
          pageIndex: 0,
          limit: 1,
          sortOption
        });
        expect(component.branches).toEqual([{
          branch: branches[0],
          title: 'MASTER',
          description: 'description',
          date: jasmine.any(String),
          head: 'commitId',
          type: `${WORKFLOWS}WorkflowRecord`
        }]);
        expect(component.branch).toEqual(component.branches[0]);
        expect(component.workflowRdf).toEqual(workflow);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(() => {
        catalogManagerStub.getRecordBranches.and.returnValue(throwError('error'));
        component.setRecordBranches();
        tick();
        expect(catalogManagerStub.getRecordBranches).toHaveBeenCalledWith(workflow_mocks[0].iri, catalogId, {
          pageIndex: 0,
          limit: 1,
          sortOption
        });
        expect(component.branches).toEqual([]);
        expect(component.branch).toBeUndefined();
        expect(component.workflowRdf).toEqual([]);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('error');
      }));
    });
    it('should go back to the landing page', () => {
      workflowsStateStub.selectedRecord = workflow_mocks[0];
      component.goBack();
      expect(workflowsStateStub.selectedRecord).toBeUndefined();
    });
    describe('should run a workflow', () => {
      it('successfully', fakeAsync(() => {
        workflowsManagerStub.executeWorkflow.and.returnValue(of('urn:activityIRI'));
        component.runWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_mocks[0].title)}}));
        expect(workflowsManagerStub.executeWorkflow).toHaveBeenCalledWith(workflow_mocks[0].iri);
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith('Successfully started workflow');
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(() => {
        workflowsManagerStub.executeWorkflow.and.returnValue(throwError('error'));
        component.runWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_mocks[0].title)}}));
        expect(workflowsManagerStub.executeWorkflow).toHaveBeenCalledWith(workflow_mocks[0].iri);
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('error'));
      }));
    });
    describe('should delete a workflow', () => {
      it('successfully', fakeAsync(() => {
        spyOn(component, 'goBack');
        catalogManagerStub.deleteRecord.and.returnValue(of(null));
        component.deleteWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_mocks[0].title)}}));
        expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(workflow_mocks[0].iri, catalogId);
        expect(component.goBack).toHaveBeenCalledWith();
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(() => {
        catalogManagerStub.deleteRecord.and.returnValue(throwError('error'));
        component.deleteWorkflow();
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, jasmine.objectContaining({ data: { content: jasmine.stringContaining(workflow_mocks[0].title)}}));
        expect(catalogManagerStub.deleteRecord).toHaveBeenCalledWith(workflow_mocks[0].iri, catalogId);
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining(`Error deleting workflow: ${workflow_mocks[0].title}`));
      }));
    });
    it('should open download dialog', fakeAsync(() => {
      workflowsStateStub.isEditMode = false;
      catalogManagerStub.downloadResource.and.returnValue(null);
      component.downloadWorkflow();
      expect(matDialog.open).toHaveBeenCalledWith(WorkflowDownloadModalComponent, jasmine.objectContaining({ data: { workflows: [workflow_mocks[0]], applyInProgressCommit: false } }));
    }));
    describe('should update the workflow state', () => {
      it('When toggle is false', async () => {
        workflowsManagerStub.updateWorkflowActiveStatus.and.returnValue(of([]));
        const mockEvent: MatSlideToggleChange = {
          checked: false,
          source: jasmine.createSpyObj('MatSlideToggleChange', ['source'])
        };
        component.toggleRecordActive(mockEvent, component.record);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(workflowsManagerStub.updateWorkflowActiveStatus).toHaveBeenCalledWith(component.record.iri, false);
        expect(component.record.active).toBeFalse();
      });
      it('When toggle is true', async () => {
        workflowsManagerStub.updateWorkflowActiveStatus.and.returnValue(of([]));
        const mockEvent: MatSlideToggleChange = {
          checked: true,
          source: jasmine.createSpyObj('MatSlideToggleChange', ['source'])
        };
        component.toggleRecordActive(mockEvent, component.record);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(workflowsManagerStub.updateWorkflowActiveStatus).toHaveBeenCalledWith(component.record.iri, true);
        expect(component.record.active).toBeTruthy();
      });
    });
    describe('edit mode', () => {
      it('should toggle with a difference', () => {
        const response: Difference = new Difference([mockJSONLDObject], []);

        catalogManagerStub.getInProgressCommit.and.returnValue(of(response));
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
        component.toggleEditMode();
        fixture.detectChanges();
        expect(element.queryAll(By.css('.upload-button')).length).toEqual(1);
        expect(element.queryAll(By.css('.save-button')).length).toEqual(1);
        expect(element.queryAll(By.css('.edit-button')).length).toEqual(0);
        expect(workflowsStateStub.isEditMode).toBeTrue();
        expect(workflowsStateStub.hasChanges).toBeFalse();

      });
      it('should toggle without a difference', () => {
        const response: Difference = new Difference([], []); 

        catalogManagerStub.getInProgressCommit.and.returnValue(of(response));
        catalogManagerStub.deleteInProgressCommit.and.returnValue(of(null));
        component.toggleEditMode();
        fixture.detectChanges();
        expect(element.queryAll(By.css('.upload-button')).length).toEqual(1);
        expect(element.queryAll(By.css('.save-button')).length).toEqual(1);
        expect(element.queryAll(By.css('.edit-button')).length).toEqual(0);
        expect(workflowsStateStub.isEditMode).toBeTrue();
        expect(workflowsStateStub.hasChanges).toBeFalse();
      });
    });
    describe('upload modal', () => {
      it('should open dialog and handle 200', () => {
        const response = new CommitDifference();
        response.commit = { '@id': 'commitId' } as JSONLDObject;
        catalogManagerStub.getBranchHeadCommit.and.returnValue(of(response));
        catalogManagerStub.getResource.and.returnValue(of([mockJSONLDObject]));
      
        component.uploadChangesModal();
        expect(matDialog.open).toHaveBeenCalledWith(WorkflowUploadChangesModalComponent, {
          data: {
            recordId: component.record.iri,
            branchId: component.branch.branch['@id'],
            commitId: response.commit['@id'],
            catalogId: catalogId
          }
        });

        expect(workflowsStateStub.hasChanges).toBeTrue();
        expect(toastStub.createWarningToast).not.toHaveBeenCalled();
        expect(component.workflowRdf).toEqual([mockJSONLDObject]);
      });
      it('should open dialog and handle 204', () => {
        const response = new CommitDifference();
        response.commit = { '@id': 'commitId' } as JSONLDObject;
        catalogManagerStub.getBranchHeadCommit.and.returnValue(of(response));
        catalogManagerStub.getResource.and.returnValue(of([mockJSONLDObject]));
        const dialogRefMock = {
          afterClosed: () => of({ status: 204 })
        };
        matDialog.open.and.returnValue(dialogRefMock as any);
        component.uploadChangesModal();
      
        expect(matDialog.open).toHaveBeenCalledWith(WorkflowUploadChangesModalComponent, {
          data: {
            recordId: component.record.iri,
            branchId: component.branch.branch['@id'],
            commitId: response.commit['@id'],
            catalogId: catalogId
          }
        });
    
        expect(workflowsStateStub.hasChanges).toBeFalse();
        expect(toastStub.createWarningToast).toHaveBeenCalledWith('No changes detected with new upload');
      });
      it('should fail to open the dialog',() => {
        const response = new CommitDifference();
        response.commit = { '@id': 'commitId' } as JSONLDObject;
        catalogManagerStub.getBranchHeadCommit.and.returnValue(of(response));
        catalogManagerStub.getResource.and.returnValue(throwError('Error'));
      
        component.uploadChangesModal();
      
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Issue fetching latest workflow RDF: Error');
      });
    });
    describe('commitChanges', () => {
      it('should commit changes then calculate new state', fakeAsync(() => {
        workflowsStateStub.hasChanges = true;
        catalogManagerStub.createBranchCommit.and.returnValue(of('commitIRI'));
        spyOn(component, 'toggleEditMode');
        spyOn(component, 'setRecordBranches');
        component.commitChanges();

        expect(component.toggleEditMode).toHaveBeenCalledWith();
        expect(component.setRecordBranches).toHaveBeenCalledWith();
      }));
      it('should toggle edit mode only, if hasChanges is false', () => {
        workflowsStateStub.hasChanges = false;
        spyOn(component, 'toggleEditMode');
        spyOn(component, 'setRecordBranches');
        catalogManagerStub.createBranchCommit.and.returnValue(of('commitIRI'));
        component.commitChanges();
    
        expect(component.toggleEditMode).toHaveBeenCalledWith();
        expect(component.setRecordBranches).not.toHaveBeenCalledWith();
      });
      it('unless an error occurs', () => {
        const errorMessage = 'Error saving changes to workflow';
        workflowsStateStub.hasChanges = true;
        catalogManagerStub.createBranchCommit.and.returnValue(throwError(errorMessage));
        component.commitChanges();
    
        expect(toastStub.createErrorToast).toHaveBeenCalledWith(errorMessage);
      });
    });
  });
  describe('contains the correct html', () => {
    describe('concerning edit mode', () => {
      it('when not in edit mode', () => {
        expect(element.queryAll(By.css('.edit-button')).length).toEqual(1);
        expect(element.queryAll(By.css('.upload-button')).length).toEqual(0);
        expect(element.queryAll(By.css('.save-button')).length).toEqual(0);
      });
      it('when in edit mode', () => {
        workflowsStateStub.isEditMode = true;
        fixture.detectChanges();
        expect(element.queryAll(By.css('.upload-button')).length).toEqual(1);
        expect(element.queryAll(By.css('.save-button')).length).toEqual(1);
        expect(element.queryAll(By.css('.edit-button')).length).toEqual(0);

        const slideToggleElements = fixture.debugElement.queryAll(By.directive(MatSlideToggle));
        expect(slideToggleElements.length).toEqual(1);
        const inputElement = slideToggleElements[0].query(By.css('input')).nativeElement;
        expect(inputElement.disabled).toBeTrue();
      });
      it('when has changes', () => {
        workflowsStateStub.hasChanges = true;
        expect(element.queryAll(By.css('.changes-text')).length).toEqual(1);
      });
    });
    it('for wrapping containers', () => {
        expect(element.queryAll(By.css('div.workflow-record')).length).toEqual(1);
        expect(element.queryAll(By.css('div.workflow-record div.back-sidebar')).length).toEqual(1);
    });
    it('workflow-details', () => {
      expect(element.queryAll(By.css('div.record-header')).length).toEqual(1);
      expect(element.queryAll(By.css('div.record-header h2.record-title')).length).toEqual(1);
      expect(element.queryAll(By.css('div.record-header p.record-workflow-iri')).length).toEqual(1);
      expect(element.queryAll(By.css('div.record-header div.record-active-toggle')).length).toEqual(1);
      expect(element.queryAll(By.css('div.record-header p.record-description')).length).toEqual(1);
      expect(element.queryAll(By.css('div.record-header h2.record-title'))[0].nativeElement.innerText).toEqual(workflow_mocks[0].title);
      expect(element.queryAll(By.css('div.record-header p.record-workflow-iri'))[0].nativeElement.innerText).toEqual(workflow_mocks[0].workflowIRI);
      expect(element.queryAll(By.css('div.record-header p.record-description'))[0].nativeElement.innerText).toEqual(workflow_mocks[0].description);
    });
  });
  describe('contains the correct html bindings', () => {
    it('back-sidebar button', () => {
      spyOn(component, 'goBack');
      expect(element.queryAll(By.css('.back-sidebar button')).length).toEqual(1);
      const button = element.queryAll(By.css('.back-sidebar button'))[0];
      button.triggerEventHandler('click', null);
      expect(component.goBack).toHaveBeenCalledWith();
    });
    it('record active toggle', () => {
      fixture.detectChanges();
      spyOn(component, 'toggleRecordActive');
      expect(element.queryAll(By.css('.workflow-record-main .record-active-toggle')).length).toEqual(1);
      const button = element.queryAll(By.css('.workflow-record-main .record-active-toggle mat-slide-toggle'))[0];
      button.triggerEventHandler('change', jasmine.createSpy('MatSlideToggleChange'));
      expect(component.toggleRecordActive).toHaveBeenCalledWith(jasmine.anything(), component.record);
    });
  });
});
