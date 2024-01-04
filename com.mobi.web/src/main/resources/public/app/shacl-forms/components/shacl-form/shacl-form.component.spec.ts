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

  const nodeShape: JSONLDObject = { '@id': 'urn:NodeShape', '@type': [`${SHACL}NodeShape`] };
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
  const fullArr: JSONLDObject[] = [textPropertyShape, unlimitedTextPropertyShape, togglePropertyShape, radioPropertyShape, radioBnode1, radioBnode2, checkboxPropertyShape, checkboxBnode1, checkboxBnode2];
  const invalidFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, 'error', fullArr);
  const textFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, textPropertyShape['@id'], fullArr);
  const unlimitedTextFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, unlimitedTextPropertyShape['@id'], fullArr);
  const toggleFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, togglePropertyShape['@id'], fullArr);
  const radioFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, radioPropertyShape['@id'], fullArr);
  const checkboxFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, checkboxPropertyShape['@id'], fullArr);

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
    component.formFieldConfigs = [textFormFieldConfig, unlimitedTextFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, invalidFormFieldConfig];
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
    // Check invalid FormComponent
    const invalidComp = component.formComponents.find(comp => comp.config === invalidFormFieldConfig);
    expect(invalidComp).toBeTruthy();
    expect(checkboxComp.isMultivalued).toBeFalse();
    const invalidControl = component.form.get([invalidFormFieldConfig.property]);
    expect(invalidControl).toBeFalsy();
    // Check HTML
    const multivaluedEl = element.queryAll(By.css('.multivalued'));
    expect(multivaluedEl.length).toEqual(2);
    expect(multivaluedEl[0].queryAll(By.css('app-shacl-form-field')).length).toEqual(0);
    expect(multivaluedEl[0].queryAll(By.css('.delete-block-button')).length).toEqual(0);
    expect(multivaluedEl[0].queryAll(By.css('.add-block-button')).length).toEqual(1);
    expect(multivaluedEl[1].queryAll(By.css('app-shacl-form-field')).length).toEqual(0);
    expect(multivaluedEl[1].queryAll(By.css('.delete-block-button')).length).toEqual(0);
    expect(multivaluedEl[1].queryAll(By.css('.add-block-button')).length).toEqual(1);
    expect(element.queryAll(By.css('app-shacl-form-field.top-level-field')).length).toEqual(3);
    expect(element.queryAll(By.css('.error-msg')).length).toEqual(1);
  });
  it('should create with a filled form', () => {
    component.formFieldConfigs = [textFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, invalidFormFieldConfig];
    component.genObj = {
      '@id': 'urn:test',
      '@type': ['urn:Class'],
      [textFormFieldConfig.property]: [{ '@value': 'First' }],
      [toggleFormFieldConfig.property]: [{ '@value': 'true' }],
      [radioFormFieldConfig.property]: [{ '@value': 'A' }],
      [checkboxFormFieldConfig.property]: [{ '@value': 'Y' }],
    };
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
    // Check invalid FormComponent
    const invalidComp = component.formComponents.find(comp => comp.config === invalidFormFieldConfig);
    expect(invalidComp).toBeTruthy();
    expect(checkboxComp.isMultivalued).toBeFalse();
    const invalidControl = component.form.get([invalidFormFieldConfig.property]);
    expect(invalidControl).toBeFalsy();
    // Check HTML
    const multivaluedEl = element.queryAll(By.css('.multivalued'));
    expect(multivaluedEl.length).toEqual(1);
    expect(multivaluedEl[0].queryAll(By.css('app-shacl-form-field')).length).toEqual(1);
    expect(multivaluedEl[0].queryAll(By.css('.delete-block-button')).length).toEqual(1);
    expect(multivaluedEl[0].queryAll(By.css('.add-block-button')).length).toEqual(1);
    expect(element.queryAll(By.css('app-shacl-form-field.top-level-field')).length).toEqual(3);
    expect(element.queryAll(By.css('.error-msg')).length).toEqual(1);
  });
  it('should correctly add a value for a multivalued property', () => {
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
  it('should correctly remove a value for a multivalued property', () => {
    component.formFieldConfigs = [textFormFieldConfig];
    component.genObj = {
      '@id': 'urn:test',
      '@type': ['urn:Class'],
      [textFormFieldConfig.property]: [{ '@value': 'First' }, { '@value': 'Second' }],
    };
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
  it('should handle updates to the form values', () => {
    component.formFieldConfigs = [toggleFormFieldConfig];
    component.genObj = {
      '@id': 'urn:test',
      '@type': ['urn:Class'],
      [toggleFormFieldConfig.property]: [{ '@value': 'true' }],
    };
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
    component.genObj = {
      '@id': 'urn:test',
      '@type': ['urn:Class']
    };
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
