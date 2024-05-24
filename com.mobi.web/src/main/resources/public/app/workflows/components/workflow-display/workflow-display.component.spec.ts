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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { SimpleChange } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider } from 'ng-mocks';
// material
import { MatDialog } from '@angular/material/dialog';
// lodash
import { cloneDeep, isArray } from 'lodash';
//rxjs
import { of, throwError } from 'rxjs';
// local
import { actionSHACLDefinitions, triggerSHACLDefinitions, workflowRDF } from '../../models/mock_data/workflow-mocks';
import { Element, EntityType } from '../../models/workflow-display.interface';
import {
  WorkflowPropertyOverlayComponent
} from '../workflow-property-overlay-component/workflow-property-overlay.component';
import { WorkflowsStateService } from '../../services/workflows-state.service';
import { WorkflowAddConfigurationComponent } from '../workflow-add-configuation/workflow-add-configuration.component';
import { WORKFLOWS } from '../../../prefixes';
import { ModalType } from '../../models/modal-config.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { Difference } from '../../../shared/models/difference.class';
import { WorkflowsManagerService } from '../../services/workflows-manager.service';
import { ToastService } from '../../../shared/services/toast.service';
import { WorkflowDisplayComponent } from './workflow-display.component';

describe('WorkflowDisplayComponent', () => {
  let component: WorkflowDisplayComponent;
  let fixture: ComponentFixture<WorkflowDisplayComponent>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let workflowsStateStub: jasmine.SpyObj<WorkflowsStateService>;
  let workflowsManagerStub: jasmine.SpyObj<WorkflowsManagerService>;

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
        MockProvider(ToastService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: {afterClosed: () => of(true)}
          })
        }
      ]
    }).compileComponents();
    //DI
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    workflowsStateStub = TestBed.inject(WorkflowsStateService) as jasmine.SpyObj<WorkflowsStateService>;
    workflowsManagerStub = TestBed.inject(WorkflowsManagerService) as jasmine.SpyObj<WorkflowsManagerService>;
    //component
    fixture = TestBed.createComponent(WorkflowDisplayComponent);
    component = fixture.componentInstance;
    component.resource = workflowRDF;
    component.recordId = recordId;
    component.shaclDefinitions = {
      actions: actionSHACLDefinitions,
      triggers: triggerSHACLDefinitions
    };
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture = null;
    component = null;
    matDialog = null;
    workflowsStateStub = null;
    workflowsManagerStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should initialize properly', () => {
    beforeEach(() => {
      spyOn(component, 'setWorkflowData').and.callThrough();
    });
    it('if in edit mode', () => {
      component.ngOnChanges({
        shaclDefinitions: new SimpleChange(undefined, component.shaclDefinitions, true),
        isEditMode: new SimpleChange(undefined, true, true)
      });
      expect(component.setWorkflowData).toHaveBeenCalledWith();  
      expect((<any> component)._editedResource).toEqual(component.resource);
    });
    it('if not in edit mode', () => {
      component.ngOnChanges({
        shaclDefinitions: new SimpleChange(undefined, component.shaclDefinitions, true),
        isEditMode: new SimpleChange(undefined, false, true)
      });
      expect(component.setWorkflowData).toHaveBeenCalledWith();  
      expect((<any> component)._editedResource).toEqual([]);
    });
  });
  describe('component methods', () => {
    it('should get workflow data', () => {
      spyOn(component, 'getNodesByType').and.returnValue([]);
      spyOn(component, 'buildEdges').and.returnValue([]);
      spyOn(component, 'initGraph');
      component.setWorkflowData();
      expect(component.getNodesByType).toHaveBeenCalledWith(workflowRDF, component.activityKeyMap.trigger.key);
      expect(component.buildEdges).toHaveBeenCalledWith([], []);
      expect(component.initGraph).toHaveBeenCalledWith({nodes: [], edges: []});
    });
    it('should get nodes by type', () => {
      let trigger = component.getNodesByType(workflowRDF, component.activityKeyMap.trigger.key);
      expect(isArray(trigger)).toBeTrue();
      expect(trigger.length).toBe(1);
      const workflowRDFClone = cloneDeep(workflowRDF).filter(obj => !obj['@type'].includes(`${WORKFLOWS}Trigger`));
      const workflowDef = workflowRDFClone.find(obj => obj['@type'].includes(`${WORKFLOWS}Workflow`));
      delete workflowDef[`${WORKFLOWS}hasTrigger`];
      trigger = component.getNodesByType(workflowRDFClone, component.activityKeyMap.trigger.key);
      expect(isArray(trigger)).toBeTrue();
      expect(trigger.length).toBe(1);
      const action = component.getNodesByType(workflowRDF, component.activityKeyMap.action.key);
      expect(isArray(action)).toBeTrue();
      expect(action.length).toBe(2);
    });
    it('should build nodes', () => {
      const type = workflowRDF[0][component.buildWorkflowsIRI('hasTrigger')];
      const nodes = component.buildNodes(type, workflowRDF);

      expect(isArray(nodes)).toBeTrue();
      expect(nodes.length).toBe(1);
      const node = nodes[0].data;
      const data = nodeData[0].data;
      for (const key of keyData) {
        expect(node[key]).toEqual(data[key]);
      }
      expect(node.id).toEqual(jasmine.stringContaining('https://mobi.solutions/workflows/graph/trigger/'));
    });
    it('should build edges', () => {
      const triggers: Element[] = component.getNodesByType(workflowRDF, component.activityKeyMap.trigger.key);
      const actions: Element[] = component.getNodesByType(workflowRDF, component.activityKeyMap.action.key);
      const edges = component.buildEdges(triggers, actions);
      expect(isArray(edges)).toBeTrue();
      expect(edges.length).toBe(2);
      edges.forEach((item) => {
        expect(item.data['source']).toEqual(jasmine.stringContaining('https://mobi.solutions/workflows/graph/trigger/'));
        expect(['http://example.com/workflows/LEDControl/action', 'http://example.com/workflows/LEDControl/action/b']).toContain(item.data['target']);
      });
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
      it('if an action is added', () => {
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
        component.handleModalResponse(diff);
        expect((<any> component)._editedResource.length).toEqual(7);
        expect((<any> component)._editedResource).toContain(newAction);
        expect((<any> component)._editedResource).toContain(newHeader);
        const workflowDefinition = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
        expect(workflowDefinition[`${WORKFLOWS}hasAction`]).toContain({'@id': 'http://example.com/workflows/LEDControl/action/new'});
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
        expect((<any> component)._editedResource.length).toEqual(5);
        expect((<any> component)._editedResource).not.toContain(originalHeader);
        expect((<any> component)._editedResource).toContain(newHeader);
        const action = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl/action/b');
        expect(action[`${WORKFLOWS}hasHttpUrl`]).toEqual([{ '@value': 'http://new.com' }]);
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
        expect((<any> component)._editedResource.length).toEqual(4);
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
        expect((<any> component)._editedResource.length).toEqual(3);
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
        expect((<any> component)._editedResource.length).toEqual(5);
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
        expect((<any> component)._editedResource.length).toEqual(5);
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
        expect((<any> component)._editedResource.length).toEqual(4);
        expect((<any> component)._editedResource).not.toContain(originalTrigger);
        const workflowDefinition = (<any> component)._editedResource.find(obj => obj['@id'] === 'http://example.com/workflows/LEDControl');
        expect(workflowDefinition[`${WORKFLOWS}hasTrigger`]).toBeUndefined();
        expect(workflowsStateStub.hasChanges).toBeTrue();
      });
    });
    describe('should create the appropriate modal config', () => {
      beforeEach(() => {
        (<any> component)._editedResource = cloneDeep(component.resource);
      });
      describe('if an action is being', () => {
        it('added', () => {
          const result = component.createModalConfig(undefined, ModalType.ADD);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(actionSHACLDefinitions);
          expect(result.hasProperties).toEqual([
            { '@id': 'http://example.com/workflows/LEDControl/action' },
            { '@id': 'http://example.com/workflows/LEDControl/action/b' },
          ]);
          expect(result.hasPropertyIRI).toEqual(`${WORKFLOWS}hasAction`);
          expect(result.entityType).toEqual('action');
          expect(result.mode).toEqual(ModalType.ADD);
          expect(result.selectedConfigIRI).toBeUndefined();
          expect(result.workflowEntity).toBeUndefined();
        });
        it('edited', () => {
          const elemMock = jasmine.createSpyObj('ElementDefinition', ['data']);
          elemMock.data.and.callFake((key => {
              if (key === 'entityType') {
                return 'action';
              } else if (key === 'id') {
                return 'http://example.com/workflows/LEDControl/action/b';
              } else {
                return '';
              }
            }
          ));
          const result = component.createModalConfig(elemMock, ModalType.EDIT);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(actionSHACLDefinitions);
          expect(result.hasProperties).toEqual([
            { '@id': 'http://example.com/workflows/LEDControl/action' },
            { '@id': 'http://example.com/workflows/LEDControl/action/b' },
          ]);
          expect(result.hasPropertyIRI).toEqual(`${WORKFLOWS}hasAction`);
          expect(result.entityType).toEqual('action');
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
          const elemMock = jasmine.createSpyObj('ElementDefinition', ['data']);
          elemMock.data.and.callFake((key => {
              if (key === 'entityType') {
                return 'trigger';
              } else if (key === 'id') {
                return (<any> component)._TRIGGER_NODE_ID;
              } else {
                return '';
              }
            }
          ));
          const result = component.createModalConfig(elemMock, ModalType.EDIT);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(triggerSHACLDefinitions);
          expect(result.hasProperties).toEqual([]);
          expect(result.hasPropertyIRI).toEqual(`${WORKFLOWS}hasTrigger`);
          expect(result.entityType).toEqual('trigger');
          expect(result.mode).toEqual(ModalType.EDIT);
          expect(result.selectedConfigIRI).toEqual((<any> component)._TRIGGER_NODE_ID);
          expect(result.workflowEntity.length).toEqual(1);
          expect(result.workflowEntity).toContain(jasmine.objectContaining({'@id': (<any> component)._TRIGGER_NODE_ID}));
        });
        it('edited', () => {
          const elemMock = jasmine.createSpyObj('ElementDefinition', ['data']);
          elemMock.data.and.callFake((key => {
              if (key === 'entityType') {
                return 'trigger';
              } else if (key === 'id') {
                return 'http://example.com/workflows/LEDControl/trigger';
              } else {
                return '';
              }
            }
          ));
          const result = component.createModalConfig(elemMock, ModalType.EDIT);
          expect(result.recordIRI).toEqual(component.recordId);
          expect(result.workflowIRI).toEqual('http://example.com/workflows/LEDControl');
          expect(result.shaclDefinitions).toEqual(triggerSHACLDefinitions);
          expect(result.hasProperties).toEqual([
            { '@id': 'http://example.com/workflows/LEDControl/trigger' },
          ]);
          expect(result.hasPropertyIRI).toEqual(`${WORKFLOWS}hasTrigger`);
          expect(result.entityType).toEqual('trigger');
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
          component.getDeleteEntityDifference((<any> component)._TRIGGER_NODE_ID, EntityType.TRIGGER).subscribe(result => {
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
          component.getDeleteEntityDifference((<any> component)._TRIGGER_NODE_ID, EntityType.TRIGGER)
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
          component.getDeleteEntityDifference('http://example.com/workflows/LEDControl/action/b', EntityType.ACTION).subscribe(result => {
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
          component.getDeleteEntityDifference((<any> component)._TRIGGER_NODE_ID, EntityType.TRIGGER)
            .subscribe(() => fail('Observable should have failed'), error => {
              expect(error).toEqual('Error');
              expect(workflowsManagerStub.updateWorkflowConfiguration).toHaveBeenCalledWith(jasmine.any(Difference), recordId);
            });
          tick();
        }));
      });
    });
  });
});
