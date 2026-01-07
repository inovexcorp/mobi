/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { MockComponent, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { concat, map } from 'lodash';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { ConstraintControl, ConstraintOption } from '../../models/constraint-control.interface';
import { constraintTestCases, pathTestCases } from '../../models/shacl-test-data';
import { ConstraintTypeFormComponent } from '../constraint-type-form/constraint-type-form.component';
import { ErrorDisplayComponent } from '../../../shared/components/errorDisplay/errorDisplay.component';
import { getBeautifulIRI } from '../../../shared/utility';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { PropertyShape } from '../../models/property-shape.interface';
import { PropertyShapePathComponent } from '../property-shape-path/property-shape-path.component';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ValueOption } from '../../models/value-option.interface';
import { XSD, RDF, SH } from '../../../prefixes';
import { AddPropertyShapeModalComponent } from './add-property-shape-modal.component';

describe('AddPropertyShapeModalComponent', () => {
  let component: AddPropertyShapeModalComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<AddPropertyShapeModalComponent>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
  let matDialogRef: jasmine.SpyObj<MatDialogRef<AddPropertyShapeModalComponent>>;

  const language = {label: 'English', value: 'en'};
  const valueOption: ValueOption = {
    label: 'Test Value',
    value: 'urn:TestValue'
  };
  const controlA: ConstraintControl = {
    type: 'text',
    multiple: false,
    control: new FormControl(),
    label: 'A',
    name: 'A',
    prop: 'urn:propA'
  };
  const controlB: ConstraintControl = {
    type: 'text',
    multiple: false,
    control: new FormControl([]),
    label: 'B',
    name: 'B',
    prop: 'urn:propB'
  };
  const controlC: ConstraintControl = {
    type: 'text',
    multiple: false,
    control: new FormControl('test'),
    label: 'C',
    name: 'C',
    prop: 'urn:propC'
  };
  const controlD: ConstraintControl = {
    type: 'text',
    multiple: false,
    control: new FormControl(''),
    label: 'C',
    name: 'C',
    prop: 'urn:propD'
  };
  const controlE: ConstraintControl = {
    type: 'text',
    multiple: false,
    control: new FormControl(valueOption),
    label: 'C',
    name: 'C',
    prop: 'urn:propE'
  };
  const controlF: ConstraintControl = {
    type: 'text',
    multiple: false,
    control: new FormControl(0),
    label: 'C',
    name: 'C',
    prop: 'urn:propF'
  };
  const optionA: ConstraintOption = {
    label: 'Option A',
    controls: [controlA]
  };
  const optionB: ConstraintOption = {
    label: 'Option B',
    controls: [controlB, controlC]
  };
  const optionC: ConstraintOption = {
    label: 'Option C',
    controls: [controlD, controlE, controlF]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatCheckboxModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
      ],
      declarations: [
        AddPropertyShapeModalComponent,
        MockComponent(ConstraintTypeFormComponent),
        MockComponent(ErrorDisplayComponent),
        MockComponent(PropertyShapePathComponent),
        MockComponent(PropertyShapePathComponent),
      ],
      providers: [
        MockProvider(ShapesGraphStateService),
        MockProvider(PropertyManagerService),
        { provide: MatDialogRef, useFactory: () => jasmine.createSpyObj('MatDialogRef', ['close']) }
      ]
    }).compileComponents();
    
    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.saveCurrentChanges.and.returnValue(of(null));
    shapesGraphStateStub.listItem = new ShapesGraphListItem();
    propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
    propertyManagerStub.languageList = [language];
    propertyManagerStub.defaultDatatypes = concat(
      map(['anyURI', 'boolean', 'byte', 'dateTime', 'decimal', 'double', 'float', 'int', 'integer', 'language', 'long', 'string'], item => {
        shapesGraphStateStub.listItem.dataPropertyRange[XSD + item] = XSD.slice(0, -1);
        return XSD + item;
      }),
      map(['langString'], item => {
        shapesGraphStateStub.listItem.dataPropertyRange[RDF + item] = RDF.slice(0, -1);
        return RDF + item;
      })
    );
    matDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AddPropertyShapeModalComponent>>;

    fixture = TestBed.createComponent(AddPropertyShapeModalComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(function() {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    shapesGraphStateStub = null;
    propertyManagerStub = null;
    matDialogRef = null;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should initialize the list of ConstraintOptions properly', () => {
    expect(component.constraintTypes.length).toEqual(15);
  });
  describe('controller method', () => {
    describe('handleConstraintChange properly updates the form controls', () => {
      it('if no constraints where selected before', () => {
        component.handleConstraintChange([optionA]);
        expect(component.selectedConstraintTypes).toEqual([optionA]);
        expect(Object.keys(component.constraintForm.controls)).toContain(controlA.name);
      });
      it('if constraints are added', () => {
        component.constraintForm.addControl(controlA.name, controlA.control);
        component.selectedConstraintTypes = [optionA];
        component.handleConstraintChange([optionA, optionB]);
        expect(component.selectedConstraintTypes).toEqual([optionA, optionB]);
        expect(Object.keys(component.constraintForm.controls)).toContain(controlA.name);
        expect(Object.keys(component.constraintForm.controls)).toContain(controlB.name);
        expect(Object.keys(component.constraintForm.controls)).toContain(controlC.name);
      });
      it('if constraints were removed', () => {
        component.constraintForm.addControl(controlA.name, controlA.control);
        component.selectedConstraintTypes = [optionA];
        component.handleConstraintChange([]);
        expect(component.selectedConstraintTypes).toEqual([]);
        expect(Object.keys(component.constraintForm.controls)).not.toContain(controlA.name);
      });
      it('if constraints were added and removed', () => {
        component.constraintForm.addControl(controlA.name, controlA.control);
        component.selectedConstraintTypes = [optionA];
        component.handleConstraintChange([optionB]);
        expect(component.selectedConstraintTypes).toEqual([optionB]);
        expect(Object.keys(component.constraintForm.controls)).not.toContain(controlA.name);
        expect(Object.keys(component.constraintForm.controls)).toContain(controlB.name);
        expect(Object.keys(component.constraintForm.controls)).toContain(controlC.name);
      });
    });
    it('enableConstraints should enable the constraintType field', () => {
      expect(component.constraintForm.controls['constraintType'].enabled).toBeFalse();
      component.enableConstraints();
      expect(component.constraintForm.controls['constraintType'].enabled).toBeTrue();
    });
    it('getTypeText should return a name for a ConstraintOption', () => {
      expect(component.getTypeText(optionA)).toEqual(optionA.label);
      expect(component.getTypeText(undefined)).toEqual('');
    });
    describe('create should make a new PropertyShape', () => {
      const pathIri = 'urn:path';
      beforeEach(() => {
        shapesGraphStateStub.listItem.selected = {
          '@id': 'urn:NodeShape',
          '@type': [`${SH}NodeShape`]
        };
        component.path = {
          type: 'IRI',
          iri: pathIri,
          label: 'Path'
        };
        spyOn(component, 'addPathToShape').and.returnValue(pathIri);
        spyOn(component, 'addConstraintsToShape');
      });
      it('if the name and message fields are set', fakeAsync(() => {
        const expectedPropShapeJsonld = {
          '@id': jasmine.any(String),
          '@type': [`${SH}PropertyShape`],
          [`${SH}name`]: [{ '@value': 'Name' }],
          [`${SH}message`]: [{ '@value': 'Message' }],
          [`${SH}path`]: [{ '@id': pathIri }]
        };
        const expectedPropShape = jasmine.objectContaining({
          id: jasmine.any(String),
          label: 'Name',
          message: 'Message',
          jsonld: expectedPropShapeJsonld,
          constraints: [],
          path: component.path,
          pathString: '',
          pathHtmlString: '',
          referencedNodeIds: new Set<string>()
        });
        component.constraintForm.controls['name'].setValue('Name');
        component.constraintForm.controls['message'].setValue('Message');
        component.create();
        tick();
        expect(component.addPathToShape).toHaveBeenCalledWith(expectedPropShape, component.path, [expectedPropShapeJsonld]);
        expect(component.addConstraintsToShape).toHaveBeenCalledWith(expectedPropShape, [expectedPropShapeJsonld]);
        expect(shapesGraphStateStub.addToAdditions).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.recordId, {
          '@id': shapesGraphStateStub.listItem.selected['@id'],
          [`${SH}property`]: [{ '@id': jasmine.any(String) }]
        });
        expect(shapesGraphStateStub.addToAdditions).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.recordId, expectedPropShapeJsonld);
        expect(shapesGraphStateStub.saveCurrentChanges).toHaveBeenCalledWith();
        expect(shapesGraphStateStub.listItem.selected[`${SH}property`]).toEqual([{ '@id': jasmine.any(String) }]);
        expect(shapesGraphStateStub.listItem.selectedBlankNodes).toContain(expectedPropShapeJsonld);
        expect(component.errorMessage).toEqual('');
        expect(matDialogRef.close).toHaveBeenCalledWith(expectedPropShape);
      }));
      it('if the name and message fields are not set', fakeAsync(() => {
        const expectedPropShapeJsonld = {
          '@id': jasmine.any(String),
          '@type': [`${SH}PropertyShape`],
          [`${SH}path`]: [{ '@id': pathIri }]
        };
        const expectedPropShape = jasmine.objectContaining({
          id: jasmine.any(String),
          label: jasmine.any(String),
          message: undefined,
          jsonld: expectedPropShapeJsonld,
          constraints: [],
          path: component.path,
          pathString: '',
          pathHtmlString: '',
          referencedNodeIds: new Set<string>()
        });
        component.create();
        tick();
        expect(component.addPathToShape).toHaveBeenCalledWith(expectedPropShape, component.path, [expectedPropShapeJsonld]);
        expect(component.addConstraintsToShape).toHaveBeenCalledWith(expectedPropShape, [expectedPropShapeJsonld]);
        expect(shapesGraphStateStub.addToAdditions).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.recordId, {
          '@id': shapesGraphStateStub.listItem.selected['@id'],
          [`${SH}property`]: [{ '@id': jasmine.any(String) }]
        });
        expect(shapesGraphStateStub.addToAdditions).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.recordId, expectedPropShapeJsonld);
        expect(shapesGraphStateStub.saveCurrentChanges).toHaveBeenCalledWith();
        expect(shapesGraphStateStub.listItem.selectedBlankNodes).toContain(expectedPropShapeJsonld);
        expect(component.errorMessage).toEqual('');
        expect(matDialogRef.close).toHaveBeenCalledWith(expectedPropShape);
      }));
      it('unless saving changes fails', fakeAsync(() => {
        const expectedPropShapeJsonld = {
          '@id': jasmine.any(String),
          '@type': [`${SH}PropertyShape`],
          [`${SH}path`]: [{ '@id': pathIri }]
        };
        const expectedPropShape = jasmine.objectContaining({
          id: jasmine.any(String),
          label: jasmine.any(String),
          message: undefined,
          jsonld: expectedPropShapeJsonld,
          constraints: [],
          path: component.path,
          pathString: '',
          pathHtmlString: '',
          referencedNodeIds: new Set<string>()
        });
        shapesGraphStateStub.saveCurrentChanges.and.returnValue(throwError('Error message'));
        component.create();
        tick();
        expect(component.addPathToShape).toHaveBeenCalledWith(expectedPropShape, component.path, [expectedPropShapeJsonld]);
        expect(component.addConstraintsToShape).toHaveBeenCalledWith(expectedPropShape, [expectedPropShapeJsonld]);
        expect(shapesGraphStateStub.addToAdditions).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.recordId, {
          '@id': shapesGraphStateStub.listItem.selected['@id'],
          [`${SH}property`]: [{ '@id': jasmine.any(String) }]
        });
        expect(shapesGraphStateStub.addToAdditions).toHaveBeenCalledWith(shapesGraphStateStub.listItem.versionedRdfRecord.recordId, expectedPropShapeJsonld);
        expect(shapesGraphStateStub.saveCurrentChanges).toHaveBeenCalledWith();
        expect(shapesGraphStateStub.listItem.selectedBlankNodes).toEqual([]);
        expect(component.errorMessage).toEqual('Error message');
        expect(matDialogRef.close).not.toHaveBeenCalled();
      }));
    });
    describe('addPathToShape should properly generate RDF and path strings for', () => {
      beforeEach(() => {
        shapesGraphStateStub.getEntityName.and.callFake(iri => getBeautifulIRI(iri));
      });
      pathTestCases.forEach(test => {
        it(test.testName, () => {
          const bnodeIds = Object.keys(test.jsonldMap);
          let idx = 0;
          spyOn((component as any), '_getBnode').and.callFake(() => {
            const id = bnodeIds[idx];
            idx++;
            return id;
          });
          const propertyShape: PropertyShape = {
            id: 'urn:propShape',
            label: 'Prop Shape',
            message: undefined,
            jsonld: { '@id': 'urn:propShape' },
            constraints: [],
            path: test.structure,
            pathString: '',
            pathHtmlString: '',
            referencedNodeIds: new Set<string>()
          };
          const additions: JSONLDObject[] = [];
          expect(component.addPathToShape(propertyShape, test.structure, additions)).toEqual(test.iri);
          expect(propertyShape.pathString).toEqual(test.pathString);
          expect(propertyShape.referencedNodeIds).toEqual(test.referencedIds);
          expect(additions.sort((a, b) => a['@id'].localeCompare(b['@id']))).toEqual(Object.values(test.jsonldMap).sort((a, b) => a['@id'].localeCompare(b['@id'])));
        });
      });
    });
    it('addConstraintsToShape should iterate through selected controls with values', () => {
      spyOn(component, 'processConstraintControl');
      component.selectedConstraintTypes = [optionA, optionB, optionC];
      const propertyShape: PropertyShape = {
        id: 'urn:propShape',
        label: 'Prop Shape',
        message: undefined,
        jsonld: { '@id': 'urn:propShape' },
        constraints: [],
        path: undefined,
        pathString: '',
        pathHtmlString: '',
        referencedNodeIds: new Set<string>()
      };
      component.addConstraintsToShape(propertyShape, []);
      [controlC, controlE, controlF].forEach(control => {
        expect(component.processConstraintControl).toHaveBeenCalledWith(control, propertyShape, []);
      });
    });
    describe('processConstraintControl should properly generate RDF and objects for', () => {
      // TODO: figure out what to do with hasValue and in
      constraintTestCases.filter(test => !test.separate).forEach(test => {
        it(test.testName, () => {
          const constraintControl: ConstraintControl = component.constraintTypes
            .reduce((acc, val) => acc.concat(val.controls), [])
            .find((control: ConstraintControl) => control.prop === test.key);
          if (!constraintControl) {
            fail('Unexpected test');
          }
          constraintControl.control = test.control;
          const bnodes: string[] = test.bnodes.map(bnode => bnode['@id']).reverse();
          let i = 0;
          spyOn((component as any), '_getBnode').and.callFake(() => {
            const id = bnodes[i];
            i++;
            return id;
          });
          const propertyShape: PropertyShape = {
            id: 'urn:propShape',
            label: 'Prop Shape',
            message: undefined,
            jsonld: { '@id': 'urn:propShape' },
            constraints: [],
            path: undefined,
            pathString: '',
            pathHtmlString: '',
            referencedNodeIds: new Set<string>()
          };
          const additions: JSONLDObject[] = [];
          component.processConstraintControl(constraintControl, propertyShape, additions);
          expect(propertyShape.constraints).toEqual([test.constraint]);
          test.bnodes.forEach(bnode => {
            expect(propertyShape.referencedNodeIds.has(bnode['@id'])).toBeTruthy();
          });
          expect(propertyShape.jsonld[test.key]).toEqual(test.values);
        });
      });
    });
  });
  describe('contains the correct html', () => {
    it('for wrapping containers', () => {
      expect(element.queryAll(By.css('h1[mat-dialog-title]')).length).toEqual(1);
      expect(element.queryAll(By.css('form[mat-dialog-content]')).length).toEqual(1);
      expect(element.queryAll(By.css('div[mat-dialog-actions]')).length).toEqual(1);
    });
    it('with mat-form-fields', () => {
      expect(element.queryAll(By.css('mat-form-field')).length).toEqual(3);
    });
    ['input[formControlName="name"]', 'input[formControlName="message"]', '.path-configuration', 'app-property-shape-path', '.constraint-content', 'mat-select'].forEach(selector => {
      it(`with a ${selector}`, () => {
        expect(element.queryAll(By.css(selector)).length).toEqual(1);
      });
    });
    it('depending on how many constraint options are selected', () => {
      expect(element.queryAll(By.css('app-constraint-type-form')).length).toEqual(0);
      component.selectedConstraintTypes = [optionA, optionB, optionC];
      fixture.detectChanges();
      expect(element.queryAll(By.css('app-constraint-type-form')).length).toEqual(3);
    });
    it('with buttons to cancel and submit', () => {
      const buttons = element.queryAll(By.css('.mat-dialog-actions button'));
      expect(buttons.length).toEqual(2);
      expect(['Cancel', 'Submit']).toContain(buttons[0].nativeElement.textContent.trim());
      expect(['Cancel', 'Submit']).toContain(buttons[1].nativeElement.textContent.trim());
    });
  });
  it('should call create when the button is clicked', () => {
    spyOn(component, 'create');
    const button = element.queryAll(By.css('div[mat-dialog-actions] button[color="primary"]'))[0];
    button.triggerEventHandler('click', null);
    expect(component.create).toHaveBeenCalledWith();
  });
  it('should call cancel when the button is clicked', () => {
    const cancelButton = element.queryAll(By.css('.mat-dialog-actions button:not([color="primary"])'))[0];
    cancelButton.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(matDialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
