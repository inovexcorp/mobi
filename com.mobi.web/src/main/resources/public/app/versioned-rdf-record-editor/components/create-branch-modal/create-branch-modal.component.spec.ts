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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MockComponent, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { of, throwError } from 'rxjs';

import { MockVersionedRdfState, cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { stateServiceToken } from '../../injection-token';
import { CreateBranchModalComponent } from './create-branch-modal.component';

describe('Create branch component', function() {
  let component: CreateBranchModalComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<CreateBranchModalComponent<VersionedRdfListItem>>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateBranchModalComponent<VersionedRdfListItem>>>;
  let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
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
        CreateBranchModalComponent,
        MockComponent(ErrorDisplayComponent)
      ],
      providers: [
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
        MockProvider(CatalogManagerService),
        MockProvider(ToastService),
        { provide: stateServiceToken, useClass: MockVersionedRdfState }
      ]
    }).compileComponents();

    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {'@id': 'catalog', '@type': []};
    fixture = TestBed.createComponent(CreateBranchModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateBranchModalComponent<VersionedRdfListItem>>>;
    stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    stateStub.listItem = new VersionedRdfListItem();
    stateStub.listItem.versionedRdfRecord.recordId = 'recordId';
    stateStub.listItem.versionedRdfRecord.commitId = 'commitId';
    stateStub.updateState.and.returnValue(of(null));

    catalogManagerStub.createRecordBranch.and.returnValue(of('newBranchId'));

    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    stateStub = null;
    catalogManagerStub = null;
  });

  describe('controller methods', function() {
    describe('should create a branch on a versioned RDF record', function() {
      beforeEach(function() {
        component.createBranchForm.controls['title'].setValue('New Branch');
        component.createBranchForm.controls['description'].setValue('New Branch Description');
        this.branchConfig = {
          title: 'New Branch',
          description: 'New Branch Description'
        };
      });
      describe('and update the record state', function() {
        it('successfully', async function() {
          await component.createBranch();

          expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith('recordId', 'catalog', this.branchConfig, 'commitId');
          expect(stateStub.updateState).toHaveBeenCalledWith({
            recordId: 'recordId', 
            branchId: 'newBranchId', 
            commitId: 'commitId', 
            tagId: undefined
          });
          expect(matDialogRef.close).toHaveBeenCalledWith(true);
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
        });
        it('unless an error occurs', async function() {
          stateStub.updateState.and.returnValue(throwError('Error'));
          await component.createBranch();

          expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith('recordId', 'catalog', this.branchConfig, 'commitId');
          expect(stateStub.updateState).toHaveBeenCalledWith({
            recordId: 'recordId', 
            branchId: 'newBranchId', 
            commitId: 'commitId', 
            tagId: undefined
          });
          expect(matDialogRef.close).toHaveBeenCalledWith(false);
          expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
        });
      });
      it('unless an error occurs', async function() {
        catalogManagerStub.createRecordBranch.and.returnValue(throwError('Error'));
        await component.createBranch();

        expect(catalogManagerStub.createRecordBranch).toHaveBeenCalledWith('recordId', 'catalog', this.branchConfig, 'commitId');
        expect(stateStub.updateState).not.toHaveBeenCalled();
        expect(matDialogRef.close).toHaveBeenCalledWith(false);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Error');
      });
    });
  });
  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('.create-branch-modal')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('input')).length).toEqual(1);
      expect(element.queryAll(By.css('textarea')).length).toEqual(1);
    });
    it('with buttons to cancel and submit', function() {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  it('should call commit when the submit button is clicked', function() {
    spyOn(component, 'createBranch');
    const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    setButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.createBranch).toHaveBeenCalledWith();
  });
});
