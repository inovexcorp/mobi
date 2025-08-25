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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MockComponent } from 'ng-mocks';
import { ReplaySubject, Subject } from 'rxjs';

import { AddPathNodeEvent } from '../../models/add-path-node-event';
import { AddPathNodeHoverButtonComponent } from '../add-path-node-hover-button/add-path-node-hover-button.component';
import { AddPathNodeModalComponent } from '../add-path-node-modal/add-path-node-modal.component';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { PathNode } from '../../models/property-shape.interface';
import { PathNodeDisplayComponent } from '../path-node-display/path-node-display.component';
import { PropertyShapePathComponent } from './property-shape-path.component';

describe('PropertyShapePathComponent', () => {
  let component: PropertyShapePathComponent;
  let fixture: ComponentFixture<PropertyShapePathComponent>;
  let element: DebugElement;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const propANode: PathNode = {
    type: 'IRI',
    iri: 'urn:propA',
    label: 'Prop A'
  };
  const propBNode: PathNode = {
    type: 'IRI',
    iri: 'urn:propB',
    label: 'Prop B'
  };
  const propCNode: PathNode = {
    type: 'IRI',
    iri: 'urn:propC',
    label: 'Prop C'
  };
  const dialogOb$: Subject<PathNode> = new ReplaySubject();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatCardModule,
        MatDialogModule
      ],
      declarations: [
        PropertyShapePathComponent,
        MockComponent(AddPathNodeHoverButtonComponent),
        MockComponent(PathNodeDisplayComponent),
      ],
      providers: [
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
            open: { afterClosed: () => dialogOb$.asObservable()}
        }) }
      ]
    }).compileComponents();

    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(PropertyShapePathComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    matDialog = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controller method', () => {
    it('addFirstNode should properly add the first path node', fakeAsync(() => {
      spyOn(component.pathChange, 'emit');
      dialogOb$.next(propANode);
      component.addFirstNode();
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
        data: { parentNode: undefined }
      });
      expect(component.path).toEqual(propANode);
      expect(component.pathChange.emit).toHaveBeenCalledWith(propANode);
    }));
    describe('addSubProperty should correctly update the path', () => {
      beforeEach(() => {
        spyOn(component.pathChange, 'emit');
      });
      it('if adding a node in sequence to a simple IRI path', fakeAsync(() => {
        const event: AddPathNodeEvent = {
          parentNode: undefined,
          seqIdx: 0,
          sibling: propANode,
          isSeq: true
        };
        const newPath: PathNode = { type: 'Sequence', items: [propANode, propBNode] };
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Sequence', items: [propANode] } }
        });
        expect(component.path).toEqual(newPath);
        expect(component.pathChange.emit).toHaveBeenCalledWith(newPath);
      }));
      it('if adding an alternative node to a simple IRI path', fakeAsync(() => {
        const event: AddPathNodeEvent = {
          parentNode: undefined,
          seqIdx: 0,
          sibling: propANode,
          isSeq: false
        };
        const newPath: PathNode = { type: 'Alternative', items: [propANode, propBNode] };
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Alternative', items: [propANode] } }
        });
        expect(component.path).toEqual(newPath);
        expect(component.pathChange.emit).toHaveBeenCalledWith(newPath);
      }));
      it('if adding a node to a top level sequence path', fakeAsync(() => {
        component.path = { type: 'Sequence', items: [propANode, propBNode] };
        const event: AddPathNodeEvent = {
          parentNode: component.path,
          seqIdx: 0,
          sibling: undefined,
          isSeq: true
        };
        const newPath: PathNode = { type: 'Sequence', items: [propANode, propBNode, propCNode] };
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Sequence', items: [propANode, propBNode] } }
        });
        // the modal returned node is the parent node technically
        expect(component.path).toEqual(component.path);
        expect(component.pathChange.emit).toHaveBeenCalledWith(component.path);
      }));
      it('if adding a node to a top level alternative path', fakeAsync(() => {
        component.path = { type: 'Alternative', items: [propANode, propBNode] };
        const event: AddPathNodeEvent = {
          parentNode: component.path,
          seqIdx: 0,
          sibling: undefined,
          isSeq: false
        };
        const newPath: PathNode = { type: 'Alternative', items: [propANode, propBNode, propCNode] };
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Alternative', items: [propANode, propBNode] } }
        });
        // the modal returned node is the parent node technically
        expect(component.path).toEqual(component.path);
        expect(component.pathChange.emit).toHaveBeenCalledWith(component.path);
      }));
      it('if adding a node in sequence after an inverse path', fakeAsync(() => {
        const event: AddPathNodeEvent = {
          parentNode: undefined,
          seqIdx: 0,
          sibling: { type: 'Inverse', path: propANode },
          isSeq: true
        };
        const newPath: PathNode = { type: 'Sequence', items: [{ type: 'Inverse', path: propANode }, propBNode] };
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Sequence', items: [{ type: 'Inverse', path: propANode }] } }
        });
        expect(component.path).toEqual(newPath);
        expect(component.pathChange.emit).toHaveBeenCalledWith(component.path);
      }));
      it('if adding an alternative node to an inverse path', fakeAsync(() => {
        const event: AddPathNodeEvent = {
          parentNode: undefined,
          seqIdx: 0,
          sibling: { type: 'Inverse', path: propANode },
          isSeq: false
        };
        const newPath: PathNode = { type: 'Alternative', items: [{ type: 'Inverse', path: propANode }, propBNode] };
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Alternative', items: [{ type: 'Inverse', path: propANode }] } }
        });
        expect(component.path).toEqual(newPath);
        expect(component.pathChange.emit).toHaveBeenCalledWith(component.path);
      }));
      it('if adding an alternative node to a node in a sequence path', fakeAsync(() => {
        component.path = { type: 'Sequence', items: [propANode, propBNode]};
        const event: AddPathNodeEvent = {
          parentNode: component.path,
          seqIdx: 1,
          sibling: propBNode,
          isSeq: false
        };
        const newPath: PathNode = { type: 'Alternative', items: [propBNode, propCNode]};
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Alternative', items: [propBNode]} }
        });
        expect(component.path).toEqual({
          type: 'Sequence',
          items: [ propANode, newPath ]
        });
        expect(component.pathChange.emit).toHaveBeenCalledWith(component.path);
      }));
      it('if adding a node in sequence within a cardinality path', fakeAsync(() => {
        component.path = { type: 'OneOrMore', path: propANode };
        const event: AddPathNodeEvent = {
          parentNode: component.path,
          seqIdx: 0,
          sibling: propANode,
          isSeq: true
        };
        const newPath: PathNode = { type: 'Sequence', items: [propANode, propBNode]};
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Sequence', items: [propANode]} }
        });
        expect(component.path).toEqual({
          type: 'OneOrMore',
          path: newPath
        });
        expect(component.pathChange.emit).toHaveBeenCalledWith(component.path);
      }));
      it('if adding an alternative node within a cardinality path', fakeAsync(() => {
        component.path = { type: 'OneOrMore', path: propANode };
        const event: AddPathNodeEvent = {
          parentNode: component.path,
          seqIdx: 0,
          sibling: propANode,
          isSeq: false
        };
        const newPath: PathNode = { type: 'Alternative', items: [propANode, propBNode]};
        dialogOb$.next(newPath);
        component.addSubProperty(event);
        tick();
        expect(matDialog.open).toHaveBeenCalledWith(AddPathNodeModalComponent, {
          data: { parentNode: { type: 'Alternative', items: [propANode]} }
        });
        expect(component.path).toEqual({
          type: 'OneOrMore',
          path: newPath
        });
        expect(component.pathChange.emit).toHaveBeenCalledWith(component.path);
      }));
      it('unless an incorrect parent node was provided', () => {
        const event: AddPathNodeEvent = {
          parentNode: propANode,
          seqIdx: 0,
          sibling: undefined,
          isSeq: true
        };
        component.addSubProperty(event);
        expect(matDialog.open).not.toHaveBeenCalled();
        expect(component.pathChange.emit).not.toHaveBeenCalled();

        event.parentNode = { type: 'Inverse', path: propANode};
        component.addSubProperty(event);
        expect(matDialog.open).not.toHaveBeenCalled();
        expect(component.pathChange.emit).not.toHaveBeenCalled();
      });
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.property-shape-path')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-card.target-card')).length).toEqual(1);
    });
    it('depending on whether a path has been set', () => {
      expect(element.queryAll(By.css('app-add-path-node-hover-button')).length).toEqual(1);
      expect(element.queryAll(By.css('app-path-node-display')).length).toEqual(0);
      component.path = propANode;
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-add-path-node-hover-button')).length).toEqual(0);
      expect(element.queryAll(By.css('app-path-node-display')).length).toEqual(1);
    });
  });
});
