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
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ConfirmModalComponent } from '../../../shared/components/confirmModal/confirmModal.component';
import { EntityNames } from '../../../shared/models/entityNames.interface';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { pathTestCases, constraintTestCases } from '../../models/shacl-test-data';
import { PropertyShape } from '../../models/property-shape.interface';
import { SH, XSD } from '../../../prefixes';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PropertyShapesDisplayComponent } from './property-shapes-display.component';

describe('PropertyShapesDisplayComponent', () => {
  let component: PropertyShapesDisplayComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<PropertyShapesDisplayComponent>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let matDialog: jasmine.SpyObj<MatDialog>;
  let toastStub: jasmine.SpyObj<ToastService>;

  const nodeShape: JSONLDObject = {
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
  const selectedBlankNodes: JSONLDObject[] = [{
    '@id': 'http://mobi.com/.well-known/genid/genid-31a9b3c5e47e49a1ac3f75db0f96a23734-A08C7C083322E6F43ADD97E01465DB37',
    [`${SH}maxCount`]: [{
      '@type': `${XSD}integer`,
      '@value': '1'
    }],
    [`${SH}minCount`]: [{
      '@type': `${XSD}integer`,
      '@value': '1'
    }],
    [`${SH}path`]: [{
      '@id': 'http://matonto.org/ontologies/test#blank1'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/AlbumArtistShape',
    '@type': [`${SH}PropertyShape`],
    [`${SH}class`]: [{
      '@id': 'http://stardog.com/tutorial/Artist'
    }],
    [`${SH}minCount`]: [{
      '@type': `${XSD}integer`,
      '@value': '1'
    }],
    [`${SH}path`]: [{
      '@id': 'http://stardog.com/tutorial/artist'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/AlbumDateShape',
    '@type': [`${SH}PropertyShape`],
    [`${SH}datatype`]: [{
      '@id': `${XSD}date`
    }],
    [`${SH}maxCount`]: [{
      '@type': `${XSD}integer`,
      '@value': '1'
    }],
    [`${SH}minCount`]: [{
      '@type': `${XSD}integer`,
      '@value': '1'
    }],
    [`${SH}path`]: [{
      '@id': 'http://stardog.com/tutorial/date'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/AlbumTrackShape',
    '@type': [`${SH}PropertyShape`],
    [`${SH}class`]: [{
      '@id': 'http://stardog.com/tutorial/Song'
    }],
    [`${SH}minCount`]: [{
      '@type': `${XSD}integer`,
      '@value': '1'
    }],
    [`${SH}path`]: [{
      '@id': 'http://stardog.com/tutorial/track'
    }]
  }, {
    '@id': 'http://stardog.com/tutorial/NameShape',
    '@type': [`${SH}NodeShape`],
    [`${SH}property`]: [{
      '@id': 'http://mobi.com/.well-known/genid/genid-31a9b3c5e47e49a1ac3f75db0f96a23726-7840025FFBDC6677E947FF014BFD75FF'
    }]
  }];
  const entityNames: EntityNames = {
    'http://stardog.com/tutorial/AlbumShape': {label: 'Album Shape', names: ['Album Shape']},
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        MatCardModule,
        MatIconModule,
        MatMenuModule
      ],
      declarations: [
        PropertyShapesDisplayComponent,
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

    matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.listItem = new ShapesGraphListItem();
    shapesGraphStateStub.listItem.selectedBlankNodes = selectedBlankNodes;
    shapesGraphStateStub.listItem.entityInfo = entityNames;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

    fixture = TestBed.createComponent(PropertyShapesDisplayComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.nodeShape = nodeShape;
    component.canModify = true;
    fixture.detectChanges();
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    shapesGraphStateStub = null;
    matDialog = null;
    toastStub = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  describe('should handle changes', () => {
    beforeEach(() => {
      spyOn(component, 'setPropertyShapes');
    });
    it('if the node shape is set', function() {
      component.ngOnChanges();
      expect(component.setPropertyShapes).toHaveBeenCalledWith(nodeShape, selectedBlankNodes, entityNames);
    });
    it('if the node shape is not set', function() {
      component.nodeShape = undefined;
      component.ngOnChanges();
      expect(component.setPropertyShapes).not.toHaveBeenCalled();
    });
  });
  describe('controller methods', () => {
    describe('should set the property shapes', () => {
      it('unless the node shape does not have the sh:property set', () => {
        spyOn(component, 'setConstraints');
        spyOn(component, 'resolvePath').and.returnValue({ asString: '', asHtmlString: '', asStructure: undefined, referencedIds: new Set() });
        component.nodeShape = {
          '@id': 'http://stardog.com/tutorial/AlbumShape',
          '@type': [`${SH}NodeShape`],
          [`${SH}targetClass`]: [{
            '@id': 'http://stardog.com/tutorial/Album'
          }]
        };
        component.setPropertyShapes(component.nodeShape, shapesGraphStateStub.listItem.selectedBlankNodes, entityNames);
        expect(component.propertyShapes).toEqual([]);
        expect(component.resolvePath).not.toHaveBeenCalled();
        expect(component.setConstraints).not.toHaveBeenCalled();
      });
      it('unless the node shape points to a property shape that does not exist', () => {
        spyOn(component, 'setConstraints');
        spyOn(component, 'resolvePath').and.returnValue({ asString: '', asHtmlString: '', asStructure: undefined, referencedIds: new Set() });
        component.nodeShape = {
          '@id': 'http://stardog.com/tutorial/AlbumShape',
          '@type': [`${SH}NodeShape`],
          [`${SH}property`]: [{
            '@id': 'http://stardog.com/tutorial/NonExistentPropertyShape'
          }],
          [`${SH}targetClass`]: [{
            '@id': 'http://stardog.com/tutorial/Album'
          }]
        };
        component.setPropertyShapes(component.nodeShape, shapesGraphStateStub.listItem.selectedBlankNodes, entityNames);
        expect(component.propertyShapes).toEqual([]);
        expect(component.resolvePath).not.toHaveBeenCalled();
        expect(component.setConstraints).not.toHaveBeenCalled();
      });
      it('unless one of the property shapes does not have a path', () => {
        spyOn(component, 'setConstraints');
        spyOn(component, 'resolvePath').and.returnValue({ asString: '', asHtmlString: '', asStructure: undefined, referencedIds: new Set() });
        component.nodeShape = {
          '@id': 'http://stardog.com/tutorial/AlbumShape',
          '@type': [`${SH}NodeShape`],
          [`${SH}property`]: [{
            '@id': 'http://test.com/test/PropertyShape'
          }],
          [`${SH}targetClass`]: [{
            '@id': 'http://stardog.com/tutorial/Album'
          }]
        };
        const arr: JSONLDObject[] = [{
          '@id': 'http://test.com/test/PropertyShape',
          '@type': [`${SH}PropertyShape`],
          [`${SH}class`]: [{
            '@id': 'http://stardog.com/tutorial/Artist'
          }],
          [`${SH}minCount`]: [{
            '@type': `${XSD}integer`,
            '@value': '1'
          }]
        }];
        component.setPropertyShapes(component.nodeShape, arr, entityNames);
        expect(component.propertyShapes).toEqual([]);
        expect(component.resolvePath).not.toHaveBeenCalled();
        expect(component.setConstraints).not.toHaveBeenCalled();
      });
      it('unless the property shape path could not be resolved', () => {
        spyOn(component, 'setConstraints');
        spyOn(component, 'resolvePath').and.returnValue(undefined);
        component.nodeShape = nodeShape;
        const arr: JSONLDObject[] = [selectedBlankNodes[0]];
        component.setPropertyShapes(component.nodeShape, arr, entityNames);
        expect(component.propertyShapes).toEqual([]);
        expect(component.resolvePath).toHaveBeenCalledWith('http://matonto.org/ontologies/test#blank1', jasmine.anything(), entityNames);
        expect(component.setConstraints).not.toHaveBeenCalled();
      });
      it('successfully', () => {
        spyOn(component, 'setConstraints');
        spyOn(component, 'resolvePath').and.returnValue({ asString: 'test', asHtmlString: '<span>test</span>', asStructure: { type: 'IRI', iri: 'iri', label: 'label' }, referencedIds: new Set(['_:b1', '_:b2']) });
        component.nodeShape = nodeShape;
        component.setPropertyShapes(component.nodeShape, shapesGraphStateStub.listItem.selectedBlankNodes, entityNames);
        expect(component.propertyShapes.length).toEqual(4);
        const ids: string[] = nodeShape[`${SH}property`].map(val => val['@id']);
        ids.sort();
        const paths: string[] = selectedBlankNodes.sort((a, b) => a['@id'].localeCompare(b['@id'])).filter(obj => obj[`${SH}path`]).map(obj => obj[`${SH}path`][0]['@id']);
        expect(ids).toEqual(component.propertyShapes.map(ps => ps.id));
        component.propertyShapes.forEach((ps, idx) => {
          expect(ps.jsonld).toEqual(jasmine.objectContaining({
            '@id': ps.id,
          }));
          expect(ps.pathString).toEqual('test');
          expect(ps.pathHtmlString).toEqual('<span>test</span>');
          expect(ps.path).toEqual({ type: 'IRI', iri: 'iri', label: 'label' });
          expect(ps.referencedNodeIds).toEqual(new Set(['_:b1', '_:b2']));
          expect(component.resolvePath).toHaveBeenCalledWith(paths[idx], jasmine.anything(), entityNames);
          expect(component.setConstraints).toHaveBeenCalledWith(ps, jasmine.anything(), entityNames);
        });
      });
    });
    describe('should resolve a path', () => {
      pathTestCases.forEach(testCase => {
        it(`should resolve a path with ${testCase.testName}`, () => {
          const result = component.resolvePath(testCase.iri, testCase.jsonldMap, entityNames);
          expect(result).toBeDefined();
          expect(result.asString).toEqual(testCase.pathString);
          expect(result.asStructure).toEqual(testCase.structure);
          expect(result.referencedIds).toEqual(testCase.referencedIds);
        });
      });
      it('returns undefined if the iri has been visited cannot be resolved', () => {
        const result = component.resolvePath('visited', {}, entityNames, new Set(['visited']));
        expect(result).toBeUndefined();
      });
      it('returns undefined if the blank node cannot be found in the map', () => {
        const iri = '_:b1';
        const result = component.resolvePath(iri, {}, entityNames);
        expect(result).toBeUndefined();
      });
      it('returns undefined if there is a cycle in the path', () => {
        const iri = '_:b1';
        const jsonldMap: Record<string, JSONLDObject> = {
          [iri]: {
            '@id': iri,
            [`${SH}inversePath`]: [{ '@id': iri }]
          }
        };
        const result = component.resolvePath(iri, jsonldMap, entityNames);
        expect(result).toBeUndefined();
      });
    });
    describe('should set the correct constraints', () => {
      // Do the simple tests first
      it('in simple cases', () => {
        const propertyShape: PropertyShape = {
          id: 'http://stardog.com/tutorial/AlbumDateShape',
          label: 'Album Date Shape',
          jsonld: {
            '@id': 'http://stardog.com/tutorial/AlbumDateShape',
          },
          path: undefined,
          pathString: '',
          pathHtmlString: '',
          constraints: [],
          referencedNodeIds: new Set()
        };
        const jsonldMap: Record<string, JSONLDObject> = {};
        const relevantTestCases = constraintTestCases.filter(ts => !ts.separate);
        relevantTestCases.forEach(testCase => {
          propertyShape.jsonld[testCase.key] = testCase.values;
          testCase.bnodes.forEach(bnode => {
            jsonldMap[bnode['@id']] = bnode;
          });
        });
        component.setConstraints(propertyShape, jsonldMap, entityNames);
        expect(propertyShape.constraints.length).toEqual(relevantTestCases.length);
        relevantTestCases.forEach(testCase => {
          expect(propertyShape.constraints).toContain(testCase.constraint);
          testCase.bnodes.forEach(bnode => {
            expect(propertyShape.referencedNodeIds).toContain(bnode['@id']);
          });
        });
      });
      // Do the tests that need to be separate due to shared properties
      constraintTestCases.filter(ts => ts.separate).forEach(testCase => {
        it(`for ${testCase.testName}`, () => {
          const propertyShape: PropertyShape = {
            id: 'http://stardog.com/tutorial/AlbumDateShape',
            label: 'Album Date Shape',
            jsonld: {
              '@id': 'http://stardog.com/tutorial/AlbumDateShape',
              [testCase.key]: testCase.values,
            },
            path: undefined,
            pathString: '',
            pathHtmlString: '',
            constraints: [],
            referencedNodeIds: new Set()
          };
          const jsonldMap: Record<string, JSONLDObject> = {};
          testCase.bnodes.forEach(bnode => {
            jsonldMap[bnode['@id']] = bnode;
          });
          component.setConstraints(propertyShape, jsonldMap, entityNames);
          expect(propertyShape.constraints.length).toEqual(1);
          expect(propertyShape.constraints[0]).toEqual(testCase.constraint);
          testCase.bnodes.forEach(bnode => {
            expect(propertyShape.referencedNodeIds).toContain(bnode['@id']);
          });
        });
      });
    });
    it('should confirm the deletion of a property shape', fakeAsync(() => {
      component.ngOnChanges();
      fixture.detectChanges();
      spyOn(component, 'deletePropertyShape');
      component.confirmPropertyShapeDeletion(component.propertyShapes[0]);
      tick();
      expect(matDialog.open).toHaveBeenCalledWith(ConfirmModalComponent, {data: {content: jasmine.stringMatching('Are you sure you want to delete')}});
      expect(component.deletePropertyShape).toHaveBeenCalledWith(component.propertyShapes[0]);
    }));
    describe('should delete a property shape', () => {
      beforeEach(() => {
        component.ngOnChanges();
        fixture.detectChanges();
      });
      it('successfully', fakeAsync(() => {
        shapesGraphStateStub.removePropertyShape.and.returnValue(of(null));
        const currentLength = component.propertyShapes.length;
        const propertyShape = component.propertyShapes[0];
        component.deletePropertyShape(propertyShape);
        tick();
        expect(shapesGraphStateStub.removePropertyShape).toHaveBeenCalledWith(propertyShape);
        expect(component.propertyShapes.length).toEqual(currentLength - 1);
        expect(component.propertyShapes.findIndex(ps => ps.id === propertyShape.id)).toEqual(-1);
        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
      }));
      it('unless an error occurs', fakeAsync(() => {
        shapesGraphStateStub.removePropertyShape.and.returnValue(throwError('Error message'));
        const currentLength =component.propertyShapes.length;
        component.deletePropertyShape(component.propertyShapes[0]);
        tick();
        expect(shapesGraphStateStub.removePropertyShape).toHaveBeenCalledWith(component.propertyShapes[0]);
        expect(component.propertyShapes.length).toEqual(currentLength);
        expect(toastStub.createErrorToast).toHaveBeenCalledWith('Property Shape unable to be deleted: Error message');
      }));
    });
  });
  describe('contains the correct html', () => {
    beforeEach(() => {
      component.ngOnChanges();
      fixture.detectChanges();
    });
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('.property-shapes-display')).length).toEqual(1);
      expect(element.queryAll(By.css('.section-header')).length).toEqual(1);
    });
    it('with the correct number of property shapes and constraints', () => {
      expect(element.queryAll(By.css('mat-card')).length).toEqual(4);
      expect(element.queryAll(By.css('mat-card-title')).length).toEqual(4);
      expect(element.queryAll(By.css('mat-card-subtitle')).length).toEqual(4);
      expect(element.queryAll(By.css('.constraint')).length).toEqual(9);
    });
    it('should display an info menu on link click', () => {
      const menuLink = element.queryAll(By.css('.section-header a'))[0];
      menuLink.triggerEventHandler('click', null);
      fixture.detectChanges();
      expect(element.queryAll(By.css('.mat-menu-panel')).length).toEqual(1);
    });
    it('should disable the delete buttons appropriately', () => {
      element.queryAll(By.css('.mat-card-actions button[color="warn"]')).forEach(btn => {
        expect(btn.properties['disabled']).toBeFalsy();
      });

      component.isImported = true;
      fixture.detectChanges();
      element.queryAll(By.css('.mat-card-actions button[color="warn"]')).forEach(btn => {
        expect(btn.properties['disabled']).toBeTruthy();
      });

      component.isImported = false;
      component.canModify = false;
      fixture.detectChanges();
      element.queryAll(By.css('.mat-card-actions button[color="warn"]')).forEach(btn => {
        expect(btn.properties['disabled']).toBeTruthy();
      });
    });
  });
  it('should call confirmPropertyShapeDeletion when the button is clicked', function() {
    component.ngOnChanges();
    fixture.detectChanges();
    spyOn(component, 'confirmPropertyShapeDeletion');
    const deleteButton = element.queryAll(By.css('.mat-card-actions button[color="warn"]'))[0];
    deleteButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(component.confirmPropertyShapeDeletion).toHaveBeenCalledWith(component.propertyShapes[0]);
  });
});
