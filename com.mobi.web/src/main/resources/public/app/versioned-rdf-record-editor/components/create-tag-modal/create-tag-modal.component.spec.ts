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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { MockVersionedRdfState, cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { VersionedRdfListItem } from '../../../shared/models/versionedRdfListItem.class';
import { stateServiceToken } from '../../injection-token';
import { VersionedRdfState } from '../../../shared/services/versionedRdfState.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { CreateTagModalComponent } from './create-tag-modal.component';

describe('Create Tag Modal component', function() {
  let component: CreateTagModalComponent<VersionedRdfListItem>;
  let element: DebugElement;
  let fixture: ComponentFixture<CreateTagModalComponent<VersionedRdfListItem>>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<CreateTagModalComponent<VersionedRdfListItem>>>;
  let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
  let stateStub: jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
  let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;

  const error: RESTError = {
    error: '',
    errorDetails: [],
    errorMessage: 'Error Message'
  };

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
        CreateTagModalComponent,
        MockComponent(ErrorDisplayComponent),
      ],
      providers: [
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
        MockProvider(CatalogManagerService),
        { provide: stateServiceToken, useClass: MockVersionedRdfState },
        { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) }
      ]
    }).compileComponents();

    catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
    catalogManagerStub.localCatalog = {'@id': 'catalog'};
    catalogManagerStub.createRecordTag.and.returnValue(of('urn:tag'));

    fixture = TestBed.createComponent(CreateTagModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<CreateTagModalComponent<VersionedRdfListItem>>>;
    stateStub = TestBed.inject(stateServiceToken) as jasmine.SpyObj<VersionedRdfState<VersionedRdfListItem>>;
    stateStub.listItem = new ShapesGraphListItem();
    stateStub.listItem.versionedRdfRecord.recordId = 'recordId';
    stateStub.listItem.versionedRdfRecord.commitId = 'commitId';
    stateStub.updateState.and.returnValue(of(null));
    stateStub.getIdentifierIRI.and.returnValue('shapesGraphId');
    camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    stateStub = null;
    catalogManagerStub = null;
    camelCaseStub = null;
  });

  describe('controller methods', function() {
    beforeEach(function() {
      component.createTagForm.controls['title'].setValue('New Tag');
      component.createTagForm.controls['description'].setValue('New Tag Description');
      component.createTagForm.controls['iri'].setValue('urn:tag');
      this.tagConfig = {
        title: 'New Tag',
        iri: 'urn:tag',
        description: 'New Tag Description',
        commitId: 'commitId'
      };
    });
    it('should init with the correct IRI prefix', function() {
      component.ngOnInit();

      expect(component.createTagForm.controls.iri.value).toEqual('shapesGraphId/');
    });
    describe('nameChanged should update the IRI', function() {
      it('when the IRI has not been edited directly', function() {
        expect(component.createTagForm.controls.iri.value).toEqual('urn:tag');
        camelCaseStub.transform.and.returnValue('camelCase');
        component.nameChanged();

        expect(camelCaseStub.transform).toHaveBeenCalledWith('New Tag', 'class');
        expect(component.createTagForm.controls.iri.value).toEqual('urn:camelCase');
      });
      it('unless the IRI has not been edited directly', function() {
        expect(component.createTagForm.controls.iri.value).toEqual('urn:tag');
        component.iriHasChanged = true;
        component.nameChanged();

        expect(camelCaseStub.transform).not.toHaveBeenCalled();
        expect(component.createTagForm.controls.iri.value).toEqual('urn:tag');
      });
    });
    describe('should create a tag on a versioned RDF record', function() {
      describe('and update the record state', function() {
        it('successfully', async function() {
          await component.createTag();

          expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith('recordId', 'catalog', this.tagConfig);
          expect(stateStub.updateState).toHaveBeenCalledWith({
            recordId: 'recordId', 
            branchId: undefined, 
            commitId: 'commitId', 
            tagId: 'urn:tag'
          });
          expect(matDialogRef.close).toHaveBeenCalledWith(true);
          expect(component.error).toEqual('');
        });

        it('unless an error occurs', async function() {
          stateStub.updateState.and.returnValue(throwError(error.errorMessage));
          await component.createTag();

          expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith('recordId', 'catalog', this.tagConfig);
          expect(stateStub.updateState).toHaveBeenCalledWith({
            recordId: 'recordId', 
            branchId: undefined, 
            commitId: 'commitId', 
            tagId: 'urn:tag'
          });
          expect(component.error).toEqual(error.errorMessage);
        });
      });
      it('unless an error occurs', async function() {
        catalogManagerStub.createRecordTag.and.returnValue(throwError(error));
        await component.createTag();

        expect(catalogManagerStub.createRecordTag).toHaveBeenCalledWith('recordId', 'catalog', this.tagConfig);
        expect(stateStub.updateState).not.toHaveBeenCalled();
        expect(component.error).toEqual(error.errorMessage);
      });
    });
  });

  describe('contains the correct html', function() {
    it('for wrapping containers', function() {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('input')).length).toEqual(2);
      expect(element.queryAll(By.css('textarea')).length).toEqual(1);
    });
    it('with buttons to cancel and submit', function() {
      const buttons = element.queryAll(By.css('button'));

      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });

  it('should call createTag when the submit button is clicked', function() {
    spyOn(component, 'createTag');
    const setButton = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
    setButton.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.createTag).toHaveBeenCalledWith();
  });
});
