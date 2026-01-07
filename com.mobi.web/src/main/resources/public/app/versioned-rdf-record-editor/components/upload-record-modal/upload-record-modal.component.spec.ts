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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { Observable, of, Subscription, throwError } from 'rxjs';

import { cleanStylesFromDOM, MockVersionedRdfState } from '../../../../test/ts/Shared';
import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../../shared/injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { UploadRecordModalComponent } from './upload-record-modal.component';
import { VersionedRdfUploadResponse } from '../../../shared/models/versionedRdfUploadResponse.interface';

describe('Upload Record Modal component', function() {
  let component: UploadRecordModalComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<UploadRecordModalComponent<VersionedRdfListItem>>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<UploadRecordModalComponent<VersionedRdfListItem>>>;
  let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const file1: File = new File([], 'ont1.ttl');
  const file2: File = new File([], 'ont2.ttl');
  const error: RESTError = {
    error: 'Error',
    errorMessage: 'Error Message',
    errorDetails: []
  };
  const createResponse: VersionedRdfUploadResponse = {
    recordId: 'recordId',
    branchId: 'branchId',
    commitId: 'commitId'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule
      ],
      declarations: [
        UploadRecordModalComponent,
        MockComponent(KeywordSelectComponent),
      ],
      providers: [
        MockProvider(ToastService),
        { provide: stateServiceToken, useClass: MockVersionedRdfState },
        { provide: MAT_DIALOG_DATA, useValue: { files: [file1, file2] } },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
      ]
    }).compileComponents();

    stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    stateStub.type = 'type';
    fixture = TestBed.createComponent(UploadRecordModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<UploadRecordModalComponent<VersionedRdfListItem>>>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    stateStub.createAndOpen.and.returnValue(of(createResponse));
    stateStub.create.and.returnValue(of(createResponse));

    stateStub.uploadList = [];
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    stateStub = null;
    toastStub = null;
  });

  it('should initialize with the correct values', function() {
    component.ngOnInit();
    expect(component.total).toEqual(2);
    expect(component.uploadOffset).toEqual(0);
    expect(component.file).toEqual(file1);
    expect(component.uploadRecordForm.controls.title.value).toEqual('ont1');
    expect(component.uploadRecordForm.controls.description.value).toEqual('');
    expect(component.uploadRecordForm.controls.keywords.value).toEqual([]);
  });
  describe('controller methods', function() {
    it('should call createAndOpen when only one file has been provided', function() {
      component['_data'].files = [file1];
      component.ngOnInit();
      component.submit();
      expect(stateStub.createAndOpen).toHaveBeenCalledWith({
        file: file1,
        title: 'ont1',
        description: '',
        keywords: []
      });
    });
    describe('submit should call the correct method', function() {
      beforeEach(function() {
        component.ngOnInit();
        stateStub.uploadPending = 0;
        component.uploadRecordForm.controls.title.setValue('title');
        component.uploadRecordForm.controls.description.setValue('description');
        component.uploadRecordForm.controls.keywords.setValue([' keywords ']);
      });
      describe('and set the values correctly if the adjusted index is', function() {
        it('less than files length', function() {
          component.submit();
          expect(stateStub.create).toHaveBeenCalledWith({
            file: file1,
            title: 'title',
            description: 'description',
            keywords: ['keywords']
          });
          expect(component.index).toEqual(1);
          expect(component.uploadRecordForm.controls.title.value).toEqual('ont2');
          expect(component.uploadRecordForm.controls.description.value).toEqual('');
          expect(component.uploadRecordForm.controls.keywords.value).toEqual([]);
          expect(component['_data'].files).toEqual([]);
          expect(component.file).toEqual(file2);
          expect(stateStub.uploadList).toContain({
            sub: jasmine.any(Subscription),
            id: 'upload-0',
            title: 'title',
            status: jasmine.any(Observable),
            error: undefined
          });
          expect(matDialogRef.close).not.toHaveBeenCalled();
        });
        it('equal to files length', function() {
          component.index = 1;
          component.submit();
          expect(component.index).toEqual(1);
          expect(component.uploadRecordForm.controls.title.value).toEqual('title');
          expect(component.uploadRecordForm.controls.description.value).toEqual('description');
          expect(component.uploadRecordForm.controls.keywords.value).toEqual([' keywords ']);
          expect(stateStub.create).toHaveBeenCalledWith({
            file: file1,
            title: 'title',
            description: 'description',
            keywords: ['keywords']
          });
          expect(component['_data'].files).toEqual([]);
          expect(stateStub.uploadList).toContain({
            sub: jasmine.any(Subscription),
            id: 'upload-1',
            title: 'title',
            status: jasmine.any(Observable),
            error: undefined
          });
          expect(matDialogRef.close).toHaveBeenCalledWith();
        });
      });
      describe('when createAndOpen is', function() {
        it('resolved', fakeAsync(function() {
          component.submit();
          fixture.detectChanges();
          tick();
          expect(stateStub.uploadList.length).toEqual(1);
          
          stateStub.uploadList[0].status.subscribe(status => {
            expect(status).toEqual('complete');
          });
          fixture.detectChanges();
          expect(toastStub.createSuccessToast).toHaveBeenCalledWith('Record recordId successfully created.');
          expect(stateStub.uploadList[0].error).toBeUndefined();
        }));
        it('rejected', fakeAsync(function() {
          stateStub.create.and.returnValue(throwError(error));
          component.submit();
          tick();
          expect(stateStub.uploadList.length).toEqual(1);
        
          stateStub.uploadList[0].status.subscribe(status => {
            expect(status).toEqual('error');
          });
          expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
          expect(stateStub.uploadList[0].error).toEqual(error);
        }));
      });
    });
    it('submitAll should call the submit method enough times', function() {
      const spy = spyOn(component, 'submit').and.callFake(() => {
        component.index++;
      });
      component.index = 0;
      component.total = 2;
      component.submitAll();
      expect(spy.calls.count()).toEqual(2);
    });
    it('cancel should call the correct method and set the correct variable', function() {
      component.cancel();
      expect(component['_data'].files).toEqual([]);
      expect(matDialogRef.close).toHaveBeenCalledWith();
    });
    describe('addErrorToUploadItem should add the message to the correct message when', function() {
      const errorObj: RESTError = {
        error: '',
        errorMessage: '',
        errorDetails: []
      };
      beforeEach(function() {
        this.item1 = {
          id: 'id',
          title: '',
          status: undefined,
          sub: undefined,
          error: undefined
        };
        this.item2 = {
          id: 'id2',
          title: '',
          status: undefined,
          sub: undefined,
          error: undefined
        };
        stateStub.uploadList = [this.item1, this.item2];
      });
      it('found', function() {
        component.addErrorToUploadItem('id2', errorObj);
        expect(this.item2.error).toEqual(errorObj);
      });
      it('not found', function() {
        component.addErrorToUploadItem('missing', errorObj);
        expect(this.item1.error).toBeUndefined();
        expect(this.item2.error).toBeUndefined();
      });
    });
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['input[name="title"]', 'textarea', 'keyword-select'].forEach(function(tag) {
      it(`with a ${tag}`, function() {
        expect(element.queryAll(By.css(tag)).length).toEqual(1);
      });
    });
    it('with mat-form-fields', function() {
      expect(element.queryAll(By.css('mat-form-field')).length).toEqual(2);
    });
    it('depending on which file is being processed', function() {
      fixture.detectChanges();
      const counter = element.queryAll(By.css('h1 span'))[0];
      expect(counter).toBeDefined();
      expect(counter.nativeElement.textContent.trim()).toEqual('(1 of 2)');
    });
    it('depending on the validity of the form', function() {
      fixture.detectChanges();
      const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
      expect(button).not.toBeNull();
      expect(button.properties['disabled']).toBeFalsy();
      
      component.uploadRecordForm.controls.title.setValue(null);
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeTruthy();

      component.uploadRecordForm.controls.title.setValue('test');
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeFalsy();
    });
    it('with buttons to cancel, submit, and submit all', function() {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(3);
      expect(['Cancel', 'Submit', 'Submit All']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit', 'Submit All']).toContain(buttons[1].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit', 'Submit All']).toContain(buttons[2].nativeElement.textContent.trim());
    });
  });
});
