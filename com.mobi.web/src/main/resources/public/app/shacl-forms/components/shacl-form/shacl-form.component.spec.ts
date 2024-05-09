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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockComponent } from 'ng-mocks';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { SHACLFormFieldComponent } from '../shacl-form-field/shacl-form-field.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RDF, SHACL_FORM, SHACL, XSD } from '../../../prefixes';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { SHACLFormComponent } from './shacl-form.component';

describe('SHACLFormComponent', () => {
  let component: SHACLFormComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<SHACLFormComponent>;

  const nodeShape: JSONLDObject = { '@id': 'urn:Class', '@type': [`${SHACL}NodeShape`] };
  const textPropertyShape: JSONLDObject = {
    '@id': 'urn:TextPropertyShape',
    '@type': [ `${SHACL}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    [`${SHACL}path`]: [{ '@id': 'urn:textProp' }],
    [`${SHACL}minCount`]: [{ '@value': '1' }],
    [`${SHACL}maxCount`]: [{ '@value': '2' }]
  };
  const unlimitedTextPropertyShape: JSONLDObject = {
    '@id': 'urn:UnlimitedTextPropertyShape',
    '@type': [ `${SHACL}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    [`${SHACL}path`]: [{ '@id': 'urn:unlimitedTextProp' }],
  };
  const togglePropertyShape: JSONLDObject = {
    '@id': 'urn:TogglePropertyShape',
    '@type': [ `${SHACL}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}ToggleInput` }],
    [`${SHACL}path`]: [{ '@id': 'urn:toggleProp' }],
    [`${SHACL}maxCount`]: [{ '@value': '1' }],
    [`${SHACL}datatype`]: [{ '@id': `${XSD}boolean` }]
  };
  const radioPropertyShape: JSONLDObject = {
    '@id': 'urn:RadioPropertyShape',
    '@type': [ `${SHACL}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
    [`${SHACL}path`]: [{ '@id': 'urn:radioProp' }],
    [`${SHACL}maxCount`]: [{ '@value': '1' }],
    [`${SHACL}in`]: [{ '@id': '_:rb1' }]
  };
  const radioBnode1: JSONLDObject = {
    '@id': '_:rb1',
    [`${RDF}first`]: [{ '@value': 'A' }],
    [`${RDF}rest`]: [{ '@value': '_:rb2' }]
  };
  const radioBnode2: JSONLDObject = {
    '@id': '_:rb2',
    [`${RDF}first`]: [{ '@value': 'B' }],
    [`${RDF}rest`]: [{ '@value': `${RDF}nil` }]
  };
  const checkboxPropertyShape: JSONLDObject = {
    '@id': 'urn:CheckboxPropertyShape',
    '@type': [ `${SHACL}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}CheckboxInput` }],
    [`${SHACL}path`]: [{ '@id': 'urn:checkboxProp' }],
    [`${SHACL}in`]: [{ '@id': '_:cb1' }]
  };
  const checkboxBnode1: JSONLDObject = {
    '@id': '_:cb1',
    [`${RDF}first`]: [{ '@value': 'Y' }],
    [`${RDF}rest`]: [{ '@value': '_:cb2' }]
  };
  const checkboxBnode2: JSONLDObject = {
    '@id': '_:cb2',
    [`${RDF}first`]: [{ '@value': 'Z' }],
    [`${RDF}rest`]: [{ '@value': `${RDF}nil` }]
  };
  const complexPropertyShape: JSONLDObject = {
    '@id': 'urn:ComplexPropertyShape',
    '@type': [ `${SHACL}PropertyShape` ],
    [`${SHACL}path`]: [{ '@id': 'urn:complexProp' }],
    [`${SHACL}maxCount`]: [{ '@value': '1' }],
    [`${SHACL}node`]: [{ '@id': 'urn:subNode1' }]
  };
  const subNodeShape1: JSONLDObject = {
    '@id': 'urn:subNode1',
    '@type': [`${SHACL}NodeShape`],
    [`${SHACL}property`]: [{ '@id': 'urn:subPropertyShape1' }]
  };
  const subPropertyShape1: JSONLDObject = {
    '@id': 'urn:subPropertyShape1',
    '@type': [`${SHACL}PropertyShape`],
    [`${SHACL}path`]: [{ '@id': 'urn:subProperty1' }],
    [`${SHACL}name`]: [{ '@value': 'Sub Label 1' }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
  };
  const complexMultivaluedPropertyShape: JSONLDObject = {
    '@id': 'urn:ComplexMultivaluedPropertyShape',
    '@type': [ `${SHACL}PropertyShape` ],
    [`${SHACL}path`]: [{ '@id': 'urn:complexMultivaluedProp' }],
    [`${SHACL}node`]: [{ '@id': 'urn:subNode2' }]
  };
  const subNodeShape2: JSONLDObject = {
    '@id': 'urn:subNode2',
    '@type': [`${SHACL}NodeShape`],
    [`${SHACL}property`]: [
      { '@id': 'urn:subPropertyShape2' },
      { '@id': 'urn:subPropertyShape3' },
    ]
  };
  const subPropertyShape2: JSONLDObject = {
    '@id': 'urn:subPropertyShape2',
    '@type': [`${SHACL}PropertyShape`],
    [`${SHACL}path`]: [{ '@id': 'urn:subProperty2' }],
    [`${SHACL}name`]: [{ '@value': 'Sub Label 2' }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
  };
  const subPropertyShape3: JSONLDObject = {
    '@id': 'urn:subPropertyShape3',
    '@type': [`${SHACL}PropertyShape`],
    [`${SHACL}path`]: [{ '@id': 'urn:subProperty3' }],
    [`${SHACL}name`]: [{ '@value': 'Sub Label 3' }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
  };
  const fullArr: JSONLDObject[] = [textPropertyShape, unlimitedTextPropertyShape, togglePropertyShape, radioPropertyShape, radioBnode1, radioBnode2, checkboxPropertyShape, checkboxBnode1, checkboxBnode2, complexPropertyShape, subNodeShape1, subPropertyShape1, complexMultivaluedPropertyShape, subNodeShape2, subPropertyShape2, subPropertyShape3];
  const invalidFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, 'error', fullArr);
  const textFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, textPropertyShape['@id'], fullArr);
  const unlimitedTextFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, unlimitedTextPropertyShape['@id'], fullArr);
  const toggleFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, togglePropertyShape['@id'], fullArr);
  const radioFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, radioPropertyShape['@id'], fullArr);
  const checkboxFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, checkboxPropertyShape['@id'], fullArr);
  const complexFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, complexPropertyShape['@id'], fullArr);
  const complexMultivaluedFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, complexMultivaluedPropertyShape['@id'], fullArr);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule
      ],
      declarations: [
        SHACLFormComponent,
        MockComponent(SHACLFormFieldComponent),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SHACLFormComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.nodeShape = nodeShape;
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  it('should create with a blank form', () => {
    component.formFieldConfigs = [textFormFieldConfig, unlimitedTextFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, invalidFormFieldConfig, complexFormFieldConfig, complexMultivaluedFormFieldConfig];
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.formComponents.length).toEqual(component.formFieldConfigs.length);
    // Check Text FormComponent
    const textComp = component.formComponents.find(comp => comp.config === textFormFieldConfig);
    expect(textComp).toBeTruthy();
    expect(textComp.isMultivalued).toBeTrue();
    expect(textComp.maxValues).toEqual(2);
    const textControl = component.form.get([textFormFieldConfig.property]);
    expect(textControl).toBeTruthy();
    expect(textControl.value).toEqual([]);
    expect(textControl.invalid).toBeTruthy();
    // Check Unlimited Text FormComponent
    const unlimitedTextComp = component.formComponents.find(comp => comp.config === unlimitedTextFormFieldConfig);
    expect(unlimitedTextComp).toBeTruthy();
    expect(unlimitedTextComp.isMultivalued).toBeTrue();
    expect(unlimitedTextComp.maxValues).toBeUndefined();
    const unlimitedTextControl = component.form.get([unlimitedTextFormFieldConfig.property]);
    expect(unlimitedTextControl).toBeTruthy();
    expect(unlimitedTextControl.value).toEqual([]);
    expect(unlimitedTextControl.invalid).toBeFalsy();
    // Check Toggle FormComponent
    const toggleComp = component.formComponents.find(comp => comp.config === toggleFormFieldConfig);
    expect(toggleComp).toBeTruthy();
    expect(toggleComp.isMultivalued).toBeFalse();
    const toggleControl = component.form.get([toggleFormFieldConfig.property]);
    expect(toggleControl).toBeTruthy();
    expect(toggleControl.value).toEqual('');
    // Check Radio FormComponent
    const radioComp = component.formComponents.find(comp => comp.config === radioFormFieldConfig);
    expect(radioComp).toBeTruthy();
    expect(radioComp.isMultivalued).toBeFalse();
    const radioControl = component.form.get([radioFormFieldConfig.property]);
    expect(radioControl).toBeTruthy();
    expect(radioControl.value).toEqual('');
    // Check Checkbox FormComponent
    const checkboxComp = component.formComponents.find(comp => comp.config === checkboxFormFieldConfig);
    expect(checkboxComp).toBeTruthy();
    expect(checkboxComp.isMultivalued).toBeFalse();
    const checkboxControl = component.form.get([checkboxFormFieldConfig.property]);
    expect(checkboxControl).toBeTruthy();
    expect(checkboxControl.value).toEqual([]);
    // Check Complex FormComponent
    const complexComp = component.formComponents.find(comp => comp.config === complexFormFieldConfig);
    expect(complexComp).toBeTruthy();
    expect(complexComp.isMultivalued).toBeFalse();
    const complexControl = component.form.get([complexFormFieldConfig.property]);
    expect(complexControl).toBeTruthy();
    expect(complexControl.value).toEqual({ 'urn:complexPropurn:subProperty1': '' });
    // Check Complex Multivalued FormComponent
    const complexMultivaluedComp = component.formComponents.find(comp => comp.config === complexMultivaluedFormFieldConfig);
    expect(complexMultivaluedComp).toBeTruthy();
    expect(complexMultivaluedComp.isMultivalued).toBeTrue();
    const complexMultivaluedControl = component.form.get([complexMultivaluedFormFieldConfig.property]);
    expect(complexMultivaluedControl).toBeTruthy();
    expect(complexMultivaluedControl.value).toEqual([]);
    // Check invalid FormComponent
    const invalidComp = component.formComponents.find(comp => comp.config === invalidFormFieldConfig);
    expect(invalidComp).toBeTruthy();
    expect(checkboxComp.isMultivalued).toBeFalse();
    const invalidControl = component.form.get([invalidFormFieldConfig.property]);
    expect(invalidControl).toBeFalsy();
    // Check HTML
    const multivaluedEl = element.queryAll(By.css('.multivalued'));
    expect(multivaluedEl.length).toEqual(3);
    expect(multivaluedEl[0].queryAll(By.css('app-shacl-form-field')).length).toEqual(0);
    expect(multivaluedEl[0].queryAll(By.css('.delete-block-button')).length).toEqual(0);
    expect(multivaluedEl[0].queryAll(By.css('.add-block-button')).length).toEqual(1);
    expect(multivaluedEl[1].queryAll(By.css('app-shacl-form-field')).length).toEqual(0);
    expect(multivaluedEl[1].queryAll(By.css('.delete-block-button')).length).toEqual(0);
    expect(multivaluedEl[1].queryAll(By.css('.add-block-button')).length).toEqual(1);
    expect(multivaluedEl[2].queryAll(By.css('app-shacl-form-field')).length).toEqual(0);
    expect(multivaluedEl[2].queryAll(By.css('.delete-block-button')).length).toEqual(0);
    expect(multivaluedEl[2].queryAll(By.css('.add-block-button')).length).toEqual(1);
    expect(element.queryAll(By.css('app-shacl-form-field.top-level-field')).length).toEqual(4);
    expect(element.queryAll(By.css('.error-msg')).length).toEqual(1);
  });
  it('should create with a filled form', () => {
    component.formFieldConfigs = [textFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, invalidFormFieldConfig, complexFormFieldConfig, complexMultivaluedFormFieldConfig];
    component.genObj = [
      {
        '@id': 'urn:test',
        '@type': ['urn:Class'],
        [textFormFieldConfig.property]: [{ '@value': 'First' }],
        [toggleFormFieldConfig.property]: [{ '@value': 'true' }],
        [radioFormFieldConfig.property]: [{ '@value': 'A' }],
        [checkboxFormFieldConfig.property]: [{ '@value': 'Y' }],
        [complexFormFieldConfig.property]: [{ '@id': 'urn:genObj1' }],
        [complexMultivaluedFormFieldConfig.property]: [{ '@id': 'urn:genObj2' }],
      },
      {
        '@id': 'urn:genObj1',
        '@type': [subNodeShape1['@id']],
        'urn:subProperty1': [{ '@value': 'Sub Z' }]
      },
      {
        '@id': 'urn:genObj2',
        '@type': [subNodeShape2['@id']],
        'urn:subProperty2': [{ '@value': 'Sub A' }],
        'urn:subProperty3': [{ '@value': 'Sub B' }]
      }
    ];
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.formComponents.length).toEqual(component.formFieldConfigs.length);
    // Check Text FormComponent
    const textComp = component.formComponents.find(comp => comp.config === textFormFieldConfig);
    expect(textComp).toBeTruthy();
    expect(textComp.isMultivalued).toBeTrue();
    expect(textComp.maxValues).toEqual(2);
    const textControl = component.form.get([textFormFieldConfig.property]);
    expect(textControl).toBeTruthy();
    expect(textControl.value).toEqual([{[textFormFieldConfig.property + '0']: 'First'}]);
    expect(textControl.invalid).toBeFalsy();
    // Check Toggle FormComponent
    const toggleComp = component.formComponents.find(comp => comp.config === toggleFormFieldConfig);
    expect(toggleComp).toBeTruthy();
    expect(toggleComp.isMultivalued).toBeFalse();
    const toggleControl = component.form.get([toggleFormFieldConfig.property]);
    expect(toggleControl).toBeTruthy();
    expect(toggleControl.value).toEqual('true');
    // Check Radio FormComponent
    const radioComp = component.formComponents.find(comp => comp.config === radioFormFieldConfig);
    expect(radioComp).toBeTruthy();
    expect(radioComp.isMultivalued).toBeFalse();
    const radioControl = component.form.get([radioFormFieldConfig.property]);
    expect(radioControl).toBeTruthy();
    expect(radioControl.value).toEqual('A');
    // Check Checkbox FormComponent
    const checkboxComp = component.formComponents.find(comp => comp.config === checkboxFormFieldConfig);
    expect(checkboxComp).toBeTruthy();
    expect(checkboxComp.isMultivalued).toBeFalse();
    const checkboxControl = component.form.get([checkboxFormFieldConfig.property]);
    expect(checkboxControl).toBeTruthy();
    expect(checkboxControl.value).toEqual(['Y']);
    // Check Complex FormComponent
    const complexComp = component.formComponents.find(comp => comp.config === complexFormFieldConfig);
    expect(complexComp).toBeTruthy();
    expect(complexComp.isMultivalued).toBeFalse();
    const complexControl = component.form.get([complexFormFieldConfig.property]);
    expect(complexControl).toBeTruthy();
    expect(complexControl.value).toEqual({ 'urn:complexPropurn:subProperty1': 'Sub Z' });
    // Check Complex Multivalued FormComponent
    const complexMultivaluedComp = component.formComponents.find(comp => comp.config === complexMultivaluedFormFieldConfig);
    expect(complexMultivaluedComp).toBeTruthy();
    expect(complexMultivaluedComp.isMultivalued).toBeTrue();
    const complexMultivaluedControl = component.form.get([complexMultivaluedFormFieldConfig.property]);
    expect(complexMultivaluedControl).toBeTruthy();
    expect(complexMultivaluedControl.value).toEqual([
      { [complexMultivaluedFormFieldConfig.property + '0']: { 
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty2']: 'Sub A', 
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty3']: 'Sub B'
      } }
    ]);
    // Check invalid FormComponent
    const invalidComp = component.formComponents.find(comp => comp.config === invalidFormFieldConfig);
    expect(invalidComp).toBeTruthy();
    expect(checkboxComp.isMultivalued).toBeFalse();
    const invalidControl = component.form.get([invalidFormFieldConfig.property]);
    expect(invalidControl).toBeFalsy();
    // Check HTML
    const multivaluedEl = element.queryAll(By.css('.multivalued'));
    expect(multivaluedEl.length).toEqual(2);
    expect(multivaluedEl[0].queryAll(By.css('app-shacl-form-field')).length).toEqual(1);
    expect(multivaluedEl[0].queryAll(By.css('.delete-block-button')).length).toEqual(1);
    expect(multivaluedEl[0].queryAll(By.css('.add-block-button')).length).toEqual(1);
    //// Complex Multivalued
    expect(multivaluedEl[1].queryAll(By.css('app-shacl-form-field')).length).toEqual(2);
    expect(multivaluedEl[1].queryAll(By.css('.delete-block-button')).length).toEqual(1);
    expect(multivaluedEl[1].queryAll(By.css('.add-block-button')).length).toEqual(1);
    expect(element.queryAll(By.css('app-shacl-form-field.top-level-field')).length).toEqual(4);
    expect(element.queryAll(By.css('.error-msg')).length).toEqual(1);
  });
  it('should set the focus node correctly', () => {
    component.formFieldConfigs = [textFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, invalidFormFieldConfig, complexFormFieldConfig, complexMultivaluedFormFieldConfig];
    component.genObj = [
      {
        '@id': 'urn:test',
        '@type': ['urn:Class'],
        [textFormFieldConfig.property]: [{ '@value': 'First' }],
        [toggleFormFieldConfig.property]: [{ '@value': 'true' }],
        [radioFormFieldConfig.property]: [{ '@value': 'A' }],
        [checkboxFormFieldConfig.property]: [{ '@value': 'Y' }],
        [complexFormFieldConfig.property]: [{ '@id': 'urn:genObj1' }],
        [complexMultivaluedFormFieldConfig.property]: [{ '@id': 'urn:genObj2' }],
      },
      {
        '@id': 'urn:genObj1',
        '@type': [subNodeShape1['@id']],
        'urn:subProperty1': [{ '@value': 'Sub Z' }]
      },
      {
        '@id': 'urn:genObj2',
        '@type': [subNodeShape2['@id']],
        'urn:subProperty2': [{ '@value': 'Sub A' }],
        'urn:subProperty3': [{ '@value': 'Sub B' }]
      }
    ];
    fixture.detectChanges();

    component.generateFocusNodeFromForm();
    expect(component.focusNode).toBeTruthy();
    expect(component.focusNode.length).toEqual(1);
    const node = component.focusNode[0];
    expect(node['@id']).toContain('https://mobi.solutions/ontologies/form#');
    expect(node['@type']).toEqual([nodeShape['@id']]);
    expect(node[textFormFieldConfig.property]).toEqual([{ '@value': 'First' }]);
    expect(node[toggleFormFieldConfig.property]).toEqual([{ '@value': 'true' }]);
    expect(node[radioFormFieldConfig.property]).toEqual([{ '@value': 'A' }]);
    expect(node[checkboxFormFieldConfig.property]).toEqual([{ '@value': 'Y' }]);
    expect(node[complexFormFieldConfig.property]).toEqual([{ '@id': jasmine.any(String) }]);
    expect(node[complexMultivaluedFormFieldConfig.property]).toEqual([{ '@id': jasmine.any(String) }]);
  });
  describe('should correctly add a value for a multivalued property', () => {
    it('if simple', () => {
      component.formFieldConfigs = [textFormFieldConfig];
      fixture.detectChanges();
      expect(component.formComponents.length).toEqual(1);
      const textControl = component.form.get([textFormFieldConfig.property]);
      expect(textControl).toBeTruthy();
      expect(textControl.value).toEqual([]);
      expect(textControl.invalid).toBeTruthy();
      
      component.addFormBlock(component.formComponents[0]);
      expect((textControl as FormArray).controls.length).toEqual(1);
      expect(textControl.value).toEqual([{[textFormFieldConfig.property + '0']: ''}]);
      expect(textControl.invalid).toBeFalsy();
      const newControl = (textControl as FormArray).controls[0].get([textFormFieldConfig.property + '0']);
      expect(newControl).toBeTruthy();
      expect(newControl.value).toEqual('');
    });
    it('if complex', () => {
      component.formFieldConfigs = [complexMultivaluedFormFieldConfig];
      fixture.detectChanges();
      expect(component.formComponents.length).toEqual(1);
      const complexControl = component.form.get([complexMultivaluedFormFieldConfig.property]);
      expect(complexControl).toBeTruthy();
      expect(complexControl.value).toEqual([]);
      expect(complexControl.invalid).toBeFalsy();
      
      component.addFormBlock(component.formComponents[0]);
      expect((complexControl as FormArray).controls.length).toEqual(1);
      expect(complexControl.value).toEqual([{[complexMultivaluedFormFieldConfig.property + '0']: { 
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty2']: '',
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty3']: ''
      }}]);
      expect(complexControl.invalid).toBeFalsy();
      const newControl = (complexControl as FormArray).controls[0].get([complexMultivaluedFormFieldConfig.property + '0']);
      expect(newControl).toBeTruthy();
      expect(newControl.value).toEqual({ 
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty2']: '',
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty3']: ''
      });
    });
  });
  describe('should correctly remove a value for a multivalued property', () => {
    it('if simple', () => {
      component.formFieldConfigs = [textFormFieldConfig];
      component.genObj = [{
        '@id': 'urn:test',
        '@type': ['urn:Class'],
        [textFormFieldConfig.property]: [{ '@value': 'First' }, { '@value': 'Second' }],
      }];
      fixture.detectChanges();
      // Validate starting point with two values
      expect(component.formComponents.length).toEqual(1);
      const textControl = component.form.get([textFormFieldConfig.property]);
      expect(textControl).toBeTruthy();
      expect(textControl.value).toEqual([
        { [textFormFieldConfig.property + '0']: 'First' },
        { [textFormFieldConfig.property + '1']: 'Second' },
      ]);
      const firstControl = (textControl as FormArray).controls[0].get([textFormFieldConfig.property + '0']);
      expect(firstControl).toBeTruthy();
      expect(firstControl.value).toEqual('First');
      expect(textControl.invalid).toBeFalsy();
      const secondControl = (textControl as FormArray).controls[1].get([textFormFieldConfig.property + '1']);
      expect(secondControl).toBeTruthy();
      expect(secondControl.value).toEqual('Second');
      expect(textControl.invalid).toBeFalsy();
      
      // Remove the first value in the array
      component.deleteFormBlock(0, component.formComponents[0]);
      expect((textControl as FormArray).controls.length).toEqual(1);
      expect(textControl.value).toEqual([{ [textFormFieldConfig.property + '0']: 'Second' }]);
      const remainingControl = (textControl as FormArray).controls[0].get([textFormFieldConfig.property + '0']);
      expect(remainingControl).toBeTruthy();
      expect(remainingControl.value).toEqual('Second');
      expect(textControl.invalid).toBeFalsy();
      // Remove the first value in the array (last value)
      component.deleteFormBlock(0, component.formComponents[0]);
      expect((textControl as FormArray).controls.length).toEqual(0);
      expect(textControl.value).toEqual([]);
      expect(textControl.invalid).toBeTruthy();
    });
    it('if complex', () => {
      component.formFieldConfigs = [complexMultivaluedFormFieldConfig];
      component.genObj = [
        {
          '@id': 'urn:test',
          '@type': ['urn:Class'],
          [complexMultivaluedFormFieldConfig.property]: [{ '@id': 'urn:First' }, { '@id': 'urn:Second' }],
        },
        {
          '@id': 'urn:First',
          '@type': [subNodeShape2['@id']],
          'urn:subProperty2': [{ '@value': 'First2' }],
          'urn:subProperty3': [{ '@value': 'First3' }]
        },
        {
          '@id': 'urn:Second',
          '@type': [subNodeShape2['@id']],
          'urn:subProperty2': [{ '@value': 'Second2' }],
          'urn:subProperty3': [{ '@value': 'Second3' }]
        }
      ];
      fixture.detectChanges();
      // Validate starting point with two values
      expect(component.formComponents.length).toEqual(1);
      const complexControl = component.form.get([complexMultivaluedFormFieldConfig.property]);
      expect(complexControl).toBeTruthy();
      expect(complexControl.value).toEqual([
        { [complexMultivaluedFormFieldConfig.property + '0']: {
          [complexMultivaluedFormFieldConfig.property + '0urn:subProperty2']: 'First2',
          [complexMultivaluedFormFieldConfig.property + '0urn:subProperty3']: 'First3'
        } },
        { [complexMultivaluedFormFieldConfig.property + '1']: {
          [complexMultivaluedFormFieldConfig.property + '1urn:subProperty2']: 'Second2',
          [complexMultivaluedFormFieldConfig.property + '1urn:subProperty3']: 'Second3'
        } },
      ]);
      const firstControl = (complexControl as FormArray).controls[0].get([complexMultivaluedFormFieldConfig.property + '0']);
      expect(firstControl).toBeTruthy();
      expect(firstControl.value).toEqual({
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty2']: 'First2',
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty3']: 'First3'
      });
      const secondControl = (complexControl as FormArray).controls[1].get([complexMultivaluedFormFieldConfig.property + '1']);
      expect(secondControl).toBeTruthy();
      expect(secondControl.value).toEqual({
        [complexMultivaluedFormFieldConfig.property + '1urn:subProperty2']: 'Second2',
        [complexMultivaluedFormFieldConfig.property + '1urn:subProperty3']: 'Second3'
      });
      expect(complexControl.invalid).toBeFalsy();
      
      // Remove the first value in the array
      component.deleteFormBlock(0, component.formComponents[0]);
      expect((complexControl as FormArray).controls.length).toEqual(1);
      expect(complexControl.value).toEqual([{ [complexMultivaluedFormFieldConfig.property + '0']: {
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty2']: 'Second2',
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty3']: 'Second3'
      } }]);
      const remainingControl = (complexControl as FormArray).controls[0].get([complexMultivaluedFormFieldConfig.property + '0']);
      expect(remainingControl).toBeTruthy();
      expect(remainingControl.value).toEqual({
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty2']: 'Second2',
        [complexMultivaluedFormFieldConfig.property + '0urn:subProperty3']: 'Second3'
      });
      expect(complexControl.invalid).toBeFalsy();
      // Remove the first value in the array (last value)
      component.deleteFormBlock(0, component.formComponents[0]);
      expect((complexControl as FormArray).controls.length).toEqual(0);
      expect(complexControl.value).toEqual([]);
      expect(complexControl.invalid).toBeFalsy();
    });
  });
  it('should handle updates to the form values', () => {
    component.formFieldConfigs = [toggleFormFieldConfig];
    component.genObj = [{
      '@id': 'urn:test',
      '@type': ['urn:Class'],
      [toggleFormFieldConfig.property]: [{ '@value': 'true' }],
    }];
    fixture.detectChanges();
    expect(component.formComponents.length).toEqual(1);
    const toggleControl = component.form.get([toggleFormFieldConfig.property]);
    expect(toggleControl).toBeTruthy();
    expect(toggleControl.value).toEqual('true');
    toggleControl.updateValueAndValidity();

    spyOn(component.updateEvent, 'emit');
    toggleControl.setValue('false');
    expect(component.updateEvent.emit).toHaveBeenCalledWith({[toggleFormFieldConfig.property]: 'false'});
  });
  it('should handle updates to the form status', () => {
    component.formFieldConfigs = [radioFormFieldConfig];
    component.genObj = [{
      '@id': 'urn:test',
      '@type': ['urn:Class']
    }];
    fixture.detectChanges();
    expect(component.formComponents.length).toEqual(1);
    const radioControl = component.form.get([radioFormFieldConfig.property]);
    expect(radioControl).toBeTruthy();
    expect(radioControl.value).toEqual('');
    radioControl.updateValueAndValidity();

    spyOn(component.statusEvent, 'emit');
    radioControl.setErrors({'test': true});
    expect(component.statusEvent.emit).toHaveBeenCalledWith('INVALID');
  });
});
