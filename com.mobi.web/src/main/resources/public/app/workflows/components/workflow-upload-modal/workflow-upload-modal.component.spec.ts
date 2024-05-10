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

import { WorkflowUploadModalComponent } from './workflow-upload-modal.component';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { cleanStylesFromDOM } from 'src/main/resources/public/test/ts/Shared';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { WorkflowRecordConfig } from '../../models/workflowRecordConfig.interface';
import { XACMLDecision } from '../../../shared/models/XACMLDecision.interface';

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import { MatInputModule } from '@angular/material/input';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { map, trim, uniq } from 'lodash';

describe('WorkflowUploadModalComponent', () => {
  let component: WorkflowUploadModalComponent;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<WorkflowUploadModalComponent>>;
  let fixture: ComponentFixture<WorkflowUploadModalComponent>;
  let workflowManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let element: DebugElement;
  let mockFile: File;

  const error: RESTError = {
    error: '',
    errorMessage: 'Error',
    errorDetails: []
  };
  const fakePermissionPermit: XACMLDecision[] = [
    {
      'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'https://mobi.com/records#0ce1e51e-dd1b-4277-925f-2dc838d0dbc5',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:action': 'http://mobi.com/ontologies/policy#Delete',
      'decision': 'Permit'
    }
  ];

  beforeEach(async () => {
    mockFile = new File([''], 'test_file.ttl', { type: 'text/plain' });
    await TestBed.configureTestingModule({
      imports: [
        MatFormFieldModule,
        FormsModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatInputModule,
        NoopAnimationsModule,
      ],
      declarations: [ WorkflowUploadModalComponent ],
      providers: [
        MockProvider(WorkflowsManagerService),
        { provide: MAT_DIALOG_DATA, useValue: {file: mockFile} },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowUploadModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    workflowManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<WorkflowUploadModalComponent>>;
    fixture.detectChanges();
  });
  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    workflowManagerStub = null;
  });

  it('should initialize with the correct values', function() {
    component.ngOnInit();
    expect(component.uploadWorkflowForm.controls.title.value).toEqual('test_file');
    expect(component.uploadWorkflowForm.controls.description.value).toEqual('');
    expect(component.uploadWorkflowForm.controls.keywords.value).toEqual([]);
  });

  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['input[name="title"]', 'textarea', 'keyword-select'].forEach(function (item) {
      it(`with a ${item}`, function () {
        expect(element.queryAll(By.css(item)).length).toEqual(1);
      });
    });
    it('with buttons to cancel and submit', function () {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
    it('depending on whether an error occurred', function () {
      expect(element.queryAll(By.css('error-display')).length).toEqual(0);

      component.error = error;
      fixture.detectChanges();
      expect(element.queryAll(By.css('error-display')).length).toEqual(1);
    });
  });
  describe('controller methods', function() {
    it('cancel should call the correct method and set the correct variable', function() {
      component.cancel();
      expect(component['_data'].file).toEqual(undefined);
      expect(matDialogRef.close).toHaveBeenCalledWith();
    });

    describe('should create a workflow', function () {
      let newWorkflowRecord: WorkflowRecordConfig;

      function setupCommon(): void {
        component.uploadWorkflowForm.controls.title.setValue('test_file');
        component.uploadWorkflowForm.controls.keywords.setValue([' one', 'two ']);
        component.uploadWorkflowForm.controls.description.setValue('');
      }
      beforeEach(function () {
        setupCommon();
        workflowManagerStub.createWorkflowRecord.and.returnValue(of(null));
        newWorkflowRecord = {
          title: component.uploadWorkflowForm.controls.title.value,
          description: component.uploadWorkflowForm.controls.description.value,
          keywords: uniq(map(component.uploadWorkflowForm.controls.keywords.value, trim)),
          file: component['_data'].file
        };
      });
      it('unless an error occurs', fakeAsync(function () {
        workflowManagerStub.createWorkflowRecord.and.returnValue(throwError(error));
        component.submit();
        tick();
        expect(workflowManagerStub.createWorkflowRecord).toHaveBeenCalledWith(newWorkflowRecord);
        expect(matDialogRef.close).not.toHaveBeenCalled();
        expect(component.error).toEqual(error);
      }));
      describe('successfully', function () {
        it('with a description', fakeAsync(function () {
          workflowManagerStub.createWorkflowRecord.and.returnValue(of(''));
          workflowManagerStub.checkMasterBranchPermissions.and.returnValue(of(true));
          workflowManagerStub.checkMultiWorkflowDeletePermissions.and.returnValue(of(fakePermissionPermit));
          component.uploadWorkflowForm.controls.description.setValue('description');
          newWorkflowRecord.description = 'description';
          component.submit();
          tick();
          expect(workflowManagerStub.createWorkflowRecord).toHaveBeenCalledWith(newWorkflowRecord);
          expect(matDialogRef.close).toHaveBeenCalled();
        }));
        it('without description', fakeAsync(function () {
          workflowManagerStub.createWorkflowRecord.and.returnValue(of(''));
          workflowManagerStub.checkMasterBranchPermissions.and.returnValue(of(true));
          workflowManagerStub.checkMultiWorkflowDeletePermissions.and.returnValue(of(fakePermissionPermit));
          component.uploadWorkflowForm.controls.description.setValue('');
          component.submit();
          tick();
          expect(workflowManagerStub.createWorkflowRecord).toHaveBeenCalledWith(newWorkflowRecord);
          expect(matDialogRef.close).toHaveBeenCalled();
        }));
        it('with keywords', fakeAsync(function () {
          workflowManagerStub.createWorkflowRecord.and.returnValue(of(''));
          workflowManagerStub.checkMasterBranchPermissions.and.returnValue(of(true));
          workflowManagerStub.checkMultiWorkflowDeletePermissions.and.returnValue(of(fakePermissionPermit));
          component.uploadWorkflowForm.controls.keywords.setValue(['Seans', 'keywords']);
          newWorkflowRecord.keywords = ['Seans', 'keywords'];
          component.submit();
          tick();
          expect(workflowManagerStub.createWorkflowRecord).toHaveBeenCalledWith(newWorkflowRecord);
          expect(matDialogRef.close).toHaveBeenCalled();
        }));
      });
    });
  });
});