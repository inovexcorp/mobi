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
import { HttpEventType, HttpResponse, HttpHeaderResponse } from '@angular/common/http';
import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  cleanStylesFromDOM,
} from '../../../../../public/test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { RestErrorDisplayComponent } from '../../../shared/components/restErrorDisplay/restErrorDisplay.component';
import { FileInputComponent } from '../../../shared/components/fileInput/fileInput.component';
import { Dataset } from '../../../shared/models/dataset.interface';
import { DatasetManagerService } from '../../../shared/services/datasetManager.service';
import { DatasetStateService } from '../../../shared/services/datasetState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UploadDataOverlayComponent } from './uploadDataOverlay.component';
import { DCTERMS } from '../../../prefixes';

describe('Upload Data Overlay component', function () {
  let component: UploadDataOverlayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<UploadDataOverlayComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadDataOverlayComponent>>;
  let datasetManagerStub: jasmine.SpyObj<DatasetManagerService>;
  let datasetStateStub: jasmine.SpyObj<DatasetStateService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const recordId = 'recordId';
  const record = {
    '@id': recordId,
    [`${DCTERMS}title`]: [{ '@value': 'Test' }]
  };
  const dataset: Dataset = { record, identifiers: [] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatDialogModule,
        MatButtonModule,
        MatProgressBarModule,
        NoopAnimationsModule
      ],
      declarations: [
        UploadDataOverlayComponent,
        MockComponent(ErrorDisplayComponent),
        MockComponent(RestErrorDisplayComponent),
        MockComponent(FileInputComponent)
      ],
      providers: [
        MockProvider(DatasetManagerService),
        MockProvider(DatasetStateService),
        MockProvider(ToastService),
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadDataOverlayComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UploadDataOverlayComponent>>;
    datasetManagerStub = TestBed.inject(DatasetManagerService) as jasmine.SpyObj<DatasetManagerService>;
    datasetStateStub = TestBed.inject(DatasetStateService) as jasmine.SpyObj<DatasetStateService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    datasetStateStub.selectedDataset = dataset;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    datasetManagerStub = null;
    datasetStateStub = null;
    toastStub = null;
  });

  it('initializes with the correct values', function () {
    component.ngOnInit();
    expect(component.datasetTitle).toEqual('Test');
    expect(component.uploadPhase).toEqual('idle');
    expect(component.uploadProgress).toEqual(0);
  });
  describe('controller methods', function () {
    describe('should upload data to a dataset', function () {
      it('unless an error occurs', fakeAsync(function () {
        const errorObj = {error: 'Error', errorMessage: 'Error Message', errorDetails: []};
        datasetManagerStub.uploadData.and.callFake(() => throwError(errorObj));
        component.submit();
        tick(1);
        expect(datasetManagerStub.uploadData).toHaveBeenCalledWith(recordId, component.fileObj);
        expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        expect(matDialogRef.close).not.toHaveBeenCalled();
        expect(component.uploadPhase).toEqual('idle');
        expect(component.error).toEqual(errorObj);
      }));
      it('tracks upload progress', fakeAsync(function () {
        const events = of(
          { type: HttpEventType.UploadProgress, loaded: 50, total: 100 },
          { type: HttpEventType.UploadProgress, loaded: 100, total: 100 },
          new HttpHeaderResponse({ status: 200 }),
          new HttpResponse({ body: 'ok' })
        ).pipe(delay(1));
        datasetManagerStub.uploadData.and.returnValue(events as any);
        component.fileObj = new File([''], '');
        component.submit();
        expect(component.uploadPhase).toEqual('uploading');
        expect(component.uploadProgress).toEqual(0);
        tick(1);
        expect(datasetManagerStub.uploadData).toHaveBeenCalledWith(recordId, component.fileObj);
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(matDialogRef.close).toHaveBeenCalledWith();
        expect(component.error).toBeUndefined();
      }));
      it('successfully with response event', fakeAsync(function () {
        const events = of(
          new HttpResponse({ body: 'ok' })
        ).pipe(delay(1));
        datasetManagerStub.uploadData.and.returnValue(events as any);
        component.fileObj = new File([''], '');
        component.submit();
        expect(component.uploadPhase).toEqual('uploading');
        tick(1);
        expect(datasetManagerStub.uploadData).toHaveBeenCalledWith(recordId, component.fileObj);
        expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        expect(matDialogRef.close).toHaveBeenCalledWith();
      }));
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    it('with a file-input', function () {
      expect(element.queryAll(By.css('file-input')).length).toBe(1);
    });
    it('depending on whether there is an error', function () {
      expect(element.queryAll(By.css('rest-error-display')).length).toEqual(0);
      component.error = {error: 'Error', errorMessage: 'Error message', errorDetails: []};
      fixture.detectChanges();
      expect(element.queryAll(By.css('rest-error-display')).length).toEqual(1);
    });
    it('depending on whether data is uploading', function () {
      fixture.detectChanges();
      const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
      expect(element.queryAll(By.css('.importing-indicator')).length).toEqual(0);
      expect(button.properties['disabled']).toBeTruthy();

      component.uploadPhase = 'uploading';
      fixture.detectChanges();
      expect(element.queryAll(By.css('.importing-indicator')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-progress-bar')).length).toEqual(1);
      expect(button.properties['disabled']).toBeTruthy();

      component.uploadPhase = 'processing';
      fixture.detectChanges();
      expect(element.queryAll(By.css('.importing-indicator')).length).toEqual(1);
      expect(button.properties['disabled']).toBeTruthy();

      component.uploadPhase = 'idle';
      component.fileObj = new File([''], '');
      fixture.detectChanges();
      expect(element.queryAll(By.css('.importing-indicator')).length).toEqual(0);
      expect(button.properties['disabled']).toBeFalsy();
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
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
  it('should call add when the submit button is clicked', function () {
    spyOn(component, 'submit');
    const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    submitButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.submit).toHaveBeenCalledWith();
  });
});
