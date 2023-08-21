/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { formatDate } from '@angular/common';

import { DCTERMS, XSD } from '../prefixes';
import { condenseCommitId, createHttpParams, createJson, getBeautifulIRI, getDate, getDctermsId, getDctermsValue, getErrorDataObject, getIRILocalName, getIRINamespace, getInputType, getObjIrisFromDifference, getPattern, getPropertyId, getPropertyValue, getSkolemizedIRI, handleError, handleErrorObject, hasPropertyId, hasPropertyValue, isBlankNode, isBlankNodeId, mergingArrays, paginatedConfigToHttpParams, removeDctermsValue, removePropertyId, removePropertyValue, replacePropertyId, replacePropertyValue, setDctermsValue, setPropertyId, setPropertyValue, updateDctermsValue } from './utility';
import { REGEX } from '../constants';

describe('Utility method', () => {
  const properties = [
    `${XSD}dateTime`,
    `${XSD}dateTimeStamp`,
    `${XSD}decimal`,
    `${XSD}double`,
    `${XSD}float`,
    `${XSD}int`,
    `${XSD}integer`,
    `${XSD}long`,
    `${XSD}short`,
    `${XSD}other`,
    `${XSD}byte`
  ];
  // General Utility Methods
  it('should merge arrays based on equality', () => {
    const targetArray = [{'@id': 'id'}, 'test', 10, false];
    const srcArray = [{'@id': 'id2'}, 10, {'@id': 'id'}, 100, false, 'test', 'test2', true];
    expect(mergingArrays(targetArray, srcArray)).toEqual([
      {'@id': 'id'},
      'test',
      10,
      false,
      {'@id': 'id2'},
      100,
      'test2',
      true
    ]);
  });
  describe('should get the specified date entity', () => {
    it('when provided', () => {
        const date = '1/1/2000';
        expect(getDate(date, 'short')).toBe(formatDate(new Date(date), 'short', 'en-US'));
    });
    it('unless it is not provided', () => {
        expect(getDate('', '')).toBe('(No Date Specified)');
    });
  });
  // JSON-LD Utility Methods
  it('should create a JSON-LD object with the provided id and property value', () => {
    expect(createJson('urn:id', 'urn:prop', {'@value': 'value', '@type': `${XSD}string`})).toEqual({
      '@id': 'urn:id',
      'urn:prop': [{ '@value': 'value', '@type': `${XSD}string` }]
    });
    expect(createJson('urn:id', 'urn:prop', {'@id': 'urn:other-id'})).toEqual({
      '@id': 'urn:id',
      'urn:prop': [{ '@id': 'urn:other-id' }]
    });
  });
  describe('getPropertyValue should get a property value from an entity', () => {
    it('if it contains the property', () => {
      const entity = {'@id': '', 'property': [{'@value': 'value'}]};
      expect(getPropertyValue(entity, 'property')).toBe('value');
    });
    it('if it does not contain the property', () => {
      expect(getPropertyValue({'@id': ''}, 'property')).toBe('');
    });
  });
  describe('should set a property value for an entity', () => {
    const value = 'value';
    it('when not there', () => {
      const entity = {'@id': ''};
      const expected = {'@id': '', 'property': [{'@value': value}]};
      setPropertyValue(entity, 'property', value);
      expect(entity).toEqual(expected);
    });
    it('when there', () => {
      const entity = {'@id': '', 'property': [{'@value': 'other'}]};
      const expected = {'@id': '', 'property': [{'@value': 'other'}, {'@value': value}]};
      setPropertyValue(entity, 'property', value);
      expect(entity).toEqual(expected);
    });
  });
  it('should test whether an entity has a property value', () => {
      const prop = 'property';
      const value = {'@value': 'value'};
      expect(hasPropertyValue({'@id': ''}, prop, value['@value'])).toEqual(false);
      expect(hasPropertyValue({'@id': '', 'property': [value]}, prop, value['@value'])).toEqual(true);
  });
  it('should remove a property value from an entity', () => {
      const prop = 'property';
      const value = {'@value': 'value'};
      const other = {'@value': 'other'};
      const entity = {'@id': '', 'property': [value, other]};
      removePropertyValue(entity, prop, value['@value']);
      expect(entity[prop]).not.toContain(value);
      removePropertyValue(entity, prop, other['@value']);
      expect(prop in entity).toEqual(false);
  });
  it('should replace a property value from an entity', () => {
      const prop = 'property';
      const value = {'@value': 'value'};
      const other = {'@value': 'other'};
      const entity = {'@id': '', 'property': [value]};
      replacePropertyValue(entity, prop, value['@value'], other['@value']);
      expect(entity[prop]).toContain(other);
      expect(entity[prop]).not.toContain(value);
  });
  describe('should get a property id value from an entity', () => {
    it('if it contains the property', () => {
      const entity = {'@id': '', 'property': [{'@id': 'id'}]};
      expect(getPropertyId(entity, 'property')).toBe('id');
    });
    it('if it does not contain the property', () => {
      expect(getPropertyId({'@id': ''}, 'property')).toBe('');
    });
  });
  describe('should set a property id value for an entity', () => {
    const id = 'id';
    it('when not there', () => {
      const entity = {'@id': ''};
      const expected = {'@id': '', 'property': [{'@id': id}]};
      setPropertyId(entity, 'property', id);
      expect(entity).toEqual(expected);
    });
    it('when there', () => {
      const entity = {'@id': '', 'property': [{'@id': 'otherId'}]};
      const expected = {'@id': '', 'property': [{'@id': 'otherId'}, {'@id': id}]};
      setPropertyId(entity, 'property', id);
      expect(entity).toEqual(expected);
    });
  });
  it('should test whether an entity has a property id value', () => {
    const prop = 'property';
    const value = {'@id': 'id'};
    expect(hasPropertyId({'@id': ''}, prop, value['@id'])).toEqual(false);
    expect(hasPropertyId({'@id': '', 'property': [value]}, prop, value['@id'])).toEqual(true);
  });
  it('should remove a property id value from an entity', () => {
    const prop = 'property';
    const value = {'@id': 'id'};
    const other = {'@id': 'other'};
    const entity = {'@id': '', 'property': [value, other]};
    removePropertyId(entity, prop, value['@id']);
    expect(entity[prop]).not.toContain(value);
    removePropertyId(entity, prop, other['@id']);
    expect(prop in entity).toEqual(false);
  });
  it('should replace a property id value from an entity', () => {
    const prop = 'property';
    const value = {'@id': 'id'};
    const other = {'@id': 'other'};
    const entity = {'@id': '', 'property': [value]};
    replacePropertyId(entity, prop, value['@id'], other['@id']);
    expect(entity[prop]).toContain(other);
    expect(entity[prop]).not.toContain(value);
  });
  describe('should get a dcterms property value from an entity', () => {
    it('if it contains the property', () => {
      const prop = 'prop';
      const entity = {'@id': '', [DCTERMS + prop]: [{'@value': 'value'}]};
      expect(getDctermsValue(entity, prop)).toBe('value');
    });
    it('if it does not contain the property', () => {
      expect(getDctermsValue({'@id': ''}, 'prop')).toBe('');
    });
  });
  it('should remove a dcterms property value from an entity', () => {
    const prop = 'prop';
    const value = {'@value': 'value'};
    const other = {'@value': 'other'};
    const entity = {'@id': '', [DCTERMS + prop]: [value, other]};
    removeDctermsValue(entity, prop, value['@value']);
    expect(entity[prop]).not.toContain(value);
    removeDctermsValue(entity, prop, other['@value']);
    expect(prop in entity).toEqual(false);
  });
  it('should set a dcterms property value for an entity', () => {
    const prop = 'prop';
    const value = 'value';
    const entity = {'@id': ''};
    const expected = {'@id': '', [DCTERMS + prop]: [{'@value': value}]};
    setDctermsValue(entity, prop, value);
    expect(entity).toEqual(expected);
  });
  it('should update a dcterms property value for an entity', () => {
    const prop = 'prop';
    const value = 'value';
    const newValue = 'newValue';
    const entity = {'@id': ''};
    const expected = {'@id': '', [DCTERMS + prop]: [{'@value': value}]};
    setDctermsValue(entity, prop, value);
    expect(entity).toEqual(expected);
    expected[DCTERMS + prop] = [{'@value': newValue}];
    updateDctermsValue(entity, prop, newValue);
    expect(entity).toEqual(expected);
  });
  describe('should get a dcterms property id value from an entity', () => {
    it('if it contains the property', () => {
      const prop = 'prop';
      const entity = {'@id': '', [DCTERMS + prop]: [{'@id': 'value'}]};
      expect(getDctermsId(entity, prop)).toBe('value');
    });
    it('if it does not contain the property', () => {
      expect(getDctermsId({'@id': ''}, 'prop')).toBe('');
    });
  });
  it('getSkolemizedIRI should create the correct type of string', () => {
    expect(getSkolemizedIRI()).toEqual(jasmine.stringContaining('http://mobi.com/.well-known/genid/'));
  });
  it('should determine whether a string is a blank node id', () => {
    expect(isBlankNodeId('_:genid')).toBe(true);
    expect(isBlankNodeId('_:b')).toBe(true);
    expect(isBlankNodeId('http://mobi.com/.well-known/genid/')).toBe(true);
    ['', 'notblanknode', undefined, null].forEach((test) => {
      expect(isBlankNodeId(test)).toBe(false);
    });
  });
  describe('should determine whether an entity is a blank node', () => {
    it('if the entity contains a blank node id', () => {
      expect(isBlankNode({ '@id': '_:genid0' })).toBe(true);
    });
    it('if the entity does not contain a blank node id', () => {
      expect(isBlankNode({'@id': 'test'})).toBe(false);
    });
  });
  describe('should get the beautified version of an IRI', () => {
    describe('if it has a local name', () => {
      it('that is a UUID', () => {
        const uuid = '01234567-9ABC-DEF0-1234-56789ABCDEF0';
        const iri = `http://test.com#${uuid}`;
        expect(getBeautifulIRI(iri)).toBe(uuid);
      });
      it('that is not a UUID', () => {
          const iri = 'http://test.com#end';
          expect(getBeautifulIRI(iri)).toBe('End');
      });
    });
    it('if it does not have a local name', () => {
      const iri = 'http://test.com#';
      expect(getBeautifulIRI(iri)).toBe(iri);
    });
  });
  it('should get the namespace of an iri', () => {
    expect(getIRINamespace('http://test.com#localName')).toBe('http://test.com#');
  });
  it('should get the localname of an iri', () => {
    expect(getIRILocalName('http://test.com#localName')).toBe('localName');
  });
  // HTTP Utility Methods
  describe('should create HttpParams from an object', () => {
    it('with string values', () => {
      const obj = {
        param1: 'a',
        param2: 'b'
      };
      const result = createHttpParams(obj);
      expect(result.get('param1')).toEqual('a');
      expect(result.get('param2')).toEqual('b');
    });
    it('with non string values', () => {
      const obj = {
        param1: 10,
        param2: false
      };
      const result = createHttpParams(obj);
      expect(result.get('param1')).toEqual('10');
      expect(result.get('param2')).toEqual('false');
    });
    it('with string array values', () => {
      const obj = {
        param1: ['a', 'b']
      };
      const result = createHttpParams(obj);
      expect(result.getAll('param1')).toEqual(['a', 'b']);
    });
    it('with non string array values', () => {
      const obj = {
        param1: [10, 15]
      };
      const result = createHttpParams(obj);
      expect(result.getAll('param1')).toEqual(['10', '15']);
    });
    it('with undefined, null, or empty string values', () => {
      const obj = {
        param1: undefined,
        param2: null,
        param3: ''
      };
      const result = createHttpParams(obj);
      expect(result.get('param1')).toBeNull();
      expect(result.get('param2')).toBeNull();
      expect(result.get('param3')).toBeNull();
    });
  });
  it('should turn a paginated configuration object into HTTP query parameters', function () {
    let params = paginatedConfigToHttpParams({sortOption: {field: 'test', asc: true, label: ''}, limit: 10, pageIndex: 1});
    expect(params.get('sort')).toEqual('test');
    expect(params.get('ascending')).toEqual('true');
    expect(params.get('limit')).toEqual('10');
    expect(params.get('offset')).toEqual('10');

    params = paginatedConfigToHttpParams({sortOption: {field: 'test', asc: false , label: ''}, limit: 10});
    expect(params.get('sort')).toEqual('test');
    expect(params.get('ascending')).toEqual('false');
    expect(params.get('limit')).toEqual('10');
    expect(params.get('offset')).toBeNull();

    params = paginatedConfigToHttpParams({sortOption: {field: '', asc: true, label: ''}, pageIndex: 0});
    expect(params.get('sort')).toBeNull();
    expect(params.get('ascending')).toEqual('true');
    expect(params.get('limit')).toBeNull();
    expect(params.get('offset')).toBeNull();

    params = paginatedConfigToHttpParams({});
    expect(params.get('sort')).toBeNull();
    expect(params.get('ascending')).toBeNull();
    expect(params.get('limit')).toBeNull();
    expect(params.get('offset')).toBeNull();
  });
  it('should retrieve an error object from a http response', () => {
    expect(getErrorDataObject(new HttpErrorResponse({error: {}}), 'default'))
      .toEqual({error: '', errorMessage: 'default', errorDetails: []});
    expect(getErrorDataObject(new HttpErrorResponse({})))
      .toEqual({error: '', errorMessage: 'Something went wrong. Please try again later.', errorDetails: []});
    expect(getErrorDataObject(new HttpErrorResponse({error: {errorMessage: ''}})))
      .toEqual({error: '', errorMessage: 'Something went wrong. Please try again later.', errorDetails: []});
    expect(getErrorDataObject(new HttpErrorResponse({error: {errorMessage: 'error'}})))
      .toEqual({error: '', errorMessage: 'error', errorDetails: []});
    expect(getErrorDataObject(new HttpErrorResponse({error: {error: 'error', errorMessage: 'errorMessage', errorDetails: ['Line 1', 'Line 2']}})))
      .toEqual({error: 'error', errorMessage: 'errorMessage', errorDetails: ['Line 1', 'Line 2']});
    expect(getErrorDataObject(new HttpErrorResponse({error: ''})))
      .toEqual({error: '', errorMessage: 'Something went wrong. Please try again later.', errorDetails: []});
    expect(getErrorDataObject(new HttpErrorResponse({error: '{"errorMessage": ""}'})))
      .toEqual({error: '', errorMessage: 'Something went wrong. Please try again later.', errorDetails: []});
    expect(getErrorDataObject(new HttpErrorResponse({error: '{"errorMessage": "error"}'})))
      .toEqual({error: '', errorMessage: 'error', errorDetails: []});
    expect(getErrorDataObject(new HttpErrorResponse({error: '{"error": "error", "errorMessage": "errorMessage", "errorDetails": ["Line 1", "Line 2"]}'})))
      .toEqual({error: 'error', errorMessage: 'errorMessage', errorDetails: ['Line 1', 'Line 2']});
  });
  describe('should create a failed observable with an error message', () => {
    it('unless the response was canceled', fakeAsync(() => {
      handleError(new HttpErrorResponse({status: 0}))
        .subscribe(() => {
          fail('Observable should have rejected.');
        }, error => {
          expect(error).toBe('');
        });
      tick();
    }));
    it('successfully with status text', fakeAsync(() => {
      const resp = new HttpErrorResponse({status: 400, statusText: 'Test'});
      handleError(resp)
        .subscribe(() => {
          fail('Observable should have rejected.');
        }, error => {
          expect(error).toBe('Test');
        });
      tick();
    }));
    it('successfully without status text', fakeAsync(() => {
      const resp = new HttpErrorResponse({status: 400});
      handleError(resp)
        .subscribe(() => {
          fail('Observable should have rejected.');
        }, error => {
          expect(error).toBe('Something went wrong. Please try again later.');
        });
      tick();
    }));
  });
  describe('should create a failed observable with an error object', () => {
    it('unless the response was canceled', fakeAsync(() => {
      handleErrorObject(new HttpErrorResponse({status: 0}))
        .subscribe(() => {
          fail('Observable should have rejected.');
        }, error => {
          expect(error).toEqual({error: '', errorMessage: '', errorDetails: []});
        });
      tick();
    }));
    it('successfully with status text', fakeAsync(() => {
      const resp = new HttpErrorResponse({status: 400, statusText: 'Test'});
      handleErrorObject(resp)
        .subscribe(() => {
          fail('Observable should have rejected.');
        }, error => {
          expect(error).toEqual({error: '', errorMessage: 'Test', errorDetails: []});
        });
      tick();
    }));
    it('successfully without status text', fakeAsync(() => {
      const resp = new HttpErrorResponse({status: 400});
      handleErrorObject(resp)
        .subscribe(() => {
          fail('Observable should have rejected.');
        }, error => {
          expect(error).toEqual({error: '', errorMessage: 'Something went wrong. Please try again later.', errorDetails: []});
        });
      tick();
    }));
  });
  // Mobi Specific Utility Methods
  it('should get correct object IRIs for the provided addition or deletion', () => {
    const additions = [{
        '@id': 'id',
        prop1: 'value1',
        prop2: [{'@id': 'iri1'}],
        prop3: [{'@id': 'iri2'}, {'@id': 'iri3'}],
        prop5: 'value5'
    }];
    const expected = ['iri1', 'iri2', 'iri3'];
    expect(getObjIrisFromDifference(additions)).toEqual(expected);
  });
  it('getInputType should return the proper input type based on datatype', () => {
    [0, 1].forEach(id => {
      expect(getInputType(properties[id])).toBe('datetime-local');
    });
    [2, 3, 4, 5, 6, 7, 8, 10].forEach(id => {
      expect(getInputType(properties[id])).toBe('number');
    });
    expect(getInputType(properties[9])).toBe('text');
  });
  it('getPattern should return the proper REGEX based on datatype', () => {
    [0, 1].forEach(id => {
      expect(getPattern(properties[id])).toBe(REGEX.DATETIME);
    });
    [2, 3, 4].forEach(id => {
      expect(getPattern(properties[id])).toBe(REGEX.DECIMAL);
    });
    [5, 6, 7, 8, 10].forEach(id => {
      expect(getPattern(properties[id])).toBe(REGEX.INTEGER);
    });
    expect(getPattern(properties[9])).toBe(REGEX.ANYTHING);
  });
  it('should condense a commit id', () => {
    const id = 'http://test.com#AAAAAAAAAAAAAAA';
    expect(condenseCommitId(id)).toEqual('AAAAAAAAAA');
  });
});
