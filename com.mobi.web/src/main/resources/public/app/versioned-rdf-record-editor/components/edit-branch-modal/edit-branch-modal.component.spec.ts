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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { CATALOG, DCTERMS } from '../../../prefixes';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { EditBranchModalComponent } from './edit-branch-modal.component';

describe('Edit Branch Modal component', () => {
  let component: EditBranchModalComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<EditBranchModalComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<EditBranchModalComponent>>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;

  const error = 'Error Message';
  const catalogId = 'catalogId';
  const recordId = 'recordId';
  const branchId = 'branchId';
  const branch: JSONLDObject = {
    '@id': branchId,
    '@type': [`${CATALOG}Branch`],
    [`${DCTERMS}title`]: [{ '@value': 'title' }],
    [`${DCTERMS}description`]: [{ '@value': 'description' }],
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
        EditBranchModalComponent,
        MockComponent(ErrorDisplayComponent),
      ],
      providers: [
        MockProvider(CatalogManagerService),
        { provide: MAT_DIALOG_DATA, useValue: { branch, recordId } },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])}
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditBranchModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditBranchModalComponent>>;

    catalogManagerStub.localCatalog = {'@id': catalogId};
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    catalogManagerStub = null;
  });

  it('should initialize correctly', () => {
    component.data.branch = branch;
    component.ngOnInit();
    expect(component.editBranchForm.controls.title.value).toEqual('title');
    expect(component.editBranchForm.controls.description.value).toEqual('description');
  });
  describe('controller methods', () => {
    describe('edit calls the correct methods', () => {
      beforeEach(() => {
        component.editBranchForm.controls.title.setValue('title');
        component.data.branch = cloneDeep(branch);
        catalogManagerStub.updateRecordBranch.and.returnValue(of(null));
      });
      describe('with initial setup', () => {
        it('when branch description is not set', () => {
          component.edit();
          expect(component.data.branch[`${DCTERMS}description`]).toBeFalsy();
        });
        it('when branch description is set', () => {
          component.editBranchForm.controls.description.setValue('new description');
          component.edit();
          expect(component.data.branch[`${DCTERMS}description`]).toEqual([{ '@value': 'new description'}]);
        });
      });
      it('when resolved', fakeAsync(() => {
        component.edit();
        tick();
        expect(catalogManagerStub.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, component.data.branch);
        expect(component.errorMessage).toEqual('');
        expect(matDialogRef.close).toHaveBeenCalledWith(true);
      }));
      it('when rejected', fakeAsync(() => {
        catalogManagerStub.updateRecordBranch.and.returnValue(throwError(error));
        component.edit();
        tick();
        expect(catalogManagerStub.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, component.data.branch);
        expect(component.errorMessage).toEqual(error);
        expect(matDialogRef.close).not.toHaveBeenCalled();
      }));
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['input[name="title"]', 'textarea'].forEach(function(item) {
      it(`with a ${item}`, () => {
        expect(element.queryAll(By.css(item)).length).toEqual(1);
      });
    });
    it('depending on whether an error occurred', () => {
      expect(element.queryAll(By.css('error-display')).length).toEqual(0);

      component.errorMessage = error;
      fixture.detectChanges();
      expect(element.queryAll(By.css('error-display')).length).toEqual(1);
    });
    it('with buttons to cancel and submit', () => {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
    it('depending on the validity of the form', () => {
      fixture.detectChanges();
      const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
      expect(button).not.toBeNull();
      expect(button.properties['disabled']).toBeFalsy();
      
      component.editBranchForm.controls.title.setValue(null);
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeTruthy();

      component.editBranchForm.controls.title.setValue('test');
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeFalsy();
    });
  });
  it('should call cancel when the button is clicked', () => {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
  it('should call edit when the button is clicked', () => {
    spyOn(component, 'edit');
    const submitButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    submitButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(component.edit).toHaveBeenCalledWith();
  });
});
