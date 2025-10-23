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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MockComponent, MockProvider } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';

import { cloneDeep, isObject } from 'lodash';
import { of, throwError } from 'rxjs';

import { actionSHACLDefinitions, triggerSHACLDefinitions, workflowRDF } from '../../models/mock_data/workflow-mocks';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { DCTERMS, WORKFLOWS } from '../../../prefixes';
import { Difference } from '../../../shared/models/difference.class';
import { Element, EntityType } from '../../models/workflow-display.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { ModalType } from '../../models/modal-config.interface';
import { SettingManagerService } from '../../../shared/services/settingManager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { WorkflowAddConfigurationComponent } from '../workflow-add-configuration/workflow-add-configuration.component';
import { WorkflowDisplayComponent } from './workflow-display.component';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { WorkflowPropertyOverlayComponent } from '../workflow-property-overlay-component/workflow-property-overlay.component';
import { WorkflowsStateService } from '../../services/workflows-state.service';

describe('WorkflowDisplayComponent', () => {
  let component: WorkflowDisplayComponent;
  let fixture: ComponentFixture<WorkflowDisplayComponent>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let workflowsManagerStub: jasmine.SpyObj<WorkflowsManagerService>;
  let settingManagerStub: jasmine.SpyObj<SettingManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  let cyChartSpy;

  const recordId = 'recordId';
  const nodeData: Element[] = [
    {
      'grabbable': false,
      'data': {
        id: '1',
        name: 'Scheduled Trigger',
        entityType: EntityType.TRIGGER,
        bgColor: '#ffefd1',
        fontStyle: 'normal',
        color: '#1a1d1f',
        borderColor: '#ffd688',
        shape: 'roundrectangle',
        intId: ''
      }
    }
  ];
  const keyData = Object.keys(nodeData[0].data).filter(item => item !== 'intId' && item !== 'id');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule
      ],
      declarations: [
        WorkflowDisplayComponent,
        MockComponent(WorkflowAddConfigurationComponent),
        MockComponent(WorkflowPropertyOverlayComponent),
      ],
      providers: [
        MockProvider(WorkflowsStateService),
        MockProvider(WorkflowsManagerService),
        MockProvider(SettingManagerService),
        MockProvider(ToastService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: {afterClosed: () => of(true)}
          })
        }
      ]
    }).compileComponents();

    cyChartSpy = jasmine.createSpyObj('cyChart', {
      json: { elements: { nodes: [], edges: [] } },
      ready: undefined,
      animate: () => {},
      off: () => {},
      zoom: (zoomLevel: number) => {}
    });

    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    workflowsStateStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    workflowsManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    settingManagerStub = TestBed.inject(SettingManagerService) as jasmine.SpyObj<SettingManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    fixture = TestBed.createComponent(WorkflowDisplayComponent);

    component = fixture.componentInstance;
    component.resource = workflowRDF;
    component.recordId = recordId;
    component.shaclDefinitions = {
      actions: actionSHACLDefinitions,
      triggers: triggerSHACLDefinitions
    };
    component.cyChart = cyChartSpy;

    settingManagerStub.getAnnotationPreference.and.returnValue(of('DC Terms'));
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    fixture = null;
    component = null;
    matDialog = null;
    workflowsStateStub = null;
    workflowsManagerStub = null;
    toastStub = null;
    settingManagerStub = null;
    cyChartSpy = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should initialize properly', () => {
    beforeEach(() => {
      spyOn(component, 'setWorkflowData').and.callThrough();
    });
    it('if the shacl definitions changed', () => {
      component.ngOnChanges({
        shaclDefinitions: new SimpleChange(undefined, component.shaclDefinitions, true),
      });
      expect(component.setWorkflowData).toHaveBeenCalledWith();  
      expect(component.cyMenu).toEqual([]);
      expect((<any> component)._editedResource).toEqual([]);
    });
    it('if the resource changed', () => {
      component.ngOnChanges({
        resource: new SimpleChange(undefined, component.resource, true),
      });
      expect(component.setWorkflowData).toHaveBeenCalledWith();  
      expect(component.cyMenu).toEqual([]);
      expect((<any> component)._editedResource).toEqual([]);
    });
    it('if in edit mode', () => {
      component.setWorkflowData();
      component.isEditMode = true;
      component.ngOnChanges({
        isEditMode: new SimpleChange(undefined, true, true)
      });
      expect(component.cyMenu.length).toBeTruthy();
      expect(component.cyEdgehandles).toBeDefined();
      expect((<any> component)._editedResource).toEqual(component.resource);
    });
    it('if not in edit mode', () => {
      component.isEditMode = false;
      component.ngOnChanges({
        isEditMode: new SimpleChange(undefined, false, true)
      });
      expect(component.setWorkflowData).not.toHaveBeenCalled();  
      expect(component.cyMenu).toEqual([]);
      expect(component.cyEdgehandles).toBeUndefined();
      expect((<any> component)._editedResource).toEqual([]);
    });
  });
  describe('component methods', () => {
    it('should get workflow data', () => {
      spyOn(component, 'getNodesAndEdgesByType').and.returnValue({ nodes: [], edges: []});
      spyOn(component, 'initGraph');
      component.setWorkflowData();
      expect(component.getNodesAndEdgesByType).toHaveBeenCalledWith(workflowRDF, EntityType.TRIGGER);
      expect(component.getNodesAndEdgesByType).toHaveBeenCalledWith(workflowRDF, EntityType.ACTION);
      expect(component.initGraph).toHaveBeenCalledWith({nodes: [], edges: []});
    });
    it('should get nodes and edges by type', () => {
      let trigger = component.getNodesAndEdgesByType(workflowRDF, EntityType.TRIGGER);

      expect(isObject(trigger)).toBeTrue();
      expect(trigger.nodes.length).toBe(1);
      const node = trigger.nodes[0].data;
      const data = nodeData[0].data;
      for (const key of keyData) {
        expect(node[key]).toEqual(data[key]);
      }
      expect(node.id).toContain('https://mobi.solutions/workflows/graph/trigger/');
      expect(trigger.edges.length).toBe(2);
      trigger.edges.forEach((item) => {
        expect(item.data['source']).toEqual(jasmine.stringContaining('https://mobi.solutions/workflows/graph/trigger/'));
        expect(['http://example.com/workflows/LEDControl/action', 'http://example.com/workflows/LEDControl/action/b']).toContain(item.data['target']);
      });

      const workflowRDFClone = cloneDeep(workflowRDF).filter(obj => !obj['@type'].includes(`${WORKFLOWS}Trigger`));
      const workflowDef = workflowRDFClone.find(obj => obj['@type'].includes(`${WORKFLOWS}Workflow`));
      delete workflowDef[`${WORKFLOWS}hasTrigger`];
      trigger = component.getNodesAndEdgesByType(workflowRDFClone, EntityType.TRIGGER);
      expect(isObject(trigger)).toBeTrue();
      expect(trigger.nodes.length).toBe(1);
      expect(trigger.nodes[0].data.id).toContain('https://mobi.solutions/workflows/graph/trigger');
      expect(trigger.edges.length).toBe(2);
      const action = component.getNodesAndEdgesByType(workflowRDF, EntityType.ACTION);
      expect(isObject(action)).toBeTrue();
      expect(action.nodes.length).toBe(3);
      expect(action.edges.length).toBe(1);
    });
    it('should open a modal', () => {
      const entity = workflowRDF.find(obj => obj['@type'].includes(`${WORKFLOWS}Trigger`));
      workflowsStateStub.isEditMode = true;
      component.displayProperty(entity);
      expect(matDialog.open).not.toHaveBeenCalled();

      workflowsStateStub.isEditMode = false;
      component.displayProperty(entity);
      expect(matDialog.open).toHaveBeenCalledWith(WorkflowPropertyOverlayComponent,
        {
          panelClass: 'medium-dialog',
          data: { entityIRI: entity['@id'], entity: [entity] }
        });
    });
    it('should build a workflows IRI', () => {
      const key = component.buildWorkflowsIRI('test');
      expect(key).toBe('http://mobi.solutions/ontologies/workflows#test');
    });
    it('should initialize cytoscape', () => {
      component.initGraph(nodeData);
      expect(component.cyChart).toBeDefined();
    });
    it('should get the default trigger', () => {
      const result = component.getDefaultTrigger();
      expect(result).toBeDefined();
      expect(result['@id']).toEqual(jasmine.stringContaining('https://mobi.solutions/workflows/graph/trigger/'));
      expect(result['@type']).toEqual([`${WORKFLOWS}Trigger`, `${WORKFLOWS}DefaultTrigger`]);
    });
    it('should get the appropriate node type style', fakeAsync (() => {
      let result = component.getNodeTypeStyle(EntityType.TRIGGER);
      expect(result.shape).toEqual('roundrectangle');

      result = component.getNodeTypeStyle(EntityType.ACTION);
      expect(result.shape).toEqual('ellipse');
    }));
    describe('should handle a response from the configuration modal', () => {
      beforeEach(() => {
        component.setWorkflowData();
        (<any> component)._editedResource = cloneDeep(component.resource);
      });
      it('if nothing was passed', () => {
        component.handleModalResponse(undefined);
        expect((<any> component)._editedResource).toEqual(component.resource);
        expect(workflowsStateStub.hasChanges).toBeFalsy();
      });
      it('if nothing changed', () => {
        component.handleModalResponse(new Difference());
        expect((<any> component)._editedResource).toEqual(component.resource);
        expect(workflowsStateStub.hasChanges).toBeFalsy();
      });
      it('if an action is added beneath the workflow', () => {
        const newAction: JSONLDObject = {
          '@id': 'http://example.com/workflows/LEDControl/action/new',
          '@type': [`${WORKFLOWS}Action`, `${WORKFLOWS}HTTPRequestAction`],
          [`${WORKFLOWS}hasHttpUrl`]: [{ '@value': 'http://test.com' }],
          [`${WORKFLOWS}hasHeader`]: [{ '@id': 'http://example.com/workflows/LEDControl/action/header/new' }]
        };
        const newHeader: JSONLDObject = {
          '@id': 'http://example.com/workflows/LEDControl/action/header/new',
          '@type': [`${WORKFLOWS}Header`],
          [`${WORKFLOWS}hasHeaderName`]: [{ '@value': 'X-Test' }],
          [`${WORKFLOWS}hasHeaderValue`]: [{ '@value': 'X-Test' }]
        };
        const diff = new Difference([
          {
            '@id': 'http://example.com/workflows/LEDControl',
            [`${WORKFLOWS}hasAction`]: [{ '@id': 'http://example.com/workflows/LEDControl/action/new' }]
          },
          newAction,
          newHeader
        ]);
        component.handleModalResponse(diff, 'http://example.com/workflows/LEDControl');
        expect((<any> component)._editedResource.length).toEqual(8);
        expect((<any> component)._editedResource).toContain(newAction);
        expect((<any> component)._editedResource).toContain(newHeader);
        const workflowDefinition = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
        expect(workflowDefinition[`${WORKFLOWS}hasAction`]).toContain({'@id': 'http://example.com/workflows/LEDControl/action/new'});
      });
      it('if an action is added beneath another action', () => {
        const newAction: JSONLDObject = {
          '@id': 'http://example.com/workflows/LEDControl/action/new',
          '@type': [`${WORKFLOWS}Action`, `${WORKFLOWS}HTTPRequestAction`],
          [`${WORKFLOWS}hasHttpUrl`]: [{ '@value': 'http://test.com' }],
          [`${WORKFLOWS}hasHeader`]: [{ '@id': 'http://example.com/workflows/LEDControl/action/header/new' }]
        };
        const newHeader: JSONLDObject = {
          '@id': 'http://example.com/workflows/LEDControl/action/header/new',
          '@type': [`${WORKFLOWS}Header`],
          [`${WORKFLOWS}hasHeaderName`]: [{ '@value': 'X-Test' }],
          [`${WORKFLOWS}hasHeaderValue`]: [{ '@value': 'X-Test' }]
        };
        const diff = new Difference([
          {
            '@id': 'http://example.com/workflows/LEDControl/action',
            [`${WORKFLOWS}hasChildAction`]: [{ '@id': 'http://example.com/workflows/LEDControl/action/new' }]
          },
          newAction,
          newHeader
        ]);
        component.handleModalResponse(diff, 'http://example.com/workflows/LEDControl/action');
        expect((<any> component)._editedResource.length).toEqual(8);
        expect((<any> component)._editedResource).toContain(newAction);
        expect((<any> component)._editedResource).toContain(newHeader);
        const actionDefinition = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/action');
        expect(actionDefinition[`${WORKFLOWS}hasChildAction`]).toContain({'@id': 'http://example.com/workflows/LEDControl/action/new'});
      });
      it('if an action is edited', () => {
        const originalHeader = workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/header');
        const newHeader: JSONLDObject = {
          '@id': 'http://example.com/workflows/LEDControl/action/header/new',
          '@type': [`${WORKFLOWS}Header`],
          [`${WORKFLOWS}hasHeaderName`]: [{ '@value': 'X-Test' }],
          [`${WORKFLOWS}hasHeaderValue`]: [{ '@value': 'X-Test' }]
        };
        const diff = new Difference(
          [
            {
              '@id': 'http://example.com/workflows/LEDControl/action/b',
              [`${WORKFLOWS}hasHttpUrl`]: [{ '@value': 'http://new.com' }],
              [`${WORKFLOWS}hasHeader`]: [{ '@id': 'http://example.com/workflows/LEDControl/action/header/new' }]
            },
            newHeader
          ], [
            {
              '@id': 'http://example.com/workflows/LEDControl/action/b',
              [`${WORKFLOWS}hasHttpUrl`]: [{ '@value': 'http://test.com' }],
              [`${WORKFLOWS}hasHeader`]: [{ '@id': 'http://example.com/workflows/LEDControl/header' }]
            },
            originalHeader
          ]
        );
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(6);
        expect((<any> component)._editedResource).not.toContain(originalHeader);
        expect((<any> component)._editedResource).toContain(newHeader);
        const action = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/action/b');
        expect(action[`${WORKFLOWS}hasHttpUrl`]).toEqual([{ '@value': 'http://new.com' }]);
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
      it('if an action\'s title is edited', () => {
        const id = 'http://example.com/workflows/LEDControl/action';
        const testAction = workflowRDF.find(obj => obj['@id'] === id);
        testAction[`${DCTERMS}title`] = [{ '@value': 'New Title' }];
        const diff = new Difference(
          [], [
            {
              '@id': id,
              [`${DCTERMS}title`]: [{ '@value': 'New Title' }]
            },
          ]
        );
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(6);
        expect((<any> component)._editedResource).not.toContain({[`${DCTERMS}title`]: [{ '@value': 'New Title' }]});
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
      it('if an action was changed to a different type', () => {
        const originalActionClone = cloneDeep(workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/action/b'));
        originalActionClone['@type'] = [`${WORKFLOWS}HTTPRequestAction`];
        const originalHeader = workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/header');
        const diff = new Difference(
          [{
            '@id': 'http://example.com/workflows/LEDControl/action/b',
            '@type': [`${WORKFLOWS}TestAction`],
            [`${WORKFLOWS}testMessage`]: [{ '@value': 'TEST' }]
          }], [
            originalActionClone,
            originalHeader
          ]
        );
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(5);
        expect((<any> component)._editedResource).not.toContain(originalHeader);
        const action = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/action/b');
        expect(action).toEqual({
          '@id': 'http://example.com/workflows/LEDControl/action/b',
          '@type': [`${WORKFLOWS}Action`, `${WORKFLOWS}TestAction`],
          [`${WORKFLOWS}testMessage`]: [{ '@value': 'TEST' }]
        });
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
      it('if an action was removed', () => {
        const originalAction = workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/action/b');
        const originalHeader = workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/header');
        const diff = new Difference([], [
          {
            '@id': 'http://example.com/workflows/LEDControl',
            [`${WORKFLOWS}hasAction`]: [{ '@id': originalAction['@id'] }]
          },
          originalAction,
          originalHeader
        ]);
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(4);
        expect((<any> component)._editedResource).not.toContain(originalAction);
        expect((<any> component)._editedResource).not.toContain(originalHeader);
        const workflowDefinition = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
        expect(workflowDefinition[`${WORKFLOWS}hasAction`]).not.toContain({'@id': originalAction['@id']});
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
      it('if a trigger was added', () => {
        const idx = (<any> component)._editedResource.findIndex(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/trigger');
        (<any> component)._editedResource.splice(idx, 1);
        const workflowDef = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
        delete workflowDef[`${WORKFLOWS}hasTrigger`];
        const originalTriggerClone = cloneDeep(workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/trigger'));
        originalTriggerClone['@id'] = 'http://example.com/workflows/LEDControl/trigger/new';
        const diff = new Difference([
          {
            '@id': 'http://example.com/workflows/LEDControl',
            [`${WORKFLOWS}hasTrigger`]: [{ '@id': originalTriggerClone['@id'] }]
          },
          originalTriggerClone
        ]);
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(6);
        expect((<any> component)._editedResource).toContain(originalTriggerClone);
        const workflowDefinition = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
        expect(workflowDefinition[`${WORKFLOWS}hasTrigger`]).toContain({'@id': originalTriggerClone['@id']});
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
      it('if the trigger is edited', () => {
        const diff = new Difference(
          [{
              '@id': 'http://example.com/workflows/LEDControl/trigger',
              [`${WORKFLOWS}cron`]: [{ '@value': '* * * * *' }]
          }], [{
            '@id': 'http://example.com/workflows/LEDControl/trigger',
            [`${WORKFLOWS}cron`]: [{ '@value': '1 0/1 * 1/1 * ? *' }],
          }]
        );
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(component.resource.length);
        const trigger = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/trigger');
        expect(trigger[`${WORKFLOWS}cron`]).toEqual([{ '@value': '* * * * *' }]);
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
      it('if the trigger was changed to a different type', () => {
        const originalTriggerClone = cloneDeep(workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/trigger'));
        originalTriggerClone['@type'] = [`${WORKFLOWS}ScheduledTrigger`];
        const diff = new Difference(
          [{
            '@id': 'http://example.com/workflows/LEDControl/trigger',
            '@type': [`${WORKFLOWS}EventTrigger`, `${WORKFLOWS}CommitToBranchTrigger`],
            [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:record' }],
            [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:branch' }]
          }], [originalTriggerClone]
        );
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(6);
        const trigger = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/trigger');
        expect(trigger).toEqual({
          '@id': 'http://example.com/workflows/LEDControl/trigger',
          '@type': [`${WORKFLOWS}Trigger`, `${WORKFLOWS}EventTrigger`, `${WORKFLOWS}CommitToBranchTrigger`],
          [`${WORKFLOWS}watchesRecord`]: [{ '@id': 'urn:record' }],
          [`${WORKFLOWS}watchesBranch`]: [{ '@id': 'urn:branch' }]
        });
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
      it('if the trigger was removed', () => {
        const originalTrigger = workflowRDF.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/trigger');
        const diff = new Difference([], [
          {
            '@id': 'http://example.com/workflows/LEDControl',
            [`${WORKFLOWS}hasTrigger`]: [{ '@id': originalTrigger['@id'] }]
          },
          originalTrigger
        ]);
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(5);
        expect((<any> component)._editedResource).not.toContain(originalTrigger);
        const workflowDefinition = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
        expect(workflowDefinition[`${WORKFLOWS}hasTrigger`]).toBeUndefined();
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
    });
    describe('should create the appropriate modal config', () => {
      let elemData;
      const elemMock = {
        data: key => elemData[key]
      };
      beforeEach(() => {
        (<any> component)._editedResource = cloneDeep(component.resource);
        elemData = {
          entityType: EntityType.ACTION,
          id: 'http://example.com/workflows/LEDControl/action/b'
        };
      });
      afterEach(() => {
        elemData = null;
      });
      describe('if an action is being', () => {
        it('added beneath the Workflow', () => {
          elemData.entityType = EntityType.TRIGGER;
          elemData.id = 'http://example.com/workflows/LEDControl';
          const result = component.createModalConfig(elemMock, ModalType.ADD);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(actionSHACLDefinitions);
          expect(result.parentIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.parentProp).toEqual(`${WORKFLOWS}hasAction`);
          expect(result.entityType).toEqual(EntityType.ACTION);
          expect(result.mode).toEqual(ModalType.ADD);
          expect(result.selectedConfigIRI).toBeUndefined();
          expect(result.workflowEntity).toBeUndefined();
        });
        it('added beneath another Action', () => {
          const result = component.createModalConfig(elemMock, ModalType.ADD);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(actionSHACLDefinitions);
          expect(result.parentIRI).toEqual(elemData.id);
          expect(result.parentProp).toEqual(`${WORKFLOWS}hasChildAction`);
          expect(result.entityType).toEqual(EntityType.ACTION);
          expect(result.mode).toEqual(ModalType.ADD);
          expect(result.selectedConfigIRI).toBeUndefined();
          expect(result.workflowEntity).toBeUndefined();
        });
        it('edited', () => {
          const result = component.createModalConfig(elemMock, ModalType.EDIT);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(actionSHACLDefinitions);
          expect(result.parentIRI).toBeUndefined();
          expect(result.parentProp).toBeUndefined();
          expect(result.entityType).toEqual(EntityType.ACTION);
          expect(result.mode).toEqual(ModalType.EDIT);
          expect(result.selectedConfigIRI).toEqual('http://example.com/workflows/LEDControl/action/b');
          expect(result.workflowEntity.length).toEqual(2);
          expect(result.workflowEntity).toContain(jasmine.objectContaining({'@id': 'http://example.com/workflows/LEDControl/action/b'}));
        });
      });
      describe('if a trigger is being', () => {
        it('added', () => {
          const idx = (<any> component)._editedResource.findIndex(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/trigger');
          (<any> component)._editedResource.splice(idx, 1);
          const workflowDef = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
          delete workflowDef[`${WORKFLOWS}hasTrigger`];
          elemData.entityType = EntityType.TRIGGER;
          elemData.id = (<any> component)._TRIGGER_NODE_ID;
          const result = component.createModalConfig(elemMock, ModalType.EDIT);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(triggerSHACLDefinitions);
          expect(result.parentIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.parentProp).toEqual(`${WORKFLOWS}hasTrigger`);
          expect(result.entityType).toEqual(EntityType.TRIGGER);
          expect(result.mode).toEqual(ModalType.EDIT);
          expect(result.selectedConfigIRI).toBeUndefined();
          expect(result.workflowEntity).toBeUndefined();
        });
        it('edited', () => {
          elemData.entityType = EntityType.TRIGGER;
          elemData.id = 'http://example.com/workflows/LEDControl/trigger';
          const result = component.createModalConfig(elemMock, ModalType.EDIT);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(triggerSHACLDefinitions);
          expect(result.parentIRI).toBeUndefined();
          expect(result.parentProp).toBeUndefined();
          expect(result.entityType).toEqual(EntityType.TRIGGER);
          expect(result.mode).toEqual(ModalType.EDIT);
          expect(result.selectedConfigIRI).toEqual('http://example.com/workflows/LEDControl/trigger');
          expect(result.workflowEntity.length).toEqual(1);
          expect(result.workflowEntity).toContain(jasmine.objectContaining({'@id': 'http://example.com/workflows/LEDControl/trigger'}));
        });
      });
    });
    describe('should get a difference for deleting an entity', () => {
      beforeEach(() => {
        (<any> component)._editedResource = cloneDeep(component.resource);
      });
      describe('if it is the trigger', () => {
        it('successfully', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
          component.getDeleteEntityDifference((<any> component)._TRIGGER_NODE_ID).subscribe(result => {
            expect(result).toBeDefined();
            expect((result.additions as JSONLDObject[]).length).toEqual(0);
            expect((result.deletions as JSONLDObject[]).length).toEqual(2);
            expect((result.deletions as JSONLDObject[])).toContain({
              '@id': 'http://example.com/workflows/LEDControl',
              [`${WORKFLOWS}hasTrigger`]: [{ '@id': 'http://example.com/workflows/LEDControl/trigger' }]
            });
            expect((result.deletions as JSONLDObject[])).toContain(jasmine.objectContaining({'@id': 'http://example.com/workflows/LEDControl/trigger' }));
            expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(result, recordId);
          });
          tick();
        }));
        it('unless an error occurs', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError('Error'));
          component.getDeleteEntityDifference((<any> component)._TRIGGER_NODE_ID)
            .subscribe(() => fail('Observable should have failed'), error => {
              expect(error).toEqual('Error');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), recordId);
            });
          tick();
        }));
      });
      describe('if it is an action', () => {
        it('successfully', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
          component.getDeleteEntityDifference('http://example.com/workflows/LEDControl/action/b').subscribe(result => {
            expect(result).toBeDefined();
            expect((result.additions as JSONLDObject[]).length).toEqual(0);
            expect((result.deletions as JSONLDObject[]).length).toEqual(3);
            expect((result.deletions as JSONLDObject[])).toContain({
              '@id': 'http://example.com/workflows/LEDControl',
              [`${WORKFLOWS}hasAction`]: [{ '@id': 'http://example.com/workflows/LEDControl/action/b' }]
            });
            expect((result.deletions as JSONLDObject[])).toContain(jasmine.objectContaining({'@id': 'http://example.com/workflows/LEDControl/action/b' }));
            expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(result, recordId);
          });
          tick();
        }));
        it('unless an error occurs', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError('Error'));
          component.getDeleteEntityDifference('http://example.com/workflows/LEDControl/action/b')
            .subscribe(() => fail('Observable should have failed'), error => {
              expect(error).toEqual('Error');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), recordId);
            });
          tick();
        }));
      });
    });
    describe('should get a difference for deleting an edge', () => {
      beforeEach(() => {
        (<any> component)._editedResource = cloneDeep(component.resource);
      });
      describe('if the edge is between the trigger and an action', () => {
        it('successfully', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
          component.getDeleteEdgeDifference((<any> component)._TRIGGER_NODE_ID, 'http://example.com/workflows/LEDControl/action').subscribe(result => {
            expect(result).toBeDefined();
            expect((result.additions as JSONLDObject[]).length).toEqual(0);
            expect((result.deletions as JSONLDObject[]).length).toEqual(1);
            expect((result.deletions as JSONLDObject[])).toEqual([{
              '@id': 'http://example.com/workflows/LEDControl',
              [`${WORKFLOWS}hasAction`]: [{ '@id': 'http://example.com/workflows/LEDControl/action' }]
            }]);
            expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(result, recordId);
          });
          tick();
        }));
        it('unless an error occurs', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError('Error'));
          component.getDeleteEdgeDifference((<any> component)._TRIGGER_NODE_ID, 'http://example.com/workflows/LEDControl/action')
            .subscribe(() => fail('Observable should have failed'), error => {
              expect(error).toEqual('Error');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), recordId);
            });
          tick();
        }));
      });
      describe('if the edge is between an action and another action', () => {
        it('successfully', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
          component.getDeleteEdgeDifference('http://example.com/workflows/LEDControl/action', 'http://example.com/workflows/LEDControl/action/a').subscribe(result => {
            expect(result).toBeDefined();
            expect((result.additions as JSONLDObject[]).length).toEqual(0);
            expect((result.deletions as JSONLDObject[]).length).toEqual(1);
            expect((result.deletions as JSONLDObject[])).toEqual([{
              '@id': 'http://example.com/workflows/LEDControl/action',
              [`${WORKFLOWS}hasChildAction`]: [{ '@id': 'http://example.com/workflows/LEDControl/action/a' }]
            }]);
            expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(result, recordId);
          });
          tick();
        }));
        it('unless an error occurs', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError('Error'));
          component.getDeleteEdgeDifference('http://example.com/workflows/LEDControl/action', 'http://example.com/workflows/LEDControl/action/a')
            .subscribe(() => fail('Observable should have failed'), error => {
              expect(error).toEqual('Error');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), recordId);
            });
          tick();
        }));
      });
    });
    it('should determine whether an edge can be added between two nodes', () => {
      const sourceElemData = {
        id: 'http://example.com/workflows/LEDControl/action',
        entityType: EntityType.ACTION
      };
      const targetElemData = {
        id: 'http://example.com/workflows/LEDControl/action/b',
        entityType: EntityType.ACTION
      };
      const sourceElem = {
        data: key => sourceElemData[key],
        same: obj => obj.data('id') === sourceElemData.id && obj.data('entityType') === sourceElemData.entityType 
      };
      const targetElem = {
        data: key => targetElemData[key],
        same: obj => obj.data('id') === targetElemData.id && obj.data('entityType') === targetElemData.entityType 
      };
      const edges = (<any> component)._buildGraphData(component.resource).edges
        .map(el => ({
          data: key => el.data[key]
        }));
      component.cyChart.edges = () => edges;
      expect(component.edgeCanBeAdded(sourceElem, targetElem)).toBeTrue();

      // No duplicates
      sourceElemData.id = (<any> component)._TRIGGER_NODE_ID;
      sourceElemData.entityType = EntityType.TRIGGER;
      expect(component.edgeCanBeAdded(sourceElem, targetElem)).toBeFalse();

      // No direct loops
      sourceElemData.id = targetElemData.id;
      sourceElemData.entityType = targetElemData.entityType;
      expect(component.edgeCanBeAdded(sourceElem, targetElem)).toBeFalse();

      // No edges back to trigger
      targetElemData.id = (<any> component)._TRIGGER_NODE_ID;
      targetElemData.entityType = EntityType.TRIGGER;
      expect(component.edgeCanBeAdded(sourceElem, targetElem)).toBeFalse();
    });
    describe('should add a new edge to the chart', () => {
      const addedEdge = jasmine.createSpyObj('ElementDefinition', ['remove']);
      const sourceNodeData = { id: '' };
      const sourceNode = {
        data: key => sourceNodeData[key]
      };
      const targetNodeData = { id: '' };
      const targetNode = {
        data: key => targetNodeData[key]
      };
      beforeEach(() => {
        component.setWorkflowData();
        (<any> component)._editedResource = cloneDeep(component.resource);
        addedEdge.remove.calls.reset();
      });
      describe('if the edge is from the trigger to an action', () => {
        beforeEach(() => {
          sourceNodeData.id = (<any> component)._TRIGGER_NODE_ID;
          targetNodeData.id = 'http://example.com/workflows/LEDControl/action/new';
        });
        it('successfully', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
          const workflowDef = (<any> component)._editedResource.find(obj => obj['@type'].includes(`${WORKFLOWS}Workflow`));
          expect(workflowDef[`${WORKFLOWS}hasAction`].length).toEqual(2);
          component.addNewEdge(sourceNode, targetNode, addedEdge);
          tick();
          expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), component.recordId);
          const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
          expect((diff.additions as JSONLDObject[]).length).toEqual(1);
          expect((diff.additions as JSONLDObject[])).toContain({
            '@id': 'http://example.com/workflows/LEDControl',
            [`${WORKFLOWS}hasAction`]: [{ '@id': targetNodeData.id }]
          });
          expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
          expect(addedEdge.remove).not.toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(workflowDef[`${WORKFLOWS}hasAction`].length).toEqual(3);
          expect(workflowDef[`${WORKFLOWS}hasAction`]).toContain({'@id': targetNodeData.id});
          expect(workflowsStateStub.hasChanges).toBeTruthy();
        }));
        it('unless an error occurs', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError('Error'));
          const workflowDef = (<any> component)._editedResource.find(obj => obj['@type'].includes(`${WORKFLOWS}Workflow`));
          expect(workflowDef[`${WORKFLOWS}hasAction`].length).toEqual(2);
          component.addNewEdge(sourceNode, targetNode, addedEdge);
          tick();
          expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), component.recordId);
          const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
          expect((diff.additions as JSONLDObject[]).length).toEqual(1);
          expect((diff.additions as JSONLDObject[])).toContain({
            '@id': 'http://example.com/workflows/LEDControl',
            [`${WORKFLOWS}hasAction`]: [{ '@id': targetNodeData.id }]
          });
          expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
          expect(addedEdge.remove).toHaveBeenCalledWith();
          expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Error'));
          expect(workflowDef[`${WORKFLOWS}hasAction`].length).toEqual(2);
          expect(workflowsStateStub.hasChanges).toBeFalsy();
        }));
      });
      describe('if the edge is from an action to another action', () => {
        beforeEach(() => {
          sourceNodeData.id = 'http://example.com/workflows/LEDControl/action/a';
          targetNodeData.id = 'http://example.com/workflows/LEDControl/action/b';
        });
        it('successfully', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(of(null));
          const actionDef = (<any> component)._editedResource.find(obj => obj['@id'] === sourceNodeData.id);
          expect(actionDef[`${WORKFLOWS}hasChildAction`]).toBeUndefined();
          component.addNewEdge(sourceNode, targetNode, addedEdge);
          tick();
          expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), component.recordId);
          const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
          expect((diff.additions as JSONLDObject[]).length).toEqual(1);
          expect((diff.additions as JSONLDObject[])).toContain({
            '@id': sourceNodeData.id,
            [`${WORKFLOWS}hasChildAction`]: [{ '@id': targetNodeData.id }]
          });
          expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
          expect(addedEdge.remove).not.toHaveBeenCalled();
          expect(toastStub.createErrorToast).not.toHaveBeenCalled();
          expect(actionDef[`${WORKFLOWS}hasChildAction`]).toBeDefined();
          expect(actionDef[`${WORKFLOWS}hasChildAction`].length).toEqual(1);
          expect(actionDef[`${WORKFLOWS}hasChildAction`]).toContain({'@id': targetNodeData.id});
          expect(workflowsStateStub.hasChanges).toBeTruthy();
        }));
        it('unless an error occurs', fakeAsync(() => {
          workflowsManagerStub.updateWorkflowConfiguration.and.returnValue(throwError('Error'));
          const actionDef = (<any> component)._editedResource.find(obj => obj['@id'] === sourceNodeData.id);
          expect(actionDef[`${WORKFLOWS}hasChildAction`]).toBeUndefined();
          component.addNewEdge(sourceNode, targetNode, addedEdge);
          tick();
          expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), component.recordId);
          const diff = workflowsManagerStub.updateWorkflowConfiguration.calls.mostRecent().args[0];
          expect((diff.additions as JSONLDObject[]).length).toEqual(1);
          expect((diff.additions as JSONLDObject[])).toContain({
            '@id': sourceNodeData.id,
            [`${WORKFLOWS}hasChildAction`]: [{ '@id': targetNodeData.id }]
          });
          expect((diff.deletions as JSONLDObject[]).length).toEqual(0);
          expect(addedEdge.remove).toHaveBeenCalledWith();
          expect(toastStub.createErrorToast).toHaveBeenCalledWith(jasmine.stringContaining('Error'));
          expect(actionDef[`${WORKFLOWS}hasChildAction`]).toBeUndefined();
          expect(workflowsStateStub.hasChanges).toBeFalsy();
        }));
      });
    });
  });
});
