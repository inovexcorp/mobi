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
//angular imports
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebugElement } from '@angular/core';

//Third-Party imports
import { MockComponent, MockProvider } from 'ng-mocks';

//Mobi & Local imports
import { NodeShapesDisplayComponent } from '../node-shapes-display/node-shapes-display.component';
import { NodeShapesListComponent } from '../node-shapes-list/node-shapes-list.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { NodeShapesTabComponent } from './node-shapes-tab.component';

describe('NodeShapesTabComponent', () => {
  let component: NodeShapesTabComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesTabComponent>;
  let stateSvcStub: jasmine.SpyObj<ShapesGraphStateService>;
  let listItem: ShapesGraphListItem;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NodeShapesTabComponent,
        MockComponent(NodeShapesListComponent),
        MockComponent(NodeShapesDisplayComponent)
      ],
      providers: [
        MockProvider(ShapesGraphStateService)
      ]
    }).compileComponents();

    stateSvcStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    listItem = new ShapesGraphListItem();
    listItem.selected = {
      '@id': 'https://mobi.solutions/shapes-graphs/example',
      '@type': ['http://www.w3.org/2002/07/owl#Ontology']
    };
    listItem.nodeTab = {
      selectedEntityIRI: 'selectedEntityIRI',
      selectedEntityName: 'selectedEntityName',
      selectedEntity: undefined,
      sourceShape: 'sourceShape'
    };

    fixture = TestBed.createComponent(NodeShapesTabComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.listItem = listItem
  });

  afterEach(() => {
    fixture = null;
    component = null;
    element = null;
    stateSvcStub = null;
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