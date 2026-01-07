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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockComponent, MockProvider } from 'ng-mocks';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { WorkflowDownloadModalComponent } from './workflow-download-modal.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { workflow_mocks } from '../../models/mock_data/workflow-mocks';
import { SerializationSelectComponent } from '../../../shared/components/serializationSelect/serializationSelect.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CATALOG } from '../../../prefixes';
import { InfoMessageComponent } from '../../../shared/components/infoMessage/infoMessage.component';

describe('WorkflowDownloadModalComponent', () => {
  let component: WorkflowDownloadModalComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<WorkflowDownloadModalComponent>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<WorkflowDownloadModalComponent>>;
  let toastStub: jasmine.SpyObj<ToastService>;
  const branch: JSONLDObject = {
    '@id': 'branchId',
    '@type': [`${CATALOG}Branch`],
    [`${CATALOG}head`]: [{ '@id': 'commitId' }]
  };
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatDialogModule,
        FormsModule,
        ReactiveFormsModule,
      ],
      declarations: [ 
        WorkflowDownloadModalComponent,
        MockComponent(SerializationSelectComponent),
        MockComponent(InfoMessageComponent)
      ],
      providers: [
        MockProvider(CatalogManagerService),
        MockProvider(MatDialogRef),
        MockProvider(ToastService),
        MockProvider(MAT_DIALOG_DATA),
        { provide: MAT_DIALOG_DATA, useValue: { workflows: workflow_mocks, applyInProgressCommit: false } },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowDownloadModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<WorkflowDownloadModalComponent>>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    fixture.detectChanges();
  });

  it('should initialize correctly', function () {
    expect(component.downloadForm.controls.serialization.value).toEqual('turtle');
  });
  describe('controller methods', function () {
    it('should download a workflow', function () {
      catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
      component.download();
      expect(catalogManagerStub.downloadResource).toHaveBeenCalled();
      expect(matDialogRef.close).toHaveBeenCalledWith(true);
    });
    it('should download a workflow w/ in progress commit', function () {
      catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
      component.data.applyInProgressCommit = true;
      component.download();
      expect(catalogManagerStub.downloadResource).toHaveBeenCalledWith('commitId', 'https://mobi.com/branches#5ce0a198-875a-4b3c-84f7-9dc2ca318197',
       'https://mobi.com/records#87ecd33d-c5c4-441a-9d8c-33151bc32952', '', true, 'turtle', 'PipeDreamHarmony');
      expect(matDialogRef.close).toHaveBeenCalledWith(true);
    });
    it('should error if incorrect jsonld', function () {
      catalogManagerStub.getRecordBranch.and.returnValue(of(null));
      component.download();
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(`Invalid JSON-LD object received for: ${component.data.workflows[0].title}`);
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(`Invalid JSON-LD object received for: ${component.data.workflows[1].title}`);
      expect(matDialogRef.close).toHaveBeenCalledWith(true);
    });
    it('should error if download fails', function () {
      catalogManagerStub.getRecordBranch.and.returnValue(of(branch));
      catalogManagerStub.downloadResource.and.throwError('Fake download error');
      component.download();
      expect(toastStub.createErrorToast).toHaveBeenCalledWith(`Error downloading: ${component.data.workflows[0].title}`);
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    it('with a serialization select', function () {
      expect(element.queryAll(By.css('serialization-select')).length).toBe(1);
    });
    it('with an info message', function () {
      expect(element.queryAll(By.css('info-message')).length).toBe(1);
    });
    it('without an info message', function () {
      component.displayInfoMessage = false;
      fixture.detectChanges();
      expect(element.queryAll(By.css('info-message')).length).toBe(0);
    });
    it('with buttons to cancel and submit', function () {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  it('should call cancel when the button is clicked', function () {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(false);
  });
  it('should call download when the button is clicked', function () {
    spyOn(component, 'download');
    const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    submitButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.download).toHaveBeenCalledWith();
  });
});
