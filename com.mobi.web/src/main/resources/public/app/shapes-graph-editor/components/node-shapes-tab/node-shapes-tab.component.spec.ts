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
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

import { MockComponent } from 'ng-mocks';

import { NodeShapesDisplayComponent } from '../node-shapes-display/node-shapes-display.component';
import { NodeShapesListComponent } from '../node-shapes-list/node-shapes-list.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { NodeShapesTabComponent } from './node-shapes-tab.component';

describe('NodeShapesTabComponent', () => {
  let component: NodeShapesTabComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesTabComponent>;
  let listItem: ShapesGraphListItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NodeShapesTabComponent,
        MockComponent(NodeShapesDisplayComponent),
        MockComponent(NodeShapesListComponent)
      ],
      providers: []
    }).compileComponents();

    listItem = new ShapesGraphListItem();
    listItem.selected = {
      '@id': 'https://mobi.solutions/shapes-graphs/example',
      '@type': ['http://www.w3.org/2002/07/owl#Ontology']
    };
    listItem.setSelectedNodeShapeIri('selectedEntityIRI');
    listItem.editorTabStates.nodeShapes = {
      sourceIRI: 'sourceIRI',
      nodes: []
    };

    fixture = TestBed.createComponent(NodeShapesTabComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.listItem = listItem;
    component.canModify = true;
  });

  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
    listItem = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should create the correct html', () => {
    fixture.detectChanges();
    expect(element.queryAll(By.css('app-node-shapes-list')).length).toEqual(1);
    expect(element.queryAll(By.css('app-node-shapes-display')).length).toEqual(1);
  });
});
