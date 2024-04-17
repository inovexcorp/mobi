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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { cloneDeep } from 'lodash';
import { MockProvider } from 'ng-mocks';

import { workflow_mocks } from '../../models/mock_data/workflow-mocks';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { WorkflowSchema } from '../../models/workflow-record.interface';
import { WorkflowControlsComponent } from './workflow-controls.component';

describe('WorkflowControlsComponent', () => {
  let component: WorkflowControlsComponent;
  let fixture: ComponentFixture<WorkflowControlsComponent>;
  let element: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
      ],
      declarations: [ 
        WorkflowControlsComponent,
      ],
      providers: [
        MockProvider(WorkflowsStateService)
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowControlsComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.records = workflow_mocks;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controller methods', () => {
    it('should properly determine whether the run button should be disabled', () => {
      // No Records
      component.records = [];
      expect(component.isRunDisabled()).toBeTrue();
      // Currently Running
      component.records = [cloneDeep(workflow_mocks[0])];
      component.records[0].active = true;
      component.records[0].canModifyMasterBranch = true;
      component.currentlyRunning = true;
      expect(component.isRunDisabled()).toBeTrue();
      // Inactive
      component.currentlyRunning = false;
      component.records[0].active = false;
      expect(component.isRunDisabled()).toBeTrue();
      // No Permissions
      component.records[0].active = true;
      component.records[0].canModifyMasterBranch = false;
      expect(component.isRunDisabled()).toBeTrue();
      // Enabled
      component.records[0].canModifyMasterBranch = true;
      expect(component.isRunDisabled()).toBeFalse();
    });
    it('should properly determine whether the download button should be disabled', () => {
      // No Records
      component.records = [];
      expect(component.isDownloadDisabled()).toBeTrue();
      // Enabled
      component.records = [cloneDeep(workflow_mocks[0])];
      expect(component.isDownloadDisabled()).toBeFalse();
    });
    it('should properly determine whether the delete button should be disabled', () => {
      // No Records
      component.records = [];
      expect(component.isDeleteDisabled()).toBeTrue();
      // No Permissions
      component.records = [cloneDeep(workflow_mocks[0])];
      component.records[0].canDeleteWorkflow = false;
      expect(component.isDeleteDisabled()).toBeTrue();
      // Enabled
      component.records[0].canDeleteWorkflow = true;
      expect(component.isDeleteDisabled()).toBeFalse();
    });
    it('should return the proper tooltip for the run button', () => {
      // Currently Running
      component.currentlyRunning = true;
      expect(component.getRunTooltip()).toEqual('Workflow currently running.');
      // No Records
      component.currentlyRunning = false;
      component.records = [];
      expect(component.getRunTooltip()).toEqual('Select a workflow.');
      // Too Many Records
      component.records = workflow_mocks;
      expect(component.getRunTooltip()).toEqual('Select only one workflow.');
      // No Permissions
      component.records = [cloneDeep(workflow_mocks[0])];
      expect(component.getRunTooltip()).toEqual('You do not have permission to execute a selected workflow.');
      // Inactive
      component.records[0].canModifyMasterBranch = true;
      component.records[0].active = false;
      expect(component.getRunTooltip()).toEqual('A selected workflow is not active.');
      // No Tooltip
      component.records[0].active = true;
      expect(component.getRunTooltip()).toEqual('');
    });
    it('should return the proper tooltip for the delete button', () => {
      // No Records
      component.records = [];
      expect(component.getDeleteTooltip()).toEqual('Select a workflow.');
      // No Permissions
      component.records = [cloneDeep(workflow_mocks[0])];
      expect(component.getDeleteTooltip()).toEqual('You do not have permission to delete a selected workflow.');
      // No Tooltip
      component.records[0].canDeleteWorkflow = true;
      expect(component.getDeleteTooltip()).toEqual('');
    });
    it('should return the proper tooltip for the download button', () => {
      // No Records
      component.records = [];
      expect(component.getDownloadTooltip()).toEqual('Select a workflow.');
      // No Tooltip
      component.records = [cloneDeep(workflow_mocks[0])];
      expect(component.getDownloadTooltip()).toEqual('');
    });
    it('should return the proper tooltip for the create/upload button button', () => {
      // No Permission
      component.canCreate = false;
      component.setWorkflowCreationTooltip();
      expect(component.creationTooltip).toEqual('You do not have permission to create workflow records.');
      // Valid Permission
      component.canCreate = true;
      component.setWorkflowCreationTooltip();
      expect(component.creationTooltip).toEqual('');
    });
  });
  describe('contains the correct html bindings', () => {
    it('workflow run button', () => {
      fixture.detectChanges();
      spyOn(component, 'runWorkflow');
      expect(element.queryAll(By.css('.workflow-run')).length).toEqual(1);
      const button = element.queryAll(By.css('.workflow-run'))[0];
      button.triggerEventHandler('click', jasmine.createSpy('PointerEvent'));
      expect(component.runWorkflow).toHaveBeenCalledWith();
    });
    it('workflow delete button', () => {
      fixture.detectChanges();
      spyOn(component, 'deleteWorkflow');
      expect(element.queryAll(By.css('.workflow-delete')).length).toEqual(1);
      const button = element.queryAll(By.css('.workflow-delete'))[0];
      button.triggerEventHandler('click', jasmine.createSpy('PointerEvent'));
      expect(component.deleteWorkflow).toHaveBeenCalledWith();
    });
    it('workflow download button', () => {
      fixture.detectChanges();
      spyOn(component, 'downloadWorkflow');
      expect(element.queryAll(By.css('.workflow-download')).length).toEqual(1);
      const button = element.queryAll(By.css('.workflow-download'))[0];
      button.triggerEventHandler('click', jasmine.createSpy('PointerEvent'));
      expect(component.downloadWorkflow).toHaveBeenCalledWith();
    });
    it('workflow create button', () => {
      fixture.detectChanges();
      spyOn(component, 'createWorkflow');
      expect(element.queryAll(By.css('.workflow-create')).length).toEqual(1);
      const button = element.queryAll(By.css('.workflow-create'))[0];
      button.triggerEventHandler('click', jasmine.createSpy('PointerEvent'));
      expect(component.createWorkflow).toHaveBeenCalledWith();
      // Test that is not visible on individual page
      const sampleWorkflowSchema: WorkflowSchema = {
        iri: '',
        title: '',
        issued: undefined,
        modified: undefined,
        description: '',
        active: false,
        workflowIRI: ''
      };
      component.wss.selectedRecord = sampleWorkflowSchema;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.workflow-create')).length).toEqual(0);
    });
    it('workflow upload button', () => {
      fixture.detectChanges();
      spyOn(component, 'uploadWorkflow');
      expect(element.queryAll(By.css('.workflow-upload')).length).toEqual(1);
      const button = element.queryAll(By.css('.workflow-upload'))[0];
      button.triggerEventHandler('click', jasmine.createSpy('PointerEvent'));
      expect(component.uploadWorkflow).toHaveBeenCalledWith();
      // Test that is not visible on individual page
      const sampleWorkflowSchema: WorkflowSchema = {
        iri: '',
        title: '',
        issued: undefined,
        modified: undefined,
        description: '',
        active: false,
        workflowIRI: ''
      };
      component.wss.selectedRecord = sampleWorkflowSchema;
      fixture.detectChanges();
      expect(element.queryAll(By.css('.workflow-upload')).length).toEqual(0);
    });
  });
});