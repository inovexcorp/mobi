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
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { Difference } from '../../../shared/models/difference.class';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { PolicyManagerService } from '../../../shared/services/policyManager.service';
import { ProgressSpinnerService } from '../../../shared/components/progress-spinner/services/progressSpinner.service';
import { ShaclValidationReportComponent } from '../shacl-validation-report/shacl-validation-report.component';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowUploadChangesModalComponent } from './workflow-upload-changes-modal.component';

describe('WorkflowUploadChangesModalComponent', () => {
  let component: WorkflowUploadChangesModalComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<WorkflowUploadChangesModalComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<WorkflowUploadChangesModalComponent>>;
  let workflowManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  const file: File = new File(['sample text'], 'filename', { type: 'jsonld' });
  const rdfUpdate = {
    recordId: 'record1',
    branchId: 'branch1',
    commitId: 'commit1',
  };
  const mockSuccessfulHTTPResponse = new HttpResponse({
    headers: new HttpHeaders(),
    status: 200,
    statusText: 'OK',
    url: null,
    body: null // You can set the body to any desired value
  });
  const inProgressCommit = new Difference();
  inProgressCommit.additions = [{'@id': '12345', '@type': []}];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDialogModule,
        MatButtonModule,
        NoopAnimationsModule,
        MatChipsModule,
        MatIconModule
      ],
      declarations: [
        WorkflowUploadChangesModalComponent,
        MockComponent(ErrorDisplayComponent),
        MockComponent(FileInputComponent),
        MockComponent(ShaclValidationReportComponent)
      ],
      providers: [
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
        MockProvider(WorkflowsManagerService),
        MockProvider(ProgressSpinnerService),
        MockProvider(PolicyManagerService),
        MockProvider(MAT_DIALOG_DATA)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowUploadChangesModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<WorkflowUploadChangesModalComponent>>;
    workflowManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;

    workflowManagerStub.uploadChanges.and.returnValue(of(new HttpResponse<null>({body: null, status: 200})));
    component.data = rdfUpdate;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    workflowManagerStub = null;
  });

  describe('controller methods', () => {
    describe('should upload changes and update the inProgressCommit and close the dialog', () => {
      it('successfully', fakeAsync(() => {
        component.file = file;
        component.submit();
        tick();
        expect(workflowManagerStub.uploadChanges).toHaveBeenCalledWith(component.data.recordId, component.data.branchId, component.data.commitId, file);
        expect(matDialogRef.close).toHaveBeenCalledWith(mockSuccessfulHTTPResponse);
      }));
      it('unless an error occurs', fakeAsync(() => {
        component.file = file;
        workflowManagerStub.uploadChanges.and.returnValue(throwError({error: '', errorMessage: '', errorDetails: []}));
        component.submit();
        tick();
        expect(workflowManagerStub.uploadChanges).toHaveBeenCalledWith(component.data.recordId, component.data.branchId, component.data.commitId, file);
        expect(matDialogRef.close).not.toHaveBeenCalled();
        expect(component.error).toEqual({error: '', errorMessage: '', errorDetails: []});
      }));
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('file-input')).length).toEqual(1);
    });
    it('if an InvalidWorkflowException error occurred', () => {
      expect(element.queryAll(By.css('app-shacl-validation-report')).length).toEqual(0);
      expect(element.queryAll(By.css('error-display')).length).toEqual(0);
      component.error = {
        error: 'InvalidWorkflowException',
        errorMessage: 'Error',
        errorDetails: []
      };
      fixture.detectChanges();

      expect(element.queryAll(By.css('app-shacl-validation-report')).length).toEqual(1);
      expect(element.queryAll(By.css('error-display')).length).toEqual(1);
    });
    it('if a standard error occurred', () => {
      expect(element.queryAll(By.css('app-shacl-validation-report')).length).toEqual(0);
      expect(element.queryAll(By.css('error-display')).length).toEqual(0);
      component.error = {
        error: 'IllegalArgumentException',
        errorMessage: 'Error',
        errorDetails: []
      };
      fixture.detectChanges();

      expect(element.queryAll(By.css('app-shacl-validation-report')).length).toEqual(0);
      expect(element.queryAll(By.css('error-display')).length).toEqual(1);
    });
    it('with buttons to cancel and submit', () => {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  it('should call uploadChanges when the submit button is clicked', () => {
    spyOn(component, 'submit');
    const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    setButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.submit).toHaveBeenCalledWith();
  });
});
