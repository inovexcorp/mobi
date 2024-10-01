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
import { FormControl, Validators } from '@angular/forms';

import { RDF, SHACL, SHACL_FORM, XSD } from '../../prefixes';
import { JSONLDObject } from '../../shared/models/JSONLDObject.interface';
import { FieldType, SHACLFormFieldConfig } from './shacl-form-field-config';
import { Option } from './option.class';

describe('SHACLFormFieldConfig', () => {
  const nodeShape: JSONLDObject = { '@id': 'urn:NodeShape', '@type': [`${SHACL}NodeShape`] };
  const propertyShapeId = 'urn:PropertyShapeA';
  const propertyId = 'urn:testProp';

  it('should throw an error if PropertyShape cannot be found', () => {
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, []);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeFalse();
    expect(result.errorMessage).toEqual('Could not find specified PropertyShape in provided JSON-LD');
  });
  it('should throw an error if the property path is not specified', () => {
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [
      {
        '@id': propertyShapeId,
        '@type': [`${SHACL}PropertyShape`]
      }
    ]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeFalse();
    expect(result.errorMessage).toEqual('Property path not configured');
  });
  it('should throw an error if the form field is not specified', () => {
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [
      {
        '@id': propertyShapeId,
        '@type': [`${SHACL}PropertyShape`],
        [`${SHACL}path`]: [{ '@id': propertyId }]
      }
    ]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeFalse();
    expect(result.errorMessage).toEqual('Form field type not configured');
  });
  it('should throw an error if the form field is not supported', () => {
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [
      {
        '@id': propertyShapeId,
        '@type': [`${SHACL}PropertyShape`],
        [`${SHACL}path`]: [{ '@id': propertyId }],
        [`${SHACL_FORM}usesFormField`]: [{ '@id': 'error' }]
      }
    ]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeFalse();
    expect(result.errorMessage).toEqual('Form field type not supported');
  });
  [
    { field: `${SHACL_FORM}TextInput`, type: FieldType.TEXT },
    { field: `${SHACL_FORM}ToggleInput`, type: FieldType.TOGGLE}, 
    { field: `${SHACL_FORM}RadioInput`, type: FieldType.RADIO}, 
    { field: `${SHACL_FORM}CheckboxInput`, type: FieldType.CHECKBOX},
    { field: `${SHACL_FORM}TextareaInput`, type: FieldType.TEXTAREA},
    { field: `${SHACL_FORM}AutocompleteInput`, type: FieldType.AUTOCOMPLETE},
    { field: `${SHACL_FORM}HiddenTextInput`, type: FieldType.HIDDEN_TEXT},
    { field: `${SHACL_FORM}NoInput`, type: FieldType.NO_INPUT}
  ].forEach(test => {
    it(`should create a basic ${test.field} with the precalculated fields set`, () => {
      const propertyShape: JSONLDObject = {
        '@id': propertyShapeId,
        '@type': [`${SHACL}PropertyShape`],
        [`${SHACL}path`]: [{ '@id': propertyId }],
        [`${SHACL_FORM}usesFormField`]: [{ '@id': test.field }],
        [`${SHACL}name`]: [{ '@value': 'Label' }]
      };
      const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
      expect(result).toBeTruthy();
      expect(result.isValid).toBeTrue();
      expect(result.errorMessage).toEqual('');
      expect(result.nodeShape).toEqual(nodeShape);
      expect(result.propertyShape).toEqual(propertyShape);
      expect(result.property).toEqual(propertyId);
      expect(result.label).toEqual('Label');
      expect(result.fieldType).toEqual(test.type);
      expect(result.values).toEqual([]);
    });
  });
  it('should create a complex field when sh:node is detected', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL}name`]: [{ '@value': 'Label' }],
      [`${SHACL}node`]: [{ '@id': 'urn:subObject' }]
    };
    const subObject: JSONLDObject = {
      '@id': 'urn:subObject',
      '@type': [`${SHACL}NodeShape`],
      [`${SHACL}property`]: [{ '@id': 'urn:subPropertyShape' }]
    };
    const subPropertyShape: JSONLDObject = {
      '@id': 'urn:subPropertyShape',
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': 'urn:subProperty' }],
      [`${SHACL}name`]: [{ '@value': 'Sub Label' }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    };
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, subObject, subPropertyShape]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeTrue();
    expect(result.errorMessage).toEqual('');
    expect(result.nodeShape).toEqual(nodeShape);
    expect(result.propertyShape).toEqual(propertyShape);
    expect(result.property).toEqual(propertyId);
    expect(result.label).toEqual('Label');
    expect(result.fieldType).toBeUndefined();
    expect(result.subFields.length).toEqual(1);
    expect(result.subFields[0].isValid).toBeTrue();
    expect(result.subFields[0].errorMessage).toEqual('');
    expect(result.subFields[0].nodeShape).toEqual(subObject);
    expect(result.subFields[0].propertyShape).toEqual(subPropertyShape);
    expect(result.subFields[0].property).toEqual('urn:subProperty');
    expect(result.subFields[0].label).toEqual('Sub Label');
    expect(result.subFields[0].fieldType).toEqual(FieldType.TEXT);
    expect(result.values).toBeUndefined();
  });
  it('should handle when the first blank node cannot be found for a sh:in list', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeTrue();
    expect(result.errorMessage).toEqual('');
    expect(result.values).toEqual([]);
  });
  it('should handle when a blank node in a sh:in list does not have rdf:first', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, { '@id': '_:b1' }]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeTrue();
    expect(result.errorMessage).toEqual('');
    expect(result.values).toEqual([]);
  });
  it('should handle when a blank node in a sh:in list does not have rdf:rest', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode: JSONLDObject = { '@id': '_:b1', [`${RDF}first`]: [{ '@value': 'A' }] };
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeTrue();
    expect(result.errorMessage).toEqual('');
    expect(result.values).toEqual([new Option('A', 'A')]);
  });
  it('should handle when a blank node in a sh:in list has a rdf:rest of rdf:nil', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode: JSONLDObject = { '@id': '_:b1', [`${RDF}first`]: [{ '@value': 'A' }], [`${RDF}rest`]: [{ '@id': `${RDF}nil`}] };
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeTrue();
    expect(result.errorMessage).toEqual('');
    expect(result.values).toEqual([new Option('A', 'A')]);
  });
  it('should handle when a blank node in a sh:in list cannot be found', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode: JSONLDObject = { '@id': '_:b1', [`${RDF}first`]: [{ '@value': 'A' }], [`${RDF}rest`]: [{ '@id': '_:b2'}] };
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeTrue();
    expect(result.errorMessage).toEqual('');
    expect(result.values).toEqual([new Option('A', 'A')]);
  });
  it('should handle a lengthy sh:in list', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }],
      [`${SHACL}in`]: [{ '@id': '_:b1' }]
    };
    const bnode1: JSONLDObject = { '@id': '_:b1', [`${RDF}first`]: [{ '@value': 'A' }], [`${RDF}rest`]: [{ '@id': '_:b2'}] };
    const bnode2: JSONLDObject = { '@id': '_:b2', [`${RDF}first`]: [{ '@value': 'Y' }], [`${RDF}rest`]: [{ '@id': '_:b3'}] };
    const bnode3: JSONLDObject = { '@id': '_:b3', [`${RDF}first`]: [{ '@value': 'B' }], [`${RDF}rest`]: [{ '@id': '_:b4'}] };
    const bnode4: JSONLDObject = { '@id': '_:b4', [`${RDF}first`]: [{ '@value': 'Z' }], [`${RDF}rest`]: [{ '@id': `${RDF}nil`}] };
    const result = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape, bnode1, bnode4, bnode3, bnode2]);
    expect(result).toBeTruthy();
    expect(result.isValid).toBeTrue();
    expect(result.errorMessage).toEqual('');
    expect(result.values).toEqual([new Option('A', 'A'), new Option('Y', 'Y'), new Option('B', 'B'), new Option('Z', 'Z')]);
  });
  it('should correctly fetch the sh:minCount value', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}RadioInput` }]
    };
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).minCount).toBeUndefined();
    propertyShape[`${SHACL}minCount`] = [{ '@id': 'error' }];
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).minCount).toBeUndefined();
    delete propertyShape[`${SHACL}minCount`][0]['@id'];
    propertyShape[`${SHACL}minCount`][0]['@value'] = 'error';
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).minCount).toBeUndefined();
    propertyShape[`${SHACL}minCount`][0]['@value'] = '0';
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).minCount).toEqual(0);
  });
  it('should correctly fetch the sh:maxCount value', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}CheckboxInput` }]
    };
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).maxCount).toBeUndefined();
    propertyShape[`${SHACL}maxCount`] = [{ '@id': 'error' }];
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).maxCount).toBeUndefined();
    delete propertyShape[`${SHACL}maxCount`][0]['@id'];
    propertyShape[`${SHACL}maxCount`][0]['@value'] = 'error';
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).maxCount).toBeUndefined();
    propertyShape[`${SHACL}maxCount`][0]['@value'] = '0';
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).maxCount).toEqual(0);
  });
  it('should correctly fetch the sh:pattern value', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }]
    };
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).regex).toBeUndefined();
    propertyShape[`${SHACL}pattern`] = [{ '@id': 'error' }];
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).regex).toBeUndefined();
    delete propertyShape[`${SHACL}pattern`][0]['@id'];
    propertyShape[`${SHACL}pattern`][0]['@value'] = ')W*#^#W)^&)#';
    expect(() => new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).regex).toThrow();
    propertyShape[`${SHACL}pattern`][0]['@value'] = 'word';
    expect(regexEqual(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).regex, /word/)).toBeTrue();
    propertyShape[`${SHACL}flags`] = [{ '@value': 'i' }];
    expect(regexEqual(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).regex, /word/i)).toBeTrue();
  });
  it('should correctly fetch the sh:datatype value', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }]
    };
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).datatype).toBeUndefined();
    propertyShape[`${SHACL}datatype`] = [{ '@value': 'error' }];
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).datatype).toBeUndefined();
    delete propertyShape[`${SHACL}datatype`][0]['@value'];
    propertyShape[`${SHACL}datatype`][0]['@id'] = 'error';
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).datatype).toEqual('error');
    propertyShape[`${SHACL}datatype`][0]['@id'] = `${XSD}string`;
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).datatype).toEqual(`${XSD}string`);
  });
  it('should correctly fetch the sh:defaultValue value', () => {
    const propertyShape: JSONLDObject = {
      '@id': propertyShapeId,
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': propertyId }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }]
    };
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).defaultValue).toBeUndefined();
    propertyShape[`${SHACL}defaultValue`] = [{ '@id': 'urn:test' }];
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).defaultValue).toEqual('urn:test');
    delete propertyShape[`${SHACL}defaultValue`][0]['@id'];
    propertyShape[`${SHACL}defaultValue`][0]['@value'] = 'Test';
    expect(new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).defaultValue).toEqual('Test');
  });
  describe('should correctly calculate validators', () => {
    it('if a regex is set', () => {
      const propertyShape: JSONLDObject = {
        '@id': propertyShapeId,
        '@type': [`${SHACL}PropertyShape`],
        [`${SHACL}path`]: [{ '@id': propertyId }],
        [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
        [`${SHACL}pattern`]: [{ '@value': 'word' }],
        [`${SHACL}flags`]: [{ '@value': 'i' }]
      };
      const validators = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).validators;
      expect(validators.length).toEqual(1);
      expect(validators[0](new FormControl('A'))).toEqual({pattern: {requiredPattern: '/word/i', actualValue: 'A'}});
      expect(validators[0](new FormControl('word'))).toBeNull();
    });
    it('if a datatype is set and xsd:integer', () => {
      const propertyShape: JSONLDObject = {
        '@id': propertyShapeId,
        '@type': [`${SHACL}PropertyShape`],
        [`${SHACL}path`]: [{ '@id': propertyId }],
        [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
        [`${SHACL}datatype`]: [{ '@id': `${XSD}int` }]
      };
      const validators = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).validators;
      expect(validators.length).toEqual(1);
      expect(validators[0](new FormControl('A'))).toEqual({pattern: {requiredPattern: '^[0-9]+$', actualValue: 'A'}});
      expect(validators[0](new FormControl('10'))).toBeNull();
    });
    it('if a minCount is set', () => {
      const propertyShape: JSONLDObject = {
        '@id': propertyShapeId,
        '@type': [`${SHACL}PropertyShape`],
        [`${SHACL}path`]: [{ '@id': propertyId }],
        [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
        [`${SHACL}minCount`]: [{ '@value': '1' }]
      };
      const validators = new SHACLFormFieldConfig(nodeShape, propertyShapeId, [propertyShape]).validators;
      expect(validators.length).toEqual(1);
      const control = new FormControl();
      control.setValidators(validators);
      expect(control.hasValidator(Validators.required)).toBeTrue();
    });
  });
});

function regexEqual(x, y) {
  return (x instanceof RegExp) && (y instanceof RegExp) && 
         (x.source === y.source) && (x.global === y.global) && 
         (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
}
