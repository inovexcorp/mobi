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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormArray, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MockComponent, MockProvider } from 'ng-mocks';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';

import { SHACLFormFieldComponent } from '../shacl-form-field/shacl-form-field.component';
import { JSONLDObject } from '../../../shared/models/JSONLDObject.interface';
import { RDF, SHACL_FORM, SH, XSD } from '../../../prefixes';
import { cleanStylesFromDOM } from '../../../../test/ts/Shared';
import { SHACLFormFieldConfig } from '../../models/shacl-form-field-config';
import { SHACLFormManagerService } from '../../services/shaclFormManager.service';
import { Option } from '../../models/option.class';
import { SHACLFormComponent } from './shacl-form.component';

describe('SHACLFormComponent', () => {
  let component: SHACLFormComponent;
  let element: DebugElement;
  let fixture: ComponentFixture<SHACLFormComponent>;
  let shaclFormManagerStub: jasmine.SpyObj<SHACLFormManagerService>;

  const textProp = 'urn:textProp';
  const toggleProp = 'urn:toggleProp';
  const radioProp = 'urn:radioProp';
  const checkboxProp = 'urn:checkboxProp';
  const dropdownProp = 'urn:dropdownProp';
  const autocompleteProp = 'urn:autocompleteProp';
  const hiddenTextInputProp = 'urn:hiddenTextInputProp';
  const noInputProp = 'urn:noInputProp';
  const complexProp = 'urn:complexProp';
  const complexSubProperty1 = 'urn:complexSubProperty1';
  const complexSubProperty2 = 'urn:complexSubProperty2';
  const complexMultivaluedProp = 'urn:complexMultivaluedProp';
  const multiSubProperty1 = 'urn:multiSubProperty1';
  const multiSubProperty2 = 'urn:multiSubProperty2';
  const autocompleteOption: Option = new Option('urn:recordA', 'Record A');
  const nodeShape: JSONLDObject = { '@id': 'urn:Class', '@type': [`${SH}NodeShape`] };
  const textPropertyShape: JSONLDObject = {
    '@id': 'urn:TextPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    [`${SH}path`]: [{ '@id': textProp }],
    [`${SH}minCount`]: [{ '@value': '1' }],
    [`${SH}maxCount`]: [{ '@value': '2' }]
  };
  const unlimitedTextPropertyShape: JSONLDObject = {
    '@id': 'urn:UnlimitedTextPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    [`${SH}path`]: [{ '@id': 'urn:unlimitedTextProp' }],
  };
  const togglePropertyShape: JSONLDObject = {
    '@id': 'urn:TogglePropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}ToggleInput` }],
    [`${SH}path`]: [{ '@id': toggleProp }],
    [`${SH}maxCount`]: [{ '@value': '1' }],
    [`${SH}datatype`]: [{ '@id': `${XSD}boolean` }]
  };
  const radioBnode2: JSONLDObject = {
    '@id': '_:rb2',
    [`${RDF}first`]: [{ '@value': 'B' }],
    [`${RDF}rest`]: [{ '@id': `${RDF}nil` }]
  };
  const radioBnode1: JSONLDObject = {
    '@id': '_:rb1',
    [`${RDF}first`]: [{ '@value': 'A' }],
    [`${RDF}rest`]: [{ '@id': radioBnode2['@id'] }]
  };
  const radioPropertyShape: JSONLDObject = {
    '@id': 'urn:RadioPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
    [`${SH}path`]: [{ '@id': radioProp }],
    [`${SH}maxCount`]: [{ '@value': '1' }],
    [`${SH}in`]: [{ '@id': radioBnode1['@id'] }]
  };
  const checkboxBnode2: JSONLDObject = {
    '@id': '_:cb2',
    [`${RDF}first`]: [{ '@value': 'Z' }],
    [`${RDF}rest`]: [{ '@id': `${RDF}nil` }]
  };
  const checkboxBnode1: JSONLDObject = {
    '@id': '_:cb1',
    [`${RDF}first`]: [{ '@value': 'Y' }],
    [`${RDF}rest`]: [{ '@id': checkboxBnode2['@id'] }]
  };
  const checkboxPropertyShape: JSONLDObject = {
    '@id': 'urn:CheckboxPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}CheckboxInput` }],
    [`${SH}path`]: [{ '@id': checkboxProp }],
    [`${SH}in`]: [{ '@id': checkboxBnode1['@id'] }]
  };
  const dropdownBnode2: JSONLDObject = {
    '@id': '_:db2',
    [`${RDF}first`]: [{ '@value': '10' }],
    [`${RDF}rest`]: [{ '@id': `${RDF}nil` }]
  };
  const dropdownBnode1: JSONLDObject = {
    '@id': '_:db1',
    [`${RDF}first`]: [{ '@value': '11' }],
    [`${RDF}rest`]: [{ '@id': dropdownBnode2['@id'] }]
  };
  const dropdownPropertyShape: JSONLDObject = {
    '@id': 'urn:DropdownPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}DropdownInput` }],
    [`${SH}path`]: [{ '@id': dropdownProp }],
    [`${SH}maxCount`]: [{ '@value': '1' }],
    [`${SH}datatype`]: [{ '@id': `${XSD}integer` }],
    [`${SH}in`]: [{ '@id': dropdownBnode1['@id'] }]
  };
  const autocompletePropertyShape: JSONLDObject = {
    '@id': 'urn:AutocompletePropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}AutocompleteInput` }],
    [`${SH}path`]: [{ '@id': autocompleteProp }],
    [`${SH}maxCount`]: [{ '@value': '1' }],
    [`${SH}class`]: [{ '@id': 'urn:SomeClass' }]
  };
  const hiddenTextInputPropertyShape: JSONLDObject = {
    '@id': 'urn:HiddenTextInputPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}HiddenTextInput` }],
    [`${SH}path`]: [{ '@id': hiddenTextInputProp }]
  };
  const noInputPropertyShape: JSONLDObject = {
    '@id': 'urn:NoInputPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}NoInput` }],
    [`${SH}path`]: [{ '@id': noInputProp }]
  };
  const complexSubPropertyShape1: JSONLDObject = {
    '@id': 'urn:ComplexSubPropertyShape1',
    '@type': [`${SH}PropertyShape`],
    [`${SH}path`]: [{ '@id': complexSubProperty1 }],
    [`${SH}name`]: [{ '@value': 'Complex Sub Label 1' }],
    [`${SH}maxCount`]: [{ '@value': '1' }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
  };
  const complexSubPropertyShape2: JSONLDObject = {
    '@id': 'urn:ComplexSubPropertyShape2',
    '@type': [`${SH}PropertyShape`],
    [`${SH}path`]: [{ '@id': complexSubProperty2 }],
    [`${SH}name`]: [{ '@value': 'Complex Sub Label 2' }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
  };
  const complexNodeShape: JSONLDObject = {
    '@id': 'urn:ComplexNode',
    '@type': [`${SH}NodeShape`],
    [`${SH}property`]: [
      { '@id': complexSubPropertyShape1['@id'] },
      { '@id': complexSubPropertyShape2['@id'] }
    ]
  };
  const complexPropertyShape: JSONLDObject = {
    '@id': 'urn:ComplexPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SH}path`]: [{ '@id': complexProp }],
    [`${SH}maxCount`]: [{ '@value': '1' }],
    [`${SH}node`]: [{ '@id': complexNodeShape['@id'] }]
  };
  const multiSubPropertyShape1: JSONLDObject = {
    '@id': 'urn:MultiSubPropertyShape1',
    '@type': [`${SH}PropertyShape`],
    [`${SH}path`]: [{ '@id': multiSubProperty1 }],
    [`${SH}name`]: [{ '@value': 'Multi Sub Label 1' }],
    [`${SH}class`]: [{ '@id': 'urn:SomeClass' }],
    [`${SH}sparql`]: [{ '@id': '_:someBnode' }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}AutocompleteInput` }],
  };
  const multiRadioBnode2: JSONLDObject = {
    '@id': '_:rmb2',
    [`${RDF}first`]: [{ '@value': 'Disagree' }],
    [`${RDF}rest`]: [{ '@id': `${RDF}nil` }]
  };
  const multiRadioBnode1: JSONLDObject = {
    '@id': '_:rmb1',
    [`${RDF}first`]: [{ '@value': 'Agree' }],
    [`${RDF}rest`]: [{ '@id': multiRadioBnode2['@id'] }]
  };
  const multiSubPropertyShape2: JSONLDObject = {
    '@id': 'urn:MultiSubPropertyShape2',
    '@type': [`${SH}PropertyShape`],
    [`${SH}path`]: [{ '@id': multiSubProperty2 }],
    [`${SH}name`]: [{ '@value': 'Multi Sub Label 2' }],
    [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
    [`${SH}maxCount`]: [{ '@value': '1' }],
    [`${SH}in`]: [{ '@id': multiRadioBnode1['@id'] }]
  };
  const multiNodeShape: JSONLDObject = {
    '@id': 'urn:MultiNode',
    '@type': [`${SH}NodeShape`],
    [`${SH}property`]: [
      { '@id': multiSubPropertyShape1['@id']},
      { '@id': multiSubPropertyShape2['@id'] },
    ]
  };
  const complexMultivaluedPropertyShape: JSONLDObject = {
    '@id': 'urn:ComplexMultivaluedPropertyShape',
    '@type': [ `${SH}PropertyShape` ],
    [`${SH}path`]: [{ '@id': complexMultivaluedProp }],
    [`${SH}node`]: [{ '@id': multiNodeShape['@id'] }]
  };
  const fullArr: JSONLDObject[] = [
    textPropertyShape, 
    unlimitedTextPropertyShape, 
    togglePropertyShape, 
    radioPropertyShape, 
    radioBnode1, 
    radioBnode2, 
    checkboxPropertyShape, 
    checkboxBnode1, 
    checkboxBnode2,
    dropdownPropertyShape,
    dropdownBnode1,
    dropdownBnode2,
    autocompletePropertyShape,
    hiddenTextInputPropertyShape,
    noInputPropertyShape,
    complexPropertyShape, 
    complexNodeShape, 
    complexSubPropertyShape1, 
    complexSubPropertyShape2, 
    complexMultivaluedPropertyShape, 
    multiNodeShape, 
    multiSubPropertyShape1, 
    multiSubPropertyShape2,
    multiRadioBnode1,
    multiRadioBnode2
  ];
  const invalidFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, 'error', fullArr);
  const textFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, textPropertyShape['@id'], fullArr);
  const unlimitedTextFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, unlimitedTextPropertyShape['@id'], fullArr);
  const toggleFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, togglePropertyShape['@id'], fullArr);
  const radioFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, radioPropertyShape['@id'], fullArr);
  const checkboxFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, checkboxPropertyShape['@id'], fullArr);
  const dropdownFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, dropdownPropertyShape['@id'], fullArr);
  const autocompleteFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, autocompletePropertyShape['@id'], fullArr);
  const hiddenTextInputFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, hiddenTextInputPropertyShape['@id'], fullArr);
  const noInputFormFieldConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, noInputPropertyShape['@id'], fullArr);
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
      ],
      providers: [
        MockProvider(SHACLFormManagerService)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SHACLFormComponent);
    element = fixture.debugElement;
    component = fixture.componentInstance;
    component.nodeShape = nodeShape;
    shaclFormManagerStub = TestBed.inject(SHACLFormManagerService) as jasmine.SpyObj<SHACLFormManagerService>;
    shaclFormManagerStub.getAutocompleteOptions.and.returnValue(of([autocompleteOption, new Option('urn:recordB', 'Record B')]));
  });

  afterEach(() => {
    cleanStylesFromDOM();
    component = null;
    element = null;
    fixture = null;
  });

  it('should create with a blank form', () => {
    component.formFieldConfigs = [textFormFieldConfig, unlimitedTextFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, dropdownFormFieldConfig, autocompleteFormFieldConfig, hiddenTextInputFormFieldConfig, noInputFormFieldConfig, invalidFormFieldConfig, complexFormFieldConfig, complexMultivaluedFormFieldConfig];
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.focusNode).toEqual([]);
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
    // Check Dropdown FormComponent
    const dropdownComp = component.formComponents.find(comp => comp.config === dropdownFormFieldConfig);
    expect(dropdownComp).toBeTruthy();
    expect(dropdownComp.isMultivalued).toBeFalse();
    const dropdownControl = component.form.get([dropdownFormFieldConfig.property]);
    expect(dropdownControl).toBeTruthy();
    expect(dropdownControl.value).toEqual('');
    // Check Autocomplete FormComponent
    const autocompleteComp = component.formComponents.find(comp => comp.config === autocompleteFormFieldConfig);
    expect(autocompleteComp).toBeTruthy();
    expect(autocompleteComp.isMultivalued).toBeFalse();
    const autocompleteControl = component.form.get([autocompleteFormFieldConfig.property]);
    expect(autocompleteControl).toBeTruthy();
    expect(autocompleteControl.value).toEqual('');
    // Check HiddenTextInput FormComponent
    const hiddenTextInputComp = component.formComponents.find(comp => comp.config === hiddenTextInputFormFieldConfig);
    expect(hiddenTextInputComp).toBeTruthy();
    expect(hiddenTextInputComp.isMultivalued).toBeFalse();
    const hiddenTextinputControl = component.form.get([hiddenTextInputFormFieldConfig.property]);
    expect(hiddenTextinputControl).toBeTruthy();
    expect(hiddenTextinputControl.value).toEqual('');
    // Check NoInput FormComponent
    const NoInputComp = component.formComponents.find(comp => comp.config === noInputFormFieldConfig);
    expect(NoInputComp).toBeTruthy();
    expect(NoInputComp.isMultivalued).toBeFalse();
    const noInputControl = component.form.get([noInputFormFieldConfig.property]);
    expect(noInputControl).toBeTruthy();
    expect(noInputControl.value).toEqual('');
    // Check Complex FormComponent
    const complexComp = component.formComponents.find(comp => comp.config === complexFormFieldConfig);
    expect(complexComp).toBeTruthy();
    expect(complexComp.isMultivalued).toBeFalse();
    const complexControl = component.form.get([complexFormFieldConfig.property]);
    expect(complexControl).toBeTruthy();
    expect(complexControl.value).toEqual({
      [complexFormFieldConfig.property + complexSubProperty1]: '',
      [complexFormFieldConfig.property + complexSubProperty2]: ''
    });
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
    expect(element.queryAll(By.css('app-shacl-form-field.top-level-field')).length).toEqual(9);
    expect(element.queryAll(By.css('.error-msg')).length).toEqual(1);
  });
  it('should create with a filled form', () => {
    component.formFieldConfigs = [textFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, dropdownFormFieldConfig, autocompleteFormFieldConfig, hiddenTextInputFormFieldConfig, noInputFormFieldConfig, invalidFormFieldConfig, complexFormFieldConfig, complexMultivaluedFormFieldConfig];
    component.genObj = [
      {
        '@id': 'urn:test',
        '@type': [nodeShape['@id']],
        [textFormFieldConfig.property]: [{ '@value': 'First' }],
        [toggleFormFieldConfig.property]: [{ '@value': 'true' }],
        [radioFormFieldConfig.property]: [{ '@value': 'A' }],
        [checkboxFormFieldConfig.property]: [{ '@value': 'Y' }],
        [dropdownFormFieldConfig.property]: [{ '@value': '10', '@type': `${XSD}integer` }],
        [autocompleteFormFieldConfig.property]: [{ '@id': 'urn:recordA' }],
        [hiddenTextInputFormFieldConfig.property]: [{ '@id': 'urn:hiddenTextInputProp' }],
        [noInputFormFieldConfig.property]: [{ '@id': 'urn:noInputProp' }],
        [complexFormFieldConfig.property]: [{ '@id': 'urn:genObj1' }],
        [complexMultivaluedFormFieldConfig.property]: [{ '@id': 'urn:genObj2' }],
      },
      {
        '@id': 'urn:genObj1',
        '@type': [complexNodeShape['@id']],
        [complexSubProperty1]: [{ '@value': 'Sub Y' }],
        [complexSubProperty2]: [{ '@value': 'Sub Z' }]
      },
      {
        '@id': 'urn:genObj2',
        '@type': [multiNodeShape['@id']],
        [multiSubProperty1]: [{ '@id': autocompleteOption.value }],
        [multiSubProperty2]: [{ '@value': 'Agree' }]
      }
    ];
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.focusNode).toEqual([component.genObj[0]]);
    expect(component.formComponents.length).toEqual(component.formFieldConfigs.length);
    // Check Text FormComponent
    const textComp = component.formComponents.find(comp => comp.config === textFormFieldConfig);
    expect(textComp).toBeTruthy();
    expect(textComp.isMultivalued).toBeTrue();
    expect(textComp.maxValues).toEqual(2);
    const textControl = component.form.get([textFormFieldConfig.property]);
    expect(textControl).toBeTruthy();
    expect(textControl.value).toEqual([{[`${textFormFieldConfig.property}0`]: 'First'}]);
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
    expect(radioControl.value).toEqual(new Option('A', 'A'));
    // Check Checkbox FormComponent
    const checkboxComp = component.formComponents.find(comp => comp.config === checkboxFormFieldConfig);
    expect(checkboxComp).toBeTruthy();
    expect(checkboxComp.isMultivalued).toBeFalse();
    const checkboxControl = component.form.get([checkboxFormFieldConfig.property]);
    expect(checkboxControl).toBeTruthy();
    expect(checkboxControl.value).toEqual([new Option('Y', 'Y')]);
    // Check Dropdown FormComponent
    const dropdownComp = component.formComponents.find(comp => comp.config === dropdownFormFieldConfig);
    expect(dropdownComp).toBeTruthy();
    expect(dropdownComp.isMultivalued).toBeFalse();
    const dropdownControl = component.form.get([dropdownFormFieldConfig.property]);
    expect(dropdownControl).toBeTruthy();
    expect(dropdownControl.value).toEqual(new Option('10', '10'));
    // Check Autocomplete FormComponent
    const autocompleteComp = component.formComponents.find(comp => comp.config === autocompleteFormFieldConfig);
    expect(autocompleteComp).toBeTruthy();
    expect(autocompleteComp.isMultivalued).toBeFalse();
    const autocompleteControl = component.form.get([autocompleteFormFieldConfig.property]);
    expect(autocompleteControl).toBeTruthy();
    expect(autocompleteControl.value).toEqual(autocompleteOption);
    expect(shaclFormManagerStub.getAutocompleteOptions).toHaveBeenCalledWith([autocompletePropertyShape], [component.genObj[0]]);
    // Check HiddenTextInput FormComponent
    const hiddenTextInputComp = component.formComponents.find(comp => comp.config === hiddenTextInputFormFieldConfig);
    expect(hiddenTextInputComp).toBeTruthy();
    expect(hiddenTextInputComp.isMultivalued).toBeFalse();
    const hiddenTextInputControl = component.form.get([hiddenTextInputFormFieldConfig.property]);
    expect(hiddenTextInputControl).toBeTruthy();
    expect(hiddenTextInputControl.value).toEqual(hiddenTextInputProp);
    // Check NoInput FormComponent
    const  noInputComp = component.formComponents.find(comp => comp.config === noInputFormFieldConfig);
    expect(noInputComp).toBeTruthy();
    expect(noInputComp.isMultivalued).toBeFalse();
    const noInputControl = component.form.get([noInputFormFieldConfig.property]);
    expect(noInputControl).toBeTruthy();
    expect(noInputControl.value).toEqual(noInputProp);
    // Check Complex FormComponent
    const complexComp = component.formComponents.find(comp => comp.config === complexFormFieldConfig);
    expect(complexComp).toBeTruthy();
    expect(complexComp.isMultivalued).toBeFalse();
    const complexControl = component.form.get([complexFormFieldConfig.property]);
    expect(complexControl).toBeTruthy();
    expect(complexControl.value).toEqual({
      [complexFormFieldConfig.property + complexSubProperty1]: 'Sub Y',
      [complexFormFieldConfig.property + complexSubProperty2]: 'Sub Z'
    });
    // Check Complex Multivalued FormComponent
    const complexMultivaluedComp = component.formComponents.find(comp => comp.config === complexMultivaluedFormFieldConfig);
    expect(complexMultivaluedComp).toBeTruthy();
    expect(complexMultivaluedComp.isMultivalued).toBeTrue();
    const complexMultivaluedControl = component.form.get([complexMultivaluedFormFieldConfig.property]);
    expect(complexMultivaluedControl).toBeTruthy();
    expect(complexMultivaluedControl.value).toEqual([
      { [`${complexMultivaluedFormFieldConfig.property}0`]: { 
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty1}`]: autocompleteOption, 
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty2}`]: new Option('Agree', 'Agree')
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
    expect(element.queryAll(By.css('app-shacl-form-field.top-level-field')).length).toEqual(9);
    expect(element.queryAll(By.css('.error-msg')).length).toEqual(1);
  });
  it('should set the focus node correctly', () => {
    component.formFieldConfigs = [textFormFieldConfig, toggleFormFieldConfig, radioFormFieldConfig, checkboxFormFieldConfig, dropdownFormFieldConfig, autocompleteFormFieldConfig, hiddenTextInputFormFieldConfig, noInputFormFieldConfig, invalidFormFieldConfig, complexFormFieldConfig, complexMultivaluedFormFieldConfig];
    component.genObj = [
      {
        '@id': 'urn:test',
        '@type': [nodeShape['@id']],
        [textFormFieldConfig.property]: [{ '@value': 'First' }],
        [toggleFormFieldConfig.property]: [{ '@value': 'true' }],
        [radioFormFieldConfig.property]: [{ '@value': 'A' }],
        [checkboxFormFieldConfig.property]: [{ '@value': 'Y' }],
        [dropdownFormFieldConfig.property]: [{ '@value': '10', '@type': `${XSD}integer` }],
        [autocompleteFormFieldConfig.property]: [{ '@id': 'urn:recordA' }],
        [hiddenTextInputFormFieldConfig.property]: [{ '@id': 'urn:hiddenTextInputProp' }],
        [noInputFormFieldConfig.property]: [{ '@id': 'urn:noInputProp' }],
        [complexFormFieldConfig.property]: [{ '@id': 'urn:genObj1' }],
        [complexMultivaluedFormFieldConfig.property]: [{ '@id': 'urn:genObj2' }],
      },
      {
        '@id': 'urn:genObj1',
        '@type': [complexNodeShape['@id']],
        [complexSubProperty1]: [{ '@value': 'Sub Y' }],
        [complexSubProperty2]: [{ '@value': 'Sub Z' }]
      },
      {
        '@id': 'urn:genObj2',
        '@type': [multiNodeShape['@id']],
        [multiSubProperty1]: [{ '@id': autocompleteOption.value }],
        [multiSubProperty2]: [{ '@value': 'Agree' }]
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
    expect(node[toggleFormFieldConfig.property]).toEqual([{ '@value': 'true', '@type': `${XSD}boolean` }]);
    expect(node[radioFormFieldConfig.property]).toEqual([{ '@value': 'A' }]);
    expect(node[checkboxFormFieldConfig.property]).toEqual([{ '@value': 'Y' }]);
    expect(node[dropdownFormFieldConfig.property]).toEqual([{ '@value': '10', '@type': `${XSD}integer` }]);
    expect(node[autocompleteFormFieldConfig.property]).toEqual([{ '@id': 'urn:recordA' }]);
    expect(node[hiddenTextInputFormFieldConfig.property]).toEqual([{ '@id': 'urn:hiddenTextInputProp' }]);
    expect(node[noInputFormFieldConfig.property]).toEqual([{ '@id': 'urn:noInputProp' }]);
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
      expect(textControl.value).toEqual([{[`${textFormFieldConfig.property}0`]: ''}]);
      expect(textControl.invalid).toBeFalsy();
      const newControl = (textControl as FormArray).controls[0].get([`${textFormFieldConfig.property}0`]);
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
      expect(complexControl.value).toEqual([{[`${complexMultivaluedFormFieldConfig.property}0`]: { 
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty1}`]: '', 
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty2}`]: ''
      }}]);
      expect(complexControl.invalid).toBeFalsy();
      const newControl = (complexControl as FormArray).controls[0].get([`${complexMultivaluedFormFieldConfig.property}0`]);
      expect(newControl).toBeTruthy();
      expect(newControl.value).toEqual({ 
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty1}`]: '', 
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty2}`]: ''
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
        { [`${textFormFieldConfig.property}0`]: 'First' },
        { [textFormFieldConfig.property + '1']: 'Second' },
      ]);
      const firstControl = (textControl as FormArray).controls[0].get([`${textFormFieldConfig.property}0`]);
      expect(firstControl).toBeTruthy();
      expect(firstControl.value).toEqual('First');
      expect(textControl.invalid).toBeFalsy();
      const secondControl = (textControl as FormArray).controls[1].get([`${textFormFieldConfig.property}1`]);
      expect(secondControl).toBeTruthy();
      expect(secondControl.value).toEqual('Second');
      expect(textControl.invalid).toBeFalsy();
      
      // Remove the first value in the array
      component.deleteFormBlock(0, component.formComponents[0]);
      expect((textControl as FormArray).controls.length).toEqual(1);
      expect(textControl.value).toEqual([{ [`${textFormFieldConfig.property}0`]: 'Second' }]);
      const remainingControl = (textControl as FormArray).controls[0].get([`${textFormFieldConfig.property}0`]);
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
      const agreeOption = new Option('Agree', 'Agree');
      const disagreeOption = new Option('Disagree', 'Disagree');
      component.formFieldConfigs = [complexMultivaluedFormFieldConfig];
      component.genObj = [
        {
          '@id': 'urn:test',
          '@type': [nodeShape['@id']],
          [complexMultivaluedFormFieldConfig.property]: [{ '@id': 'urn:First' }, { '@id': 'urn:Second' }],
        },
        {
          '@id': 'urn:First',
          '@type': [multiNodeShape['@id']],
          [multiSubProperty1]: [{ '@id': autocompleteOption.value }],
          [multiSubProperty2]: [{ '@value': agreeOption.value }]
        },
        {
          '@id': 'urn:Second',
          '@type': [multiNodeShape['@id']],
          [multiSubProperty1]: [{ '@id': autocompleteOption.value }],
          [multiSubProperty2]: [{ '@value': disagreeOption.value }]
        }
      ];
      fixture.detectChanges();
      // Validate starting point with two values
      expect(component.formComponents.length).toEqual(1);
      const complexControl = component.form.get([complexMultivaluedFormFieldConfig.property]);
      expect(complexControl).toBeTruthy();
      expect(complexControl.value).toEqual([
        { [complexMultivaluedFormFieldConfig.property + '0']: {
          [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty1}`]: autocompleteOption,
          [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty2}`]: agreeOption
        } },
        { [complexMultivaluedFormFieldConfig.property + '1']: {
          [`${complexMultivaluedFormFieldConfig.property}1${multiSubProperty1}`]: autocompleteOption,
          [`${complexMultivaluedFormFieldConfig.property}1${multiSubProperty2}`]: disagreeOption
        } },
      ]);
      const firstControl = (complexControl as FormArray).controls[0].get([complexMultivaluedFormFieldConfig.property + '0']);
      expect(firstControl).toBeTruthy();
      expect(firstControl.value).toEqual({
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty1}`]: autocompleteOption,
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty2}`]: agreeOption
      });
      const secondControl = (complexControl as FormArray).controls[1].get([complexMultivaluedFormFieldConfig.property + '1']);
      expect(secondControl).toBeTruthy();
      expect(secondControl.value).toEqual({
        [`${complexMultivaluedFormFieldConfig.property}1${multiSubProperty1}`]: autocompleteOption,
        [`${complexMultivaluedFormFieldConfig.property}1${multiSubProperty2}`]: disagreeOption
      });
      expect(complexControl.invalid).toBeFalsy();
      
      // Remove the first value in the array
      component.deleteFormBlock(0, component.formComponents[0]);
      expect((complexControl as FormArray).controls.length).toEqual(1);
      expect(complexControl.value).toEqual([{ [complexMultivaluedFormFieldConfig.property + '0']: {
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty1}`]: autocompleteOption,
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty2}`]: disagreeOption
      } }]);
      const remainingControl = (complexControl as FormArray).controls[0].get([complexMultivaluedFormFieldConfig.property + '0']);
      expect(remainingControl).toBeTruthy();
      expect(remainingControl.value).toEqual({
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty1}`]: autocompleteOption,
        [`${complexMultivaluedFormFieldConfig.property}0${multiSubProperty2}`]: disagreeOption
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
