/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { DebugElement } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs/internal/observable/of';
import { throwError } from 'rxjs/internal/observable/throwError';
import { map, trim, uniq } from 'lodash';

import { KeywordSelectComponent } from '../../../shared/components/keywordSelect/keywordSelect.component';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { RESTError } from '../../../shared/models/RESTError.interface';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { CamelCasePipe } from '../../../shared/pipes/camelCase.pipe';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { DCTERMS, WORKFLOWS } from '../../../prefixes';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { WorkflowRecordConfig } from '../../models/workflowRecordConfig.interface';
import { XACMLDecision } from '../../../shared/models/XACMLDecision.interface';
import { WorkflowCreationModalComponent } from './workflow-creation-modal.component';

describe('WorkflowCreationModalComponent', () => {
  let component: WorkflowCreationModalComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<WorkflowCreationModalComponent>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<WorkflowCreationModalComponent>>;
  let workflowManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let camelCaseStub: jasmine.SpyObj<CamelCasePipe>;

  const error: RESTError = {
    error: '',
    errorMessage: 'Error',
    errorDetails: []
  };
  const namespace = 'http://mobi.solutions/ontologies/workflows/';
  const fakePermissionPermit: XACMLDecision[] = [
    {
      'urn:oasis:names:tc:xacml:1.0:subject-category:access-subject': 'http://mobi.com/users/d033e22ae348aeb5660fc2140aec35850c4da997',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:resource': 'https://mobi.com/records#0ce1e51e-dd1b-4277-925f-2dc838d0dbc5',
      'urn:oasis:names:tc:xacml:3.0:attribute-category:action': 'http://mobi.com/ontologies/policy#Delete',
      'decision': 'Permit'
    }
  ];

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
        WorkflowCreationModalComponent,
        MockComponent(KeywordSelectComponent),
        MockComponent(ErrorDisplayComponent),
      ],
      providers: [
        MockProvider(WorkflowsManagerService),
        { provide: CamelCasePipe, useClass: MockPipe(CamelCasePipe) },
        { provide: MAT_DIALOG_DATA, useValue: { defaultNamespace: namespace } },
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) }
      ]
    });
  });

  beforeEach(function () {
    fixture = TestBed.createComponent(WorkflowCreationModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    workflowManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<WorkflowCreationModalComponent>>;
    camelCaseStub = TestBed.inject(CamelCasePipe) as jasmine.SpyObj<CamelCasePipe>;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    workflowManagerStub = null;
    camelCaseStub = null;
  });
  it('should initialize the form correctly', function () {
    component.ngOnInit();
    expect(component.newWorkflowForm.controls.iri.value).toEqual(namespace);
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    ['input[name="iri"]', 'input[name="title"]', 'textarea', 'keyword-select'].forEach(function (item) {
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
    it('depending on whether the ontology iri is valid', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('mat-error')).length).toEqual(0);

      component.newWorkflowForm.controls.iri.setValue('test');
      component.newWorkflowForm.controls.iri.markAsTouched();
      fixture.detectChanges();
      expect(element.queryAll(By.css('mat-error')).length).toEqual(1);
    });
    it('depending on the validity of the form', function () {
      const button = element.queryAll(By.css('.mat-dialog-actions button[color="primary"]'))[0];
      expect(button).not.toBeNull();
      expect(button.properties['disabled']).toBeFalsy();

      component.newWorkflowForm.controls.title.setValue(null);
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeTruthy();

      component.newWorkflowForm.controls.title.setValue('test');
      fixture.detectChanges();
      expect(button.properties['disabled']).toBeFalsy();
    });
    it('if the iri field is manually edited', function () {
      spyOn(component, 'manualIRIEdit');
      const input = element.queryAll(By.css('input[name="iri"]'))[0];
      expect(input).toBeTruthy();
      input.triggerEventHandler('input', { target: input.nativeElement });
      expect(component.manualIRIEdit).toHaveBeenCalledWith();
    });
  });
  describe('controller methods', function () {
    it('should set the correct state when the IRI is manually changed', function () {
      component.manualIRIEdit();
      expect(component.iriHasChanged).toBeTrue();
    });
    describe('should handle a title change', function () {
      beforeEach(function () {
        component.newWorkflowForm.controls.iri.setValue(namespace);
        camelCaseStub.transform.and.callFake(a => a);
      });
      it('if the iri has not been manually changed', function () {
        component.nameChanged('new');
        expect(component.newWorkflowForm.controls.iri.value).toEqual(`${namespace}new`);
        expect(camelCaseStub.transform).toHaveBeenCalledWith('new', 'class');
      });
      it('unless the iri has been manually changed', function () {
        component.iriHasChanged = true;
        component.nameChanged('new');
        expect(component.newWorkflowForm.controls.iri.value).toEqual(namespace);
        expect(camelCaseStub.transform).not.toHaveBeenCalled();
      });
    });
    describe('should create a workflow', function () {
      let newWorkflowRecord: WorkflowRecordConfig;

      function setupCommon(): void {
        component.newWorkflowForm.controls.iri.setValue(namespace + 'title');
        component.newWorkflowForm.controls.title.setValue('title');
        component.newWorkflowForm.controls.keywords.setValue([' one', 'two ']);
        component.newWorkflowForm.controls.description.setValue('');
      }
      beforeEach(function () {
        setupCommon();
        workflowManagerStub.createWorkflowRecord.and.returnValue(of(null));

        const newWorkflowIri = component.newWorkflowForm.controls.iri.value;
        const actionId = newWorkflowIri;
        const newWorkflow: JSONLDObject = {
          '@id': `${actionId}`,
          '@type': [`${WORKFLOWS}Workflow`],
          [`${WORKFLOWS}hasAction`]: [{ '@id': `${actionId}/action` }],
        };
        const newAction: JSONLDObject = {
          '@id': `${actionId}/action`,
          '@type': [`${WORKFLOWS}Action`, `${WORKFLOWS}TestAction`],
          [`${WORKFLOWS}testMessage`]: [{ '@value': `This is a test message from ${actionId}/action` }]
        };
        newWorkflowRecord = {
          title: component.newWorkflowForm.controls.title.value,
          description: component.newWorkflowForm.controls.description.value,
          keywords: uniq(map(component.newWorkflowForm.controls.keywords.value, trim)),
          jsonld: [newWorkflow, newAction]
        };
      });
      it('unless an error occurs', fakeAsync(function () {
        const error: RESTError = {
          error: 'Some error message',
          errorMessage: 'Error',
          errorDetails: []
        };
        workflowManagerStub.createWorkflowRecord.and.returnValue(throwError(error));
        component.create();
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
          component.newWorkflowForm.controls.description.setValue('description');
          newWorkflowRecord.description = 'description';
          newWorkflowRecord.jsonld[0][`${DCTERMS}description`] = [{ '@value': 'description' }];
          component.create();
          tick();
          expect(workflowManagerStub.createWorkflowRecord).toHaveBeenCalledWith(newWorkflowRecord);
          expect(matDialogRef.close).toHaveBeenCalled();
        }));
        it('without description', fakeAsync(function () {
          workflowManagerStub.createWorkflowRecord.and.returnValue(of(''));
          workflowManagerStub.checkMasterBranchPermissions.and.returnValue(of(true));
          workflowManagerStub.checkMultiWorkflowDeletePermissions.and.returnValue(of(fakePermissionPermit));
          component.newWorkflowForm.controls.description.setValue('');
          component.create();
          tick();
          expect(workflowManagerStub.createWorkflowRecord).toHaveBeenCalledWith(newWorkflowRecord);
          expect(matDialogRef.close).toHaveBeenCalled();
        }));
      });
    });
  });
});
