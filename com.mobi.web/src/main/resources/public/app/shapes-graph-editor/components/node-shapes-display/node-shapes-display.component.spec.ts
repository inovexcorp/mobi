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

import { MockComponent, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PropertiesBlockComponent } from '../../../shared/components/propertiesBlock/propertiesBlock.component';
import { SelectedDetailsComponent } from '../../../shared/components/selectedDetails/selectedDetails.component';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphManagerService } from '../../../shared/services/shapesGraphManager.service';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { NodeShapesDisplayComponent } from './node-shapes-display.component';
import { find } from 'lodash';

describe('NodeShapesDisplayComponent', () => {
  let component: NodeShapesDisplayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<NodeShapesDisplayComponent>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;

  const selectedEntityIRI = 'http://stardog.com/tutorial/AlbumShape';
  const entityJSONLDObject: JSONLDObject = {
    '@id': 'http://stardog.com/tutorial/AlbumShape',
    '@type': ['http://www.w3.org/ns/shacl#NodeShape'],
    'http://www.w3.org/ns/shacl#node': [{
      '@id': 'http://stardog.com/tutorial/NameShape'
    }],
    'http://www.w3.org/ns/shacl#property': [{
      '@id': 'http://stardog.com/tutorial/AlbumDateShape'
    }, {
      '@id': 'http://stardog.com/tutorial/AlbumArtistShape'
    }, {
      '@id': 'http://stardog.com/tutorial/AlbumTrackShape'
    }, {
      '@id': 'http://mobi.com/.well-known/genid/genid-31a9b3c5e47e49a1ac3f75db0f96a23734-A08C7C083322E6F43ADD97E01465DB37'
    }],
    'http://www.w3.org/ns/shacl#targetClass': [{
      '@id': 'http://stardog.com/tutorial/Album'
    }]
  };
  const nodeShapeBlankEntities: JSONLDObject[] = [{
    '@id': 'http://mobi.com/.well-known/genid/genid-31a9b3c5e47e49a1ac3f75db0f96a23734-A08C7C083322E6F43ADD97E01465DB37',
    'http://www.w3.org/ns/shacl#maxCount': [{
      '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      '@value': '1'
    }],
    'http://www.w3.org/ns/shacl#minCount': [{
      '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      '@value': '1'
    }],
    'http://www.w3.org/ns/shacl#path': [{
      '@id': 'http://matonto.org/ontologies/test#blank1'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/AlbumArtistShape',
    '@type': ['http://www.w3.org/ns/shacl#PropertyShape'],
    'http://www.w3.org/ns/shacl#class': [{
      '@id': 'http://stardog.com/tutorial/Artist'
    }],
    'http://www.w3.org/ns/shacl#minCount': [{
      '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      '@value': '1'
    }],
    'http://www.w3.org/ns/shacl#path': [{
      '@id': 'http://stardog.com/tutorial/artist'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/AlbumDateShape',
    '@type': ['http://www.w3.org/ns/shacl#PropertyShape'],
    'http://www.w3.org/ns/shacl#datatype': [{
      '@id': 'http://www.w3.org/2001/XMLSchema#date'
    }],
    'http://www.w3.org/ns/shacl#maxCount': [{
      '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      '@value': '1'
    }],
    'http://www.w3.org/ns/shacl#minCount': [{
      '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      '@value': '1'
    }],
    'http://www.w3.org/ns/shacl#path': [{
      '@id': 'http://stardog.com/tutorial/date'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/AlbumTrackShape',
    '@type': ['http://www.w3.org/ns/shacl#PropertyShape'],
    'http://www.w3.org/ns/shacl#class': [{
      '@id': 'http://stardog.com/tutorial/Song'
    }],
    'http://www.w3.org/ns/shacl#minCount': [{
      '@type': 'http://www.w3.org/2001/XMLSchema#integer',
      '@value': '1'
    }],
    'http://www.w3.org/ns/shacl#path': [{
      '@id': 'http://stardog.com/tutorial/track'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/NameShape',
    '@type': ['http://www.w3.org/ns/shacl#NodeShape'],
    'http://www.w3.org/ns/shacl#property': [{
      '@id': 'http://mobi.com/.well-known/genid/genid-31a9b3c5e47e49a1ac3f75db0f96a23726-7840025FFBDC6677E947FF014BFD75FF'
    }]
  }];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [
        NodeShapesDisplayComponent,
        MockComponent(PropertiesBlockComponent),
        MockComponent(SelectedDetailsComponent)
      ],
      providers: [
        MockProvider(ShapesGraphStateService)
      ]
    }).compileComponents();
    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.listItem = new ShapesGraphListItem();
    shapesGraphStateStub.listItem.selectedBlankNodes = nodeShapeBlankEntities;
    fixture = TestBed.createComponent(NodeShapesDisplayComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.nodeShape = entityJSONLDObject;
    component.selectedEntityIRI = selectedEntityIRI;
    component.canModify = false;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    shapesGraphStateStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('controller method', () => {
    it('should call setNodeShapeEntity on ngOnChanges', () => {
      spyOn(component as any, '_setNodeShapeEntity');
      component.ngOnChanges();
      expect(component['_setNodeShapeEntity']).toHaveBeenCalled();
    });
    it('should populate properties and entity on setNodeShapeEntity', () => {
      expect(component.nodeShapeProperties).toEqual([]);
      expect(component.readOnly).toEqual(true);
      component.ngOnChanges();
      expect(component.nodeShape).toEqual(jasmine.objectContaining({ '@id': 'http://stardog.com/tutorial/AlbumShape' }));
      expect(component.nodeShapeProperties).toEqual(['http://www.w3.org/ns/shacl#node']);
      expect(component.propertyShapes.length).toEqual(5);
      expect(shapesGraphStateStub.listItem.nodeTab.selectedEntity).toEqual(component.nodeShape);
    });
    it('should clean up subscriptions on destroy', () => {
      const spy = spyOn(component['_destroySub$'], 'next').and.callThrough();
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
  it('should have the correct html', () => {
    component.ngOnChanges();
    fixture.detectChanges();
    expect(element.queryAll(By.css('.node-shapes-display')).length).withContext('.node-shapes-display').toEqual(1);
    expect(element.queryAll(By.css('selected-details')).length).withContext('selected-details').toEqual(1);
    expect(element.queryAll(By.css('properties-block')).length).withContext('.properties-block').toEqual(1);
  });
});