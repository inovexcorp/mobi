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
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { MockComponent, MockProvider } from 'ng-mocks';
import { cloneDeep } from 'lodash';
import { of, throwError } from 'rxjs';

import { actionSHACLDefinitions, testActionNodeShape, triggerSHACLDefinitions } from '../../models/mock_data/workflow-mocks';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { Difference } from '../../../shared/models/difference.class';
import { 
  DownloadMappingOverlayComponent
} from '../../../mapper/components/downloadMappingOverlay/downloadMappingOverlay.component';
import { EntityType } from '../../models/workflow-display.interface';
import { FormValues } from '../../../shacl-forms/models/form-values.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ModalConfig, ModalType } from '../../models/modal-config.interface';
import { SHACLFormComponent } from '../../../shacl-forms/components/shacl-form/shacl-form.component';
import { SHACLFormFieldComponent } from '../../../shacl-forms/components/shacl-form-field/shacl-form-field.component';
import { SHACLFormManagerService } from '../../../shacl-forms/services/shaclFormManager.service';
import { WORKFLOWS } from '../../../prefixes';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowAddConfigurationComponent } from './workflow-add-configuration.component';

describe('WorkflowAddConfigurationComponent', () => {
  let component: WorkflowAddConfigurationComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<WorkflowAddConfigurationComponent>;
  let workflowsManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<DownloadMappingOverlayComponent>>;

  const action: JSONLDObject = {
    '@id': 'workflows:action',
    '@type': [
      `${WORKFLOWS}Action`,
      `${WORKFLOWS}TestAction`
    ],
    [`${WORKFLOWS}testMessage`]: [
      {
        '@value': 'Original'
      }
    ]
  };
  const trigger: JSONLDObject = {
    '@id': 'workflows:trigger',
    '@type': [
      `${WORKFLOWS}Trigger`,
      `${WORKFLOWS}EventTrigger`,
      `${WORKFLOWS}CommitToBranchTrigger`
    ],
    [`${WORKFLOWS}watchesRecord`]: [
      {
        '@id': 'urn:record'
      }
    ],
    [`${WORKFLOWS}watchesBranch`]: [
      {
        '@id': 'urn:branch'
      }
    ]
  };
  const objectConfig: ModalConfig = {
    recordIRI: 'http://www.example/id/1',
    workflowIRI: 'id:one',
    shaclDefinitions: actionSHACLDefinitions,
    entityType: EntityType.ACTION,
    mode: ModalType.ADD,
    parentIRI: 'id:one',
    parentProp: `${WORKFLOWS}hasAction`
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatSelectModule,
        NoopAnimationsModule,
        MatDialogModule,
        MatButtonModule
      ],
      providers: [
        MockProvider(WorkflowsManagerService),
        MockProvider(SHACLFormManagerService),
        {provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close'])},
        {provide: MAT_DIALOG_DATA, useValue: objectConfig},
      ],
      declarations: [
        WorkflowAddConfigurationComponent,
        MockComponent(SHACLFormComponent),
        MockComponent(SHACLFormFieldComponent),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkflowAddConfigurationComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    workflowsManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DownloadMappingOverlayComponent>>;
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialogRef = null;
    matDialogRef = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should initialize correctly', () => {
    beforeEach(() => {
      spyOn(component, 'setFormValues');
    });
    it('the configuration types', () => {
      component.ngOnInit();
      expect(component.configurationTypeIris).toEqual(Object.keys(actionSHACLDefinitions));
      expect(component.configurationList.length).toEqual(Object.keys(actionSHACLDefinitions).length);
      expect(component.configurationList[0].value).toEqual(`${WORKFLOWS}TestAction`);
      expect(component.configurationList[0].label).toEqual('Test Action');
      expect(component.configurationList[0].formValues).toBeUndefined();
      expect(component.configurationList[0].nodeShape).toEqual(testActionNodeShape);
      expect(component.configurationList[0].formFieldConfigs.length).toBeTruthy();
      expect(component.configurationList[0].formFieldConfigs[0].isValid).toBeTruthy();
    });
    it('if in add mode', () => {
      component.ngOnInit();
      expect(component.setFormValues).not.toHaveBeenCalled();
      expect(component.modalTitle).toEqual('Add - Action');
    });
    it('if in edit mode', () => {
      setEditMode();
      component.selectedConfiguration = {
        value: `${WORKFLOWS}TestAction`,
        label: 'Test Action',
        nodeShape: undefined,
        formFieldConfigs: [],
        formValues: undefined
      };
      component.ngOnInit();
      expect(component.setFormValues).toHaveBeenCalledWith();
      expect(component.modalTitle).toEqual('Edit - Test Action');      
    });
  });
  describe('controller methods', () => {
    it('should set the FormValues', () => {
      component.data.selectedConfigIRI = action['@id'];
      component.data.workflowEntity = [action];
      fixture.detectChanges();
      component.setFormValues();
      expect(component.entityBeingEdited).toEqual(action);
      expect(component.configurationFormGroup.controls.configType.value).toEqual(component.selectedConfiguration);
      expect(component.selectedConfiguration.label).toEqual('Test Action');
      expect(component.selectedConfiguration.value).toEqual(`${WORKFLOWS}TestAction`);
    });
    it('should set the getConfigurationType', () => {
      const types = component.getConfigurationType(action['@type']);
      expect(types.length).toEqual(1);
      expect(types[0]).toEqual(`${WORKFLOWS}TestAction`);
    });
    it('should update the SHACL form values', () => {
      fixture.detectChanges();
      component.selectedConfiguration = component.configurationList[0];
      const formValues: FormValues = { 'test': 'test' };
      component.updateFormValues(formValues);
      expect(component.selectedConfiguration.formValues).toEqual(formValues);
    });
    it('should handle updates to the SHACL form validity', () => {
      component.updateFormValidity('VALID');
      expect(component.shaclFormValid).toBeTrue();
      expect(component.submitDisabled).toBeFalse();

      component.updateFormValidity('INVALID');
      expect(component.shaclFormValid).toBeFalse();
      expect(component.submitDisabled).toBeTrue();
    });
    describe('should submit the modal', () => {
      it('unless the form is invalid', () => {
        fixture.detectChanges();
        component.submit();
        expect(workflowsManagerStub.updateWorkflowConfiguration).not.toHaveBeenCalled();
        expect(matDialogRef.close).not.toHaveBeenCalled();

        component.configurationFormGroup.controls.configType.setValue(component.configurationList[0]);
        component.submit();
        expect(workflowsManagerStub.updateWorkflowConfiguration).not.toHaveBeenCalled();
        expect(matDialogRef.close).not.toHaveBeenCalled();
      });
      it('if there are no changes', () => {
        setEditMode();
        fixture.detectChanges();
        component.configurationFormGroup.controls.configType.setValue(component.configurationList[0]);
        component.shaclFormValid = true;
        component.submit();
        expect(workflowsManagerStub.updateWorkflowConfiguration).not.toHaveBeenCalled();
        expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
      });
      describe('if an action is being', () => {
        describe('added', () => {
          beforeEach(() => {
            fixture.detectChanges();
            component.shaclFormValid = true;
            component.configurationFormGroup.controls.configType.setValue(component.configurationList[0]);
            component.selectedConfiguration = component.configurationList[0];
            component.selectedConfiguration.formValues = {
              [`${WORKFLOWS}testMessage`]: 'New'
            };
          });
          describe('beneath the workflow and the changes update', () => {
            it('succeeds', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
              component.submit();
              tick();
              expect(component.errorMsg).toEqual('');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(2);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': objectConfig.workflowIRI,
                [`${WORKFLOWS}hasAction`]: [{ '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`)}]
              });
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`),
                '@type': [`${WORKFLOWS}TestAction`, `${WORKFLOWS}Action`],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'New' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
              expect(matDialogRef.close).toHaveBeenCalledWith(jasmine.any(Difference));
            }));
            it('fails', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
              component.submit();
              tick();
              expect(component.errorMsg).toBeTruthy();
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(2);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': objectConfig.workflowIRI,
                [`${WORKFLOWS}hasAction`]: [{ '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`)}]
              });
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`),
                '@type': [`${WORKFLOWS}TestAction`, `${WORKFLOWS}Action`],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'New' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
              expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
          });
          describe('beneath an action and the changes update', () => {
            const parentIRI = 'urn:another-action';
            beforeEach(() => {
              const dataClone = cloneDeep(component.data);
              dataClone.parentIRI = parentIRI;
              dataClone.parentProp = `${WORKFLOWS}hasChildAction`;
              component.data = dataClone;
            });
            it('succeeds', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
              component.submit();
              tick();
              expect(component.errorMsg).toEqual('');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(2);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': parentIRI,
                [`${WORKFLOWS}hasChildAction`]: [{ '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`)}]
              });
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`),
                '@type': [`${WORKFLOWS}TestAction`, `${WORKFLOWS}Action`],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'New' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
              expect(matDialogRef.close).toHaveBeenCalledWith(jasmine.any(Difference));
            }));
            it('fails', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
              component.submit();
              tick();
              expect(component.errorMsg).toBeTruthy();
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(2);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': parentIRI,
                [`${WORKFLOWS}hasChildAction`]: [{ '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`)}]
              });
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/action`),
                '@type': [`${WORKFLOWS}TestAction`, `${WORKFLOWS}Action`],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'New' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
              expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
          });
        });
        describe('edited', () => {
          beforeEach(() => {
            setEditMode();
            fixture.detectChanges();
            component.shaclFormValid = true;
          });
          describe('and the type changed and the changes update', () => {
            beforeEach(() => {
              component.configurationFormGroup.controls.configType.setValue(component.configurationList[1]);
              component.selectedConfiguration = component.configurationList[1];
              component.selectedConfiguration.formValues = {
                [`${WORKFLOWS}hasHttpUrl`]: 'http://test.com',
                [`${WORKFLOWS}hasHeader`]: [
                  {
                    [`${WORKFLOWS}hasHeaderName`]: 'X-Test',
                    [`${WORKFLOWS}hasHeaderValue`]: 'Test Value',
                  }
                ],
              };
            });
            it('succeeds', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
              component.submit();
              tick();
              expect(component.errorMsg).toEqual('');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(2);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                '@type': [`${WORKFLOWS}HTTPRequestAction`],
                [`${WORKFLOWS}hasHttpUrl`]: [{ '@value': 'http://test.com' }],
                [`${WORKFLOWS}hasHeader`]: [{ '@id': jasmine.any(String) }]
              });
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': jasmine.any(String),
                '@type': [`${WORKFLOWS}Header`],
                [`${WORKFLOWS}hasHeaderName`]: [{ '@value': 'X-Test' }],
                [`${WORKFLOWS}hasHeaderValue`]: [{ '@value': 'Test Value' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                '@type': [`${WORKFLOWS}TestAction`],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'Original' }]
              });
              expect(matDialogRef.close).toHaveBeenCalledWith(jasmine.any(Difference));
            }));
            it('fails', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
              component.submit();
              tick();
              expect(component.errorMsg).toBeTruthy();
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(2);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                '@type': [`${WORKFLOWS}HTTPRequestAction`],
                [`${WORKFLOWS}hasHttpUrl`]: [{ '@value': 'http://test.com' }],
                [`${WORKFLOWS}hasHeader`]: [{ '@id': jasmine.any(String) }]
              });
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': jasmine.any(String),
                '@type': [`${WORKFLOWS}Header`],
                [`${WORKFLOWS}hasHeaderName`]: [{ '@value': 'X-Test' }],
                [`${WORKFLOWS}hasHeaderValue`]: [{ '@value': 'Test Value' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                '@type': [`${WORKFLOWS}TestAction`],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'Original' }]
              });
              expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
          });
          describe('and the type stayed the same and the changes update', () => {
            beforeEach(() => {
              component.configurationFormGroup.controls.configType.setValue(component.configurationList[0]);
              component.selectedConfiguration = component.configurationList[0];
              component.selectedConfiguration.formValues = {
                [`${WORKFLOWS}testMessage`]: 'New'
              };
            });
            it('succeeds', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
              component.submit();
              tick();
              expect(component.errorMsg).toEqual('');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(1);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'New' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'Original' }]
              });
              expect(matDialogRef.close).toHaveBeenCalledWith(jasmine.any(Difference));
            }));
            it('fails', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
              component.submit();
              tick();
              expect(component.errorMsg).toBeTruthy();
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(1);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'New' }]
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': action['@id'],
                [`${WORKFLOWS}testMessage`]: [{ '@value': 'Original' }]
              });
              expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
          });
        });
      });
      describe('if a trigger is being', () => {
        beforeEach(() => {
          const triggerConfig = cloneDeep(objectConfig);
          triggerConfig.entityType = EntityType.TRIGGER;
          triggerConfig.shaclDefinitions = triggerSHACLDefinitions;
          component.data = triggerConfig;
        });
        describe('added and the changes update', () => {
          beforeEach(() => {
            component.data.parentIRI = component.data.workflowIRI;
            component.data.parentProp = `${WORKFLOWS}hasTrigger`;
          });
          beforeEach(() => {
            fixture.detectChanges();
            component.shaclFormValid = true;
            component.configurationFormGroup.controls.configType.setValue(component.configurationList[0]);
            component.selectedConfiguration = component.configurationList[0];
            component.selectedConfiguration.formValues = {
              [`${WORKFLOWS}watchesRecord`]: 'urn:newRecord',
              [`${WORKFLOWS}watchesBranch`]: 'urn:newBranch'
            };
          });
          it('succeeds', fakeAsync(() => {
            workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
            component.submit();
            tick();
            expect(component.errorMsg).toEqual('');
            expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
            const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
            expect((diff.additions as JSONLDObject[]).length).toEqual(2);
            expect((diff.additions as JSONLDObject[])).toContain({
              '@id': objectConfig.workflowIRI,
              [`${WORKFLOWS}hasTrigger`]: [{ '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/trigger`)}]
            });
            expect((diff.additions as JSONLDObject[])).toContain({
              '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/trigger`),
              '@type': [`${WORKFLOWS}CommitToBranchTrigger`, `${WORKFLOWS}EventTrigger`, `${WORKFLOWS}Trigger`],
              [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:newRecord' }],
              [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:newBranch' }],
            });
            expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
            expect(matDialogRef.close).toHaveBeenCalledWith(jasmine.any(Difference));
          }));
          it('fails', fakeAsync(() => {
            workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
            component.submit();
            tick();
            expect(component.errorMsg).toBeTruthy();
            expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
            const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
            expect((diff.additions as JSONLDObject[]).length).toEqual(2);
            expect((diff.additions as JSONLDObject[])).toContain({
              '@id': objectConfig.workflowIRI,
              [`${WORKFLOWS}hasTrigger`]: [{ '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/trigger`)}]
            });
            expect((diff.additions as JSONLDObject[])).toContain({
              '@id': jasmine.stringContaining(`${objectConfig.workflowIRI}/trigger`),
              '@type': [`${WORKFLOWS}CommitToBranchTrigger`, `${WORKFLOWS}EventTrigger`, `${WORKFLOWS}Trigger`],
              [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:newRecord' }],
              [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:newBranch' }],
            });
            expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
            expect(matDialogRef.close).not.toHaveBeenCalled();
          }));
        });
        describe('edited', () => {
          beforeEach(() => {
            component.data.workflowEntity = [trigger];
            component.data.selectedConfigIRI = trigger['@id'];
            component.data.mode = ModalType.EDIT;
            fixture.detectChanges();
            component.shaclFormValid = true;
          });
          describe('and the type changes and the changes update', () => {
            beforeEach(() => {
              component.configurationFormGroup.controls.configType.setValue(component.configurationList[1]);
              component.selectedConfiguration = component.configurationList[1];
              component.selectedConfiguration.formValues = {
                [`${WORKFLOWS}cron`]: '* * * * *'
              };
            });
            it('succeeds', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
              component.submit();
              tick();
              expect(component.errorMsg).toEqual('');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(1);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                '@type': [`${WORKFLOWS}ScheduledTrigger`],
                [`${WORKFLOWS}cron`]: [{ '@value': '* * * * *' }],
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                '@type': [`${WORKFLOWS}EventTrigger`, `${WORKFLOWS}CommitToBranchTrigger`],
                [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:record' }],
                [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:branch' }],
              });
              expect(matDialogRef.close).toHaveBeenCalledWith(jasmine.any(Difference));
            }));
            it('fails', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
              component.submit();
              tick();
              expect(component.errorMsg).toBeTruthy();
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(1);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                '@type': [`${WORKFLOWS}ScheduledTrigger`],
                [`${WORKFLOWS}cron`]: [{ '@value': '* * * * *' }],
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                '@type': [`${WORKFLOWS}EventTrigger`, `${WORKFLOWS}CommitToBranchTrigger`],
                [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:record' }],
                [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:branch' }],
              });
              expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
          });
          describe('and the type stays the same and the changes update', () => {
            beforeEach(() => {
              component.configurationFormGroup.controls.configType.setValue(component.configurationList[0]);
              component.selectedConfiguration = component.configurationList[0];
              component.selectedConfiguration.formValues = {
                [`${WORKFLOWS}watchesRecord`]: 'urn:newRecord',
                [`${WORKFLOWS}watchesBranch`]: 'urn:newBranch'
              };
            });
            it('succeeds', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
              component.submit();
              tick();
              expect(component.errorMsg).toEqual('');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(1);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:newRecord' }],
                [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:newBranch' }],
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:record' }],
                [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:branch' }],
              });
              expect(matDialogRef.close).toHaveBeenCalledWith(jasmine.any(Difference));
            }));
            it('fails', fakeAsync(() => {
              workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError(new HttpErrorResponse({ status: 500 })));
              component.submit();
              tick();
              expect(component.errorMsg).toBeTruthy();
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), objectConfig.recordIRI);
              const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
              expect((diff.additions as JSONLDObject[]).length).toEqual(1);
              expect((diff.additions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:newRecord' }],
                [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:newBranch' }],
              });
              expect((diff.deletions as JSONLDObject[]).length).toEqual(1);
              expect((diff.deletions as JSONLDObject[])).toContain({
                '@id': trigger['@id'],
                [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:record' }],
                [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:branch' }],
              });
              expect(matDialogRef.close).not.toHaveBeenCalled();
            }));
          });
        });
      });
    });
  });
  describe('contains the correct html', function () {
    it('for wrapping containers', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('.add-configuration-modal')).length).toEqual(1);
      expect(element.queryAll(By.css('.mat-dialog-content')).length).toEqual(1);
      expect(element.queryAll(By.css('.mat-form-field')).length).toEqual(1);
      expect(element.queryAll(By.css('.mat-select')).length).toEqual(1);
    });
    it('for buttons', function () {
      fixture.detectChanges();
      expect(element.queryAll(By.css('button')).length).toEqual(2);
    });
    it('should display the correct title', function () {
      const titleElement = element.query(By.css('.mat-dialog-title'));
      fixture.detectChanges();
      expect(titleElement.nativeElement.textContent).toContain('Add - Action');
    });
    it('should display the correct form', async () => {
      fixture.detectChanges();
      expect(element.queryAll(By.css('mat-form-field')).length).toBe(1);
      expect(element.queryAll(By.css('mat-select')).length).toBe(1);
      expect(component.selectedConfiguration).toBeFalsy();
      const trigger = element.query(By.css('.mat-select-trigger')).nativeElement;

      trigger.click();
      fixture.detectChanges();
      await fixture.whenStable();
      const options = fixture.debugElement.queryAll(By.css('.mat-option'));
      expect(options.length).toEqual(2);

      options[0].nativeElement.click();

      fixture.detectChanges();
      expect(component.selectedConfiguration).toBeTruthy();
      expect(component.selectedConfiguration.label).toEqual('Test Action');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(element.queryAll(By.css('app-shacl-form')).length).toBe(1);
    });
  });

  function setEditMode() {
    const configClone = cloneDeep(objectConfig);
    configClone.mode = ModalType.EDIT;
    configClone.selectedConfigIRI = action['@id'];
    configClone.workflowEntity = [action];
    delete configClone.parentIRI;
    delete configClone.parentProp;
    component.data = configClone;
  }
});
