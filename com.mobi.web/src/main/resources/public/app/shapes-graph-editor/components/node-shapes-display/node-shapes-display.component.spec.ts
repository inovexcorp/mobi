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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PropertiesBlockComponent } from '../../../shared/components/propertiesBlock/propertiesBlock.component';
import { PropertyShape } from '../../models/property-shape.interface';
import { PropertyShapesDisplayComponent } from '../property-shapes-display/property-shapes-display.component';
import { SelectedDetailsComponent } from '../../../shared/components/selectedDetails/selectedDetails.component';
import { SH } from '../../../prefixes';
import { ShaclTargetComponent } from '../shacl-target/shacl-target.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { NodeShapesDisplayComponent } from './node-shapes-display.component';

describe('NodeShapesDisplayComponent', () => {
  let component: NodeShapesDisplayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesDisplayComponent>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let matDialog: jasmine.SpyObj<MatDialog>;

  const selectedEntityIRI = 'http://stardog.com/tutorial/AlbumShape';
  const entityJSONLDObject: JSONLDObject = {
    '@id': 'http://stardog.com/tutorial/AlbumShape',
    '@type': [`${SH}NodeShape`],
    [`${SH}node`]: [{
      '@id': 'http://stardog.com/tutorial/NameShape'
    }],
    [`${SH}property`]: [{
      '@id': 'http://stardog.com/tutorial/AlbumDateShape'
    }, {
      '@id': 'http://stardog.com/tutorial/AlbumArtistShape'
    }, {
      '@id': 'http://stardog.com/tutorial/AlbumTrackShape'
    }, {
      '@id': 'http://mobi.com/.well-known/genid/genid-31a9b3c5e47e49a1ac3f75db0f96a23734-A08C7C083322E6F43ADD97E01465DB37'
    }],
    [`${SH}targetClass`]: [{
      '@id': 'http://stardog.com/tutorial/Album'
    }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NodeShapesDisplayComponent,
        MockComponent(PropertiesBlockComponent),
        MockComponent(SelectedDetailsComponent),
        MockComponent(ShaclTargetComponent),
        MockComponent(PropertyShapesDisplayComponent),
        MockComponent(ConfirmModalComponent)
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(ToastService),
        { provide: MatDialog, useFactory: () => jasmine.createSpyObj('MatDialog', {
          open: { afterClosed: () => of(true)}
        }) }
      ]
    }).compileComponents();
    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.listItem = new ShapesGraphListItem();
    shapesGraphStateStub.removeNodeShape.and.returnValue(of(null));
    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    
    fixture = TestBed.createComponent(NodeShapesDisplayComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.nodeShape = entityJSONLDObject;
    component.selectedEntityIRI = selectedEntityIRI;
    component.canModify = false;

    shapesGraphStateStub.checkForExcludedPredicates.and.returnValue(of('0'));
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    shapesGraphStateStub = null;
    matDialog = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controller method', () => {
    it('should call setNodeShapeEntity & checkForExcludedPredicates on ngOnChanges', () => {
      spyOn(component as any, '_setNodeShapeEntity');
      component.ngOnChanges();
      expect(component['_setNodeShapeEntity']).toHaveBeenCalledWith();
      expect(shapesGraphStateStub.checkForExcludedPredicates).toHaveBeenCalledWith('http://stardog.com/tutorial/AlbumShape');
    });
    it('should populate properties and entity on setNodeShapeEntity', () => {
      expect(component.nodeShapeProperties).toEqual([]);
      component.ngOnChanges();
      expect(component.nodeShape).toEqual(jasmine.objectContaining({ '@id': 'http://stardog.com/tutorial/AlbumShape' }));
      expect(component.nodeShapeProperties).toEqual([`${SH}node`]);
    });
    it('should set property shapes properly', () => {
      const list: PropertyShape[] = [
        {
          id: 'iri',
          label: '',
          jsonld: { '@id': 'iri'},
          constraints: [],
          path: undefined,
          pathString: '',
          pathHtmlString: '',
          referencedNodeIds: new Set<string>()
        }
      ];
      component.setPropertyShapes(list);
      expect((component as any)._propertyShapes).toEqual(list);
    });
    it('should confirm deletion of the node shape', fakeAsync(() => {
      component.showDeleteConfirmation();
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringContaining('Are you sure you want to delete')}});
      expect(shapesGraphStateStub.removeNodeShape).toHaveBeenCalledWith(component.nodeShape, []);
    }));
  });
  it('should have the correct html', () => {
    component.ngOnChanges();
    fixture.detectChanges();
    expect(element.queryAll(By.css('.node-shapes-display')).length).toEqual(1);
    expect(element.queryAll(By.css('selected-details')).length).toEqual(1);
    expect(element.queryAll(By.css('properties-block')).length).toEqual(1);
    expect(element.queryAll(By.css('app-property-shapes-display')).length).toEqual(1);
  });
});
