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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockProvider } from 'ng-mocks';
//material
import { MatDialog } from '@angular/material/dialog';
// lodash
import { find, isArray } from 'lodash';
//rxjs
import { of } from 'rxjs';
//local
import { CatalogManagerService } from '../../../shared/services/catalogManager.service';
import { workflowRDF } from '../../models/mock_data/workflow-mocks';
import { Element } from '../../models/workflow-display.interface';
import {
  WorkflowPropertyOverlayComponent
} from '../workflow-property-overlay-component/workflow-property-overlay.component';
import { WorkflowDisplayComponent } from './workflow-display.component';

describe('WorkflowDisplayComponent', () => {
  let component: WorkflowDisplayComponent;
  let fixture: ComponentFixture<WorkflowDisplayComponent>;
  const triggerId = 'http://example.com/workflows/LEDControl/trigger';
  let matDialog: jasmine.SpyObj<MatDialog>;
  const nodeData: Element[] = [
    {
      'grabbable': false,
      'data': {
        id: 'http://example.com/workflows/LEDControl/trigger',
        name: 'Scheduled Trigger',
        activityType: 'trigger',
        bgColor: '#ffefd1',
        fontStyle: 'normal',
        color: '#1a1d1f',
        borderColor: '#ffd688',
        shape: 'roundrectangle',
        intId: ''
      }
    }
  ];
  const keyData = Object.keys(nodeData[0].data).filter(item => item !== 'intId');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule
      ],
      declarations: [
        WorkflowDisplayComponent
      ],
      providers: [
        MockProvider(CatalogManagerService),
        {
          provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: {afterClosed: () => of(true)}
          })
        }
      ]
    }).compileComponents();
    //DI
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    //component
    fixture = TestBed.createComponent(WorkflowDisplayComponent);
    component = fixture.componentInstance;
    component.resource = workflowRDF;
    fixture.detectChanges();
  });
  afterEach(() => {
    fixture = null;
    component = null;
    matDialog = null;
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize properly', () => {
    spyOn(component, 'getWorkflowData').and.callThrough();
    component.ngOnInit();
    expect(component.getWorkflowData).toHaveBeenCalledWith();
  });
  describe('component methods', () => {
    it('should get workflow data', () => {
      spyOn(component, 'getNodesByType').and.returnValue([]);
      spyOn(component, 'setTypeStyle');
      spyOn(component, 'buildEdges').and.returnValue([]);
      spyOn(component, 'initGraph');
      component.getWorkflowData();
      expect(component.getNodesByType).toHaveBeenCalledWith(workflowRDF, component.activityKeyMap.trigger.type);
      expect(component.setTypeStyle).toHaveBeenCalled();
      expect(component.buildEdges).toHaveBeenCalledWith([], []);
      expect(component.initGraph).toHaveBeenCalled();
    });
    it('should get nodes by type', () => {
      const trigger = component.getNodesByType(workflowRDF, component.activityKeyMap.trigger.type);
      expect(isArray(trigger)).toBeTrue();
      expect(trigger.length).toBe(1);
      const action = component.getNodesByType(workflowRDF, component.activityKeyMap.action.type);
      expect(isArray(action)).toBeTrue();
      expect(action.length).toBe(2);
    });
    it('should build nodes', () => {
      const type = workflowRDF[0][component.buildKey(component.activityKeyMap.trigger.type)];
      const nodes = component.buildNodes(type, workflowRDF);

      expect(isArray(nodes)).toBeTrue();
      expect(nodes.length).toBe(1);
      const node = nodes[0].data;
      const data = nodeData[0].data;
      for (const key of keyData) {
        expect(node[key]).toEqual(data[key]);
      }
    });
    it('should set default trigger', () => {
      const type = workflowRDF[0][component.buildKey(component.activityKeyMap.trigger.type)];
      const nodes = component.buildNodes(type, workflowRDF);

      expect(isArray(nodes)).toBeTrue();
      expect(nodes.length).toBe(1);
      const node = nodes[0].data;
      const data = nodeData[0].data;
      for (const key of keyData) {
        expect(node[key]).toEqual(data[key]);
      }
    });
    it('should build edges', () => {
      const triggers: Element[] = component.getNodesByType(workflowRDF, component.activityKeyMap.trigger.type);
      const actions: Element[] = component.getNodesByType(workflowRDF, component.activityKeyMap.action.type);
      const edges = component.buildEdges(triggers, actions);
      const result = [{
        source: triggerId,
        target: 'http://example.com/workflows/LEDControl/action'
      }, {
        source: triggerId,
        target: 'http://example.com/workflows/LEDControl/action/b'
      }];
      expect(isArray(edges)).toBeTrue();
      expect(edges.length).toBe(2);
      edges.forEach((item, index) => {
        expect(item.data['source']).toBe(result[index].source);
        expect(item.data['target']).toBe(result[index].target);
      });
    });
    it('should open a modal', () => {
      const entity = find(workflowRDF, {'@id': triggerId});
      component.displayProperty(entity);
      expect(matDialog.open).toHaveBeenCalled();
      expect(matDialog.open).toHaveBeenCalledWith(WorkflowPropertyOverlayComponent,
        {
          panelClass: 'medium-dialog',
          data: entity
        });
    });
  });
  it('should build key', () => {
    const key = component.buildKey('test');
    expect(key).toBe('http://mobi.solutions/ontologies/workflows#test');
  });
  it('should initialize cytoscape', () => {
    component.initGraph(nodeData);
    expect(component.cyChart).toBeDefined();
  });
  it('should set type style', fakeAsync (() => {
    const style = {
      activityType: 'trigger',
      bgColor: '#ffefd1',
      borderColor: '#ffd688',
      color: '#1a1d1f',
      fontStyle: 'normal',
      id: 'http://example.com/workflows/test/trigger',
      intId: 'ID',
      name: 'Scheduled Trigger',
      shape: 'roundrectangle',
    };
    component.setTypeStyle();

    component.initGraph(nodeData);
    fixture.detectChanges();
    fixture.whenStable();
    tick(60000);
    const cyElement = component.cyChart.elements()[0].data();

    expect(cyElement.bgColor).toBe(style.bgColor);
    expect(cyElement.fontStyle).toBe(style.fontStyle);
    expect(cyElement.color).toBe(style.color);
    expect(cyElement.borderColor).toBe(style.borderColor);
    expect(cyElement.shape).toBe(style.shape);
    expect(component.cyChart.container().classList.contains('__________cytoscape_container')).toBeTruthy();
  }));
});
