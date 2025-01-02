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
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { DebugElement, EventEmitter } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule, ReactiveFormsModule, UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { cloneDeep } from 'lodash';

import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RDF, SHACL, SHACL_FORM, XSD } from '../../../prefixes';
import { SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { SHACLFormManagerService } from '../../services/shaclFormManager.service';
import { Option } from '../../models/option.class';
import { SHACLFormFieldComponent } from './shacl-form-field.component';

describe('SHACLFormFieldComponent', () => {
  let component: SHACLFormFieldComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<SHACLFormFieldComponent>;
  let shaclFormManagerStub: jasmine.SpyObj<SHACLFormManagerService>;

  const nodeShape: JSONLDObject = { '@id': 'urn:NodeShape', '@type': [`${SHACL}NodeShape`] };
  const propertyShapeId = 'urn:PropertyShapeA';
  const propertyName = 'urn:testProp';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatRadioModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatSelectModule,
        MatTooltipModule,
        MatAutocompleteModule
      ],
      providers: [
        MockProvider(SHACLFormManagerService)
      ],
      declarations: [ SHACLFormFieldComponent ]
    })
    .compileComponents();

    shaclFormManagerStub = TestBed.inject(SHACLFormManagerService) as jasmine.SpyObj<SHACLFormManagerService>;
    shaclFormManagerStub.getAutocompleteOptions.and.returnValue(of([new Option('urn:recordA', 'record A')]));
    shaclFormManagerStub.fieldUpdated = new EventEmitter<string>();
    fixture = TestBed.createComponent(SHACLFormFieldComponent);
    component = fixture.componentInstance;
    element = fixture.debugElement;
    component.controlName = propertyName;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
    shaclFormManagerStub = null;
  });

  describe('should handle another field in the form being updated', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}AutocompleteInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }]
    };
    const option = new Option('A', 'A');
    it('if the current field is the one that was updated', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(option)
      });
      fixture.detectChanges();
      shaclFormManagerStub.fieldUpdated.emit(propertyName);
      expect(component.fieldFormControl.value).toEqual(option);
    });
    it('if the current field is not an autocomplete', () => {
      const propertyShapeClone = cloneDeep(propertyShape);
      propertyShapeClone[`${SHACL_FORM}usesFormField`] = [{ '@id': `${SHACL_FORM}TextInput` }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShapeClone]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('Test')
      });
      fixture.detectChanges();
      shaclFormManagerStub.fieldUpdated.emit('urn:otherProperty');
      expect(component.fieldFormControl.value).toEqual('Test');
    });
    it('if the current field is an autocomplete with no SPARQL constraint', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(option)
      });
      fixture.detectChanges();
      shaclFormManagerStub.fieldUpdated.emit('urn:otherProperty');
      expect(component.fieldFormControl.value).toEqual(option);
    });
    it('if the current field is an autocomplete with a SPARQL constraint', () => {
      const propertyShapeClone = cloneDeep(propertyShape);
      propertyShapeClone[`${SHACL}sparql`] = [{ '@id': '_:someBnode' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShapeClone]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(option)
      });
      fixture.detectChanges();
      shaclFormManagerStub.fieldUpdated.emit('urn:otherProperty');
      expect(component.fieldFormControl.value).toEqual(new Option('', ''));
    });
  });
  describe('should create for a TextInput', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }]
    };
    it('with a value already set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('initial')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('initial');
      expect(element.queryAll(By.css('.text-field')).length).toEqual(1);
    });
    it('with a value already set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'DEFAULT' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('initial')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('initial');
      expect(element.queryAll(By.css('.text-field')).length).toEqual(1);
    });
    it('with no value set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
      expect(element.queryAll(By.css('.text-field')).length).toEqual(1);
    });
    it('with no value set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'DEFAULT' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('DEFAULT');
      expect(element.queryAll(By.css('.text-field')).length).toEqual(1);
    });
    it('with validators', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}minCount`] = [{ '@value': '1' }];
      adjustedPropertyShape[`${SHACL}pattern`] = [{ '@value': 'word' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
      expect(element.queryAll(By.css('.text-field')).length).toEqual(1);
      expect(component.fieldFormControl.invalid).toBeTruthy();
      component.fieldFormControl.setValue('word');
      fixture.detectChanges();
      expect(component.fieldFormControl.invalid).toBeFalsy();
      component.fieldFormControl.setValue('error');
      fixture.detectChanges();
      expect(component.fieldFormControl.invalid).toBeTruthy();
    });
  });
  describe('should create for a TextareaInput', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextareaInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }]
    };
    it('with a value already set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('initial')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('initial');
      expect(element.queryAll(By.css('.textarea-field')).length).toEqual(1);
    });
    it('with a value already set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'DEFAULT' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('initial')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('initial');
      expect(element.queryAll(By.css('.textarea-field')).length).toEqual(1);
    });
    it('with no value set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
      expect(element.queryAll(By.css('.textarea-field')).length).toEqual(1);
    });
    it('with no value set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'DEFAULT' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('DEFAULT');
      expect(element.queryAll(By.css('.textarea-field')).length).toEqual(1);
    });
    it('with validators', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}minCount`] = [{ '@value': '1' }];
      adjustedPropertyShape[`${SHACL}pattern`] = [{ '@value': 'word' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
      expect(element.queryAll(By.css('.textarea-field')).length).toEqual(1);
      expect(component.fieldFormControl.invalid).toBeTruthy();
      component.fieldFormControl.setValue('word');
      fixture.detectChanges();
      expect(component.fieldFormControl.invalid).toBeFalsy();
      component.fieldFormControl.setValue('error');
      fixture.detectChanges();
      expect(component.fieldFormControl.invalid).toBeTruthy();
    });
  });
  describe('should create for a ToggleInput', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}ToggleInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }],
      [`${SHACL}datatype`]: [{ '@id': `${XSD}boolean` }]
    };
    it('with a value already set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('true')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(true);
      expect(element.queryAll(By.css('.toggle-field')).length).toEqual(1);
    });
    it('with a value already set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'true' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('false')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(false);
      expect(element.queryAll(By.css('.toggle-field')).length).toEqual(1);
    });
    it('with no value set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(false);
      expect(element.queryAll(By.css('.toggle-field')).length).toEqual(1);
    });
    it('with no value set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'true' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(true);
      expect(element.queryAll(By.css('.toggle-field')).length).toEqual(1);
    });
  });
  describe('should create for a Dropdown', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}DropdownInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode1: JSONLDObject = {
      '@id': '_:b1',
      [`${RDF}first`]: [{ '@value': 'A' }],
      [`${RDF}rest`]: [{ '@id': '_:b2' }],
    };
    const bnode2: JSONLDObject = {
      '@id': '_:b2',
      [`${RDF}first`]: [{ '@value': 'B' }],
      [`${RDF}rest`]: [{ '@id': '_:b3' }],
    };
    const bnode3: JSONLDObject = {
      '@id': '_:b3',
      [`${RDF}first`]: [{ '@value': 'C' }],
      [`${RDF}rest`]: [{ '@id': `${RDF}nil` }],
    };
    it('with a value already set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(new Option('A', 'A'))
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(new Option('A', 'A'));
      expect(element.queryAll(By.css('.dropdown-field')).length).toEqual(1);
      expect(component.options.length).toEqual(3);
    });
    it('with no value set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
      expect(element.queryAll(By.css('.dropdown-field')).length).toEqual(1);
      expect(component.options.length).toEqual(3);
    });
  });
  describe('should create for an Autocomplete', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}AutocompleteInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode1: JSONLDObject = {
      '@id': '_:b1',
      [`${RDF}first`]: [{ '@value': 'A' }],
      [`${RDF}rest`]: [{ '@id': '_:b2' }],
    };
    const bnode2: JSONLDObject = {
      '@id': '_:b2',
      [`${RDF}first`]: [{ '@value': 'B' }],
      [`${RDF}rest`]: [{ '@id': '_:b3' }],
    };
    const bnode3: JSONLDObject = {
      '@id': '_:b3',
      [`${RDF}first`]: [{ '@value': 'C' }],
      [`${RDF}rest`]: [{ '@id': `${RDF}nil` }],
    };
    it('with options set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(new Option('A', 'A'))
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(element.queryAll(By.css('.autocomplete-field')).length).toEqual(1);
      expect(component.options.length).toEqual(3);
    });
    it('with no options set', () => {
      const propertyShapeClone = cloneDeep(propertyShape);
      delete propertyShapeClone[`${SHACL}in`];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShapeClone]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(new Option('A', 'A'))
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(element.queryAll(By.css('.autocomplete-field')).length).toEqual(1);
      expect(component.options.length).toEqual(0);
    });
    it('with a valid selection', fakeAsync(() => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(new Option('A', 'A'))
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      component.parentFormGroup.get(propertyName).setValue(new Option('A', 'A'));
      fixture.detectChanges(); // Process synchronous changes
      tick(250); // wait for debounce time
      expect(component.fieldFormControl.errors).toBeNull();
      expect(component.fieldFormControl.value.name).toBe('A');
      flush();
    }));
    it('with an invalid selection', fakeAsync(() => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(new Option('A', 'A'))
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      component.parentFormGroup.get(propertyName).setValue(new Option('D', 'D'));
      fixture.detectChanges(); // Process synchronous changes
      tick(250); // wait for debounce time
      expect(component.fieldFormControl.errors).not.toBeNull();
    }));
    it('with no selection', fakeAsync(() => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(new Option('A', 'A'))
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      fixture.detectChanges(); // Process synchronous changes
      tick(250); // wait for debounce time
      expect(component.fieldFormControl.errors).toBeNull();
    }));
  });
  describe('should create for a RadioInput', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode1: JSONLDObject = {
      '@id': '_:b1',
      [`${RDF}first`]: [{ '@value': 'A' }],
      [`${RDF}rest`]: [{ '@id': '_:b2' }],
    };
    const bnode2: JSONLDObject = {
      '@id': '_:b2',
      [`${RDF}first`]: [{ '@value': 'B' }],
      [`${RDF}rest`]: [{ '@id': '_:b3' }],
    };
    const bnode3: JSONLDObject = {
      '@id': '_:b3',
      [`${RDF}first`]: [{ '@value': 'C' }],
      [`${RDF}rest`]: [{ '@id': `${RDF}nil` }],
    };
    it('with a value already set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      const value = component.formFieldConfig.values.filter(val => val.value === 'A')[0];
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(value)
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(value);
      expect(element.queryAll(By.css('.radio-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-radio-button')).length).toEqual(3);
      const checked = element.queryAll(By.css('mat-radio-button.mat-radio-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('A');
    });
    it('with a value already set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'B' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape, bnode1, bnode2, bnode3]);
      const value = component.formFieldConfig.values.filter(val => val.value === 'A')[0];
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl(value)
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(new Option('A', 'A'));
      expect(element.queryAll(By.css('.radio-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-radio-button')).length).toEqual(3);
      const checked = element.queryAll(By.css('mat-radio-button.mat-radio-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('A');
    });
    it('with no value set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
      expect(element.queryAll(By.css('.radio-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-radio-button')).length).toEqual(3);
      expect(element.queryAll(By.css('mat-radio-button.mat-radio-checked')).length).toEqual(0);
    });
    it('with no value set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'B' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual(new Option('B', 'B'));
      expect(element.queryAll(By.css('.radio-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-radio-button')).length).toEqual(3);
      const checked = element.queryAll(By.css('mat-radio-button.mat-radio-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('B');
    });
  });
  describe('should create for a CheckboxInput', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}CheckboxInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode1: JSONLDObject = {
      '@id': '_:b1',
      [`${RDF}first`]: [{ '@value': 'A' }],
      [`${RDF}rest`]: [{ '@id': '_:b2' }],
    };
    const bnode2: JSONLDObject = {
      '@id': '_:b2',
      [`${RDF}first`]: [{ '@value': 'B' }],
      [`${RDF}rest`]: [{ '@id': '_:b3' }],
    };
    const bnode3: JSONLDObject = {
      '@id': '_:b3',
      [`${RDF}first`]: [{ '@value': 'C' }],
      [`${RDF}rest`]: [{ '@id': `${RDF}nil` }],
    };
    it('with a value already set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormArray([
          new UntypedFormControl(new Option('A', 'A'))
        ])
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormArray.value).toEqual([new Option('A', 'A')]);
      expect(component.checkboxes.length).toEqual(3);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(1);
      expect(element.queryAll(By.css('.checkbox-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(3);
      const checked = element.queryAll(By.css('mat-checkbox.mat-checkbox-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('A');
    });
    it('with a value already set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'B' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormArray([
            new UntypedFormControl(new Option('A', 'A'))
        ])
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormArray.value).toEqual([new Option('A', 'A')]);
      expect(component.checkboxes.length).toEqual(3);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(1);
      expect(element.queryAll(By.css('.checkbox-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(3);
      const checked = element.queryAll(By.css('mat-checkbox.mat-checkbox-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('A');
    });
    it('with no value set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormArray([])
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormArray.value).toEqual([]);
      expect(component.checkboxes.length).toEqual(3);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(0);
      expect(element.queryAll(By.css('.checkbox-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(3);
      expect(element.queryAll(By.css('mat-checkbox.mat-checkbox-checked')).length).toEqual(0);
    });
    it('with no value set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'B' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormArray([])
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormArray.value).toEqual([new Option('B', 'B')]);
      expect(component.checkboxes.length).toEqual(3);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(1);
      expect(element.queryAll(By.css('.checkbox-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(3);
      const checked = element.queryAll(By.css('mat-checkbox.mat-checkbox-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('B');
    });
    it('with validators', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}minCount`] = [{ '@value': '1' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormArray([])
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormArray.value).toEqual([]);
      expect(component.fieldFormArray.invalid).toBeTruthy();
      expect(component.checkboxes.length).toEqual(3);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(0);
      expect(element.queryAll(By.css('.checkbox-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(3);
      expect(element.queryAll(By.css('mat-checkbox.mat-checkbox-checked')).length).toEqual(0);
      // Click the first checkbox and rerender
      const checkbox = element.nativeElement.querySelector('mat-checkbox label');
      checkbox.click();
      fixture.detectChanges();
      expect(component.fieldFormArray.value).toEqual([new Option('A', 'A')]);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(1);
      const checked = element.queryAll(By.css('mat-checkbox.mat-checkbox-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('A');
      expect(component.fieldFormArray.invalid).toBeFalsy();
    });
    it('with a maxCount', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}maxCount`] = [{ '@value': '1' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape, bnode1, bnode2, bnode3]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormArray([])
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormArray.value).toEqual([]);
      expect(component.checkboxes.length).toEqual(3);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(0);
      expect(element.queryAll(By.css('.checkbox-field')).length).toEqual(1);
      expect(element.queryAll(By.css('mat-checkbox')).length).toEqual(3);
      expect(element.queryAll(By.css('mat-checkbox.mat-checkbox-checked')).length).toEqual(0);
      expect(element.queryAll(By.css('mat-checkbox.mat-checkbox-disabled')).length).toEqual(0);
      // Click the first checkbox and rerender
      const checkbox = element.nativeElement.querySelector('mat-checkbox label');
      checkbox.click();
      fixture.detectChanges();
      expect(component.fieldFormArray.value).toEqual([new Option('A', 'A')]);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(1);
      const checked = element.queryAll(By.css('mat-checkbox.mat-checkbox-checked'));
      expect(checked.length).toEqual(1);
      expect(checked[0].nativeElement.textContent.trim()).toEqual('A');
      expect(element.queryAll(By.css('mat-checkbox.mat-checkbox-disabled')).length).toEqual(2);
      // Uncheck the checkbox and rerender
      checkbox.click();
      fixture.detectChanges();
      expect(component.fieldFormArray.value).toEqual([]);
      expect(component.checkboxes.filter(checkbox => checkbox.checked).length).toEqual(0);
      expect(element.queryAll(By.css('mat-checkbox.mat-checkbox-checked')).length).toEqual(0);
      expect(element.queryAll(By.css('mat-checkbox.mat-checkbox-disabled')).length).toEqual(0);
    });
  });
  describe('should create for a NoInput', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}NoInput` }],
      [`${SHACL}path`]: [{ '@id': propertyName }]
    };
    it('with no value set', () => {
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
    });
    it('with no value set and a default', () => {
      const adjustedPropertyShape = Object.assign({}, propertyShape);
      adjustedPropertyShape[`${SHACL}defaultValue`] = [{ '@value': 'DEFAULT' }];
      component.formFieldConfig = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [adjustedPropertyShape]);
      component.parentFormGroup = new UntypedFormGroup({
        [propertyName]: new UntypedFormControl('')
      });
      fixture.detectChanges();
      expect(component).toBeTruthy();
      expect(component.fieldFormControl.value).toEqual('');
    });
  });
});
