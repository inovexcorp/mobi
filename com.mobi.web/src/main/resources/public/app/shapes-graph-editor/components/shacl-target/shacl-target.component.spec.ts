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
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { PropertyManagerService } from '../../../shared/services/propertyManager.service';
import { RDFS, SH } from '../../../prefixes';
import { ShapesGraphListItem } from '../../../shared/models/shapesGraphListItem.class';
import { ShapesGraphStateService } from '../../../shared/services/shapesGraphState.service';
import { SparqlManagerService } from '../../../shared/services/sparqlManager.service';
import { SPARQLSelectResults } from '../../../shared/models/sparqlSelectResults.interface';
import { ToastService } from '../../../shared/services/toast.service';
import { ShaclTargetComponent } from './shacl-target.component';

describe('ShapesTargetComponent', () => {
  let component: ShaclTargetComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<ShaclTargetComponent>;
  let sparqlManagerStub: jasmine.SpyObj<SparqlManagerService>;
  let shapesGraphStateStub: jasmine.SpyObj<ShapesGraphStateService>;
  let propertyManagerStub: jasmine.SpyObj<PropertyManagerService>;
  let toastStub: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatChipsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatRadioModule,
        MatSelectModule,
        MatMenuModule
      ],
      declarations: [
        ShaclTargetComponent,
      ],
      providers: [
        MockProvider(SparqlManagerService),
        MockProvider(PropertyManagerService),
        MockProvider(ShapesGraphStateService),
        MockProvider(ToastService)
      ]
    }).compileComponents();
    sparqlManagerStub = TestBed.inject(SparqlManagerService) as jasmine.SpyObj<SparqlManagerService>;
    shapesGraphStateStub = TestBed.inject(ShapesGraphStateService) as jasmine.SpyObj<ShapesGraphStateService>;
    shapesGraphStateStub.listItem = new ShapesGraphListItem();
    shapesGraphStateStub.listItem.versionedRdfRecord = {
      recordId: 'recordId',
      title: 'title',
      branchId: 'branchId',
      commitId: ''
    }
    propertyManagerStub = TestBed.inject(PropertyManagerService) as jasmine.SpyObj<PropertyManagerService>;
    toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    
    fixture = TestBed.createComponent(ShaclTargetComponent);
    component = fixture.componentInstance;
    component.versionedRdfRecord = {
      title: 'title',
      recordId: 'recordId',
      branchId: 'branchId',
      commitId: 'commitId',
      tagId: ''
    };
    element = fixture.debugElement;
    fixture.detectChanges();
  });

  afterEach(function () {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    sparqlManagerStub = null;
    shapesGraphStateStub = null;
    propertyManagerStub = null;
    toastStub = null;
  });
  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
  describe('controller method', () => {
    describe('updateValidatorsForTarget', () => {
      const getFieldData = (control) => {
        return {
          valid: control.valid, 
          touched: control.touched, 
          dirty: control.dirty, 
          value: control.value, 
          errors: control.errors
        }
      };
      it('should apply IRI pattern validator for TargetNode', () => {
        component.targetForm.enable();
        const targetControl = component.targetForm.get('target');
        targetControl.setValue(component.TARGET_NODE);
        targetControl.updateValueAndValidity();
        expect(getFieldData(targetControl)).toEqual({valid: true, touched: false, dirty: false, value: component.TARGET_NODE, errors: null});

        const targetValueControl = component.targetForm.get('targetValue');
        component['_updateValidatorsForTarget'](component.TARGET_NODE);
        targetValueControl.setValue('1111111111https://example.org');
        targetValueControl.updateValueAndValidity();
        expect(getFieldData(targetValueControl)).toEqual({valid: false, touched: false, dirty: false, value: '1111111111https://example.org', errors: null});

        targetValueControl.setValue('urn:hello');
        targetValueControl.updateValueAndValidity();
        expect(getFieldData(targetValueControl)).toEqual({valid: false, touched: false, dirty: false, value: 'urn:hello', errors: null});
      });
      it('should not apply pattern validator for TargetClass', () => {
        component['_updateValidatorsForTarget'](component.TARGET_CLASS);
        const control = component.targetForm.get('targetValue');
        control.setValue('invalid');
        expect(control.hasError('pattern')).toBeFalse();
      });
      it('should disable field for ImplicitReference', () => {
        component['_updateValidatorsForTarget'](component.IMPLICIT_REFERENCE);
        const control = component.targetForm.get('targetValue');
        expect(control.disabled).toBeTrue();
      });
    });
    describe('_fetchIris', () => {
      it('should return IRIs from SPARQL results', fakeAsync(() => {
        const mockResults: SPARQLSelectResults = {
          head: {
            vars: ['iri']
          },
          results: {
            bindings: [
              { iri: { value: 'http://example.org/one', type: '' } },
              { iri: { value: 'http://example.org/two', type: '' } }
            ]
          }
        };
        sparqlManagerStub.postQuery.and.returnValue(of(mockResults));
        tick(); // flush any microtasks
        component['_fetchIris']('FAKE_QUERY').subscribe((iris) => {
          expect(iris).toEqual([
            'http://example.org/one',
            'http://example.org/two'
          ]);
        });
      }));
    });
    describe('getTargetType', () => {
      it('should detect TargetNode', () => {
        const shape: JSONLDObject = {
          '@id': 'iri',
          [component.TARGET_NODE]: [{'@id': 'http://example.org/node'}]
        };
        component.nodeShape = shape;
        const result = component['_detectTargetType']();
        expect(result?.targetType).toBe(component.TARGET_NODE);
      });
      it('should detect ImplicitReference from type', () => {
        const shape: JSONLDObject  = {
          '@id': 'http://example.org/implicit',
          '@type': [`${RDFS}Class`, `${SH}NodeShape`]
        };
        component.nodeShape = shape;
        const result = component['_detectTargetType']();
        expect(result?.targetType).toBe(component.IMPLICIT_REFERENCE);
      });
      it('should return null if no target type found', () => {
        const shape: JSONLDObject  = { '@id': 'iri' };
        component.nodeShape = shape;
        const result = component['_detectTargetType']();
        expect(result).toBeNull();
      });
    });
    describe('SPARQL query builder', () => {
      it('getClassesQuery should include searchText', () => {
        const query = component.getClassesQuery('Person');
        expect(query).toContain('FILTER(CONTAINS(LCASE(STR(?iri)), "person"))');
      });
      it('getObjectPropertiesQuery should include searchText', () => {
        const query = component.getObjectPropertiesQuery('hasPart');
        expect(query).toContain('FILTER(CONTAINS(LCASE(STR(?iri)), "haspart"))');
      });
      it('getPropertiesByTypeQuery should include FILTER and ORDER', () => {
        const query = component.getPropertiesByTypeQuery('relatedTo');
        expect(query).toContain('FILTER(CONTAINS(LCASE(STR(?iri)), "relatedto"))');
        expect(query).toContain('ORDER BY ?iri');
      });
    });
  });
  describe('Form rendering', () => {
    it('should render all target type radio buttons', () => {
      const radios = fixture.debugElement.queryAll(By.css('mat-radio-button'));
      expect(radios.length).toBe(component.targetStrategies.length);
    });
  });
  // Uncomment for editing ticket
  // describe('Edit and Save Buttons', () => {
  //   it('should show Edit button when editMode is false', () => {
  //     component.editMode = false;
  //     component.canModify = true;
  //     fixture.detectChanges();

  //     const editBtn = fixture.debugElement.query(By.css('.edit-button'));
  //     expect(editBtn.nativeElement.textContent.trim()).toBe('Edit');
  //   });
  //   it('should show Save button when editMode is true', () => {
  //     component.editMode = true;
  //     component.canModify = true;
  //     fixture.detectChanges();

  //     const saveBtn = fixture.debugElement.query(By.css('.save-button'));
  //     expect(saveBtn.nativeElement.textContent.trim()).toBe('Save');
  //   });
  // });
  describe('Validation and Target Switching', () => {
    it('should show IRI pattern error for invalid targetValue if target is TargetNode', () => {
      component.targetForm.patchValue({ target: 'TargetNode', targetValue: 'not-an-iri' });
      component['_updateValidatorsForTarget'](component.TARGET_NODE);
      const control = component.targetForm.get('targetValue');
      control.markAsTouched();
      fixture.detectChanges();
    });
    it('should show input when target is TargetClass', () => {
      component.editMode = true;
      component.targetForm.patchValue({ target: 'TargetClass' });
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input[formControlName="targetValue"]'));
      expect(input).toBeTruthy();
    });
  });
});