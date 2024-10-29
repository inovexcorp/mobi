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
import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { formatDate } from '@angular/common';

import moment from 'moment/moment';
import { cloneDeep } from 'lodash';

import { DC, DCTERMS, RDFS, SHACL, SHACL_FORM, SKOS, SKOSXL, XSD } from '../prefixes';
import { REGEX } from '../constants';
import { JSONLDObject } from './models/JSONLDObject.interface';
import { SHACLFormFieldConfig } from '../shacl-forms/models/shacl-form-field-config';
import { FormValues } from '../shacl-forms/models/form-values.interface';
import {
  condenseCommitId,
  createHttpParams,
  createJson,
  getBeautifulIRI,
  getDate,
  getDctermsId,
  getDctermsValue,
  getErrorDataObject,
  getIRILocalName,
  getIRINamespace,
  getInputType,
  getObjIrisFromDifference,
  getPattern,
  getPropertyId,
  getPropertyIds,
  getPropertyValue,
  getSkolemizedIRI,
  handleError,
  handleErrorObject,
  hasPropertyId,
  hasPropertyValue,
  isBlankNode,
  isBlankNodeId,
  mergingArrays,
  paginatedConfigToHttpParams,
  removeDctermsValue,
  removePropertyId,
  removePropertyValue,
  replacePropertyId,
  replacePropertyValue,
  setDctermsValue,
  setPropertyId,
  setPropertyValue,
  updateDctermsValue,
  runningTime,
  toFormattedDateString,
  orNone,
  getStatus,
  getEntityName,
  addLanguageToAnnotations,
  getShaclGeneratedData,
  getSubstringMatch
} from './utility';

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
    it('with a datatype', () => {
      const entity = {'@id': '', 'property': [{'@value': 'other'}]};
      const expected = {'@id': '', 'property': [{'@value': 'other'}, {'@value': value, '@type': `${XSD}boolean`}]};
      setPropertyValue(entity, 'property', value, `${XSD}boolean`);
      expect(entity).toEqual(expected);
    });
    it('with a string datatype', () => {
      const entity = {'@id': '', 'property': [{'@value': 'other'}]};
      const expected = {'@id': '', 'property': [{'@value': 'other'}, {'@value': value}]};
      setPropertyValue(entity, 'property', value, `${XSD}string`);
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
  describe('should get a property ids from an entity', () => {
    it('should return a set of property IDs', () => {
      const entity: JSONLDObject = {
        '@id': 'http://example.com/entity',
        'http://example.com/property': [
          { '@id': 'http://example.com/value1' },
          { '@id': 'http://example.com/value2' },
          { '@id': 'http://example.com/value3' }
        ]
      };
      const propertyIRI = 'http://example.com/property';
        const result = getPropertyIds(entity, propertyIRI);
  
      expect(result).toBeDefined();
      expect(result.size).toBe(3);
      expect(result.has('http://example.com/value1')).toBeTrue();
      expect(result.has('http://example.com/value2')).toBeTrue();
      expect(result.has('http://example.com/value3')).toBeTrue();
    });
    it('should handle empty property values', () => {
      const entity: JSONLDObject = {
        '@id': 'http://example.com/entity',
        'http://example.com/property': []
      };
      const propertyIRI = 'http://example.com/property';
      const result = getPropertyIds(entity, propertyIRI);
  
      expect(result).toBeDefined();
      expect(result.size).toBe(0);
    });
    it('should handle missing property in the entity', () => {
      const entity: JSONLDObject = {
        '@id': 'http://example.com/entity'
      };
      const propertyIRI = 'http://example.com/property';
      const result = getPropertyIds(entity, propertyIRI);
  
      expect(result).toBeDefined();
      expect(result.size).toBe(0);
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
  describe('addLanguageToAnnotations should set the proper values', function() {
    it('when language is undefined', function() {
      const entity = {'@id': ''};
      addLanguageToAnnotations(entity, undefined);
      expect(entity).toEqual({'@id': ''});
    });
    describe('when language is provided', function() {
      const language = 'en';
      it('and it has a dcterms:title', function() {
        const entity = {'@id': '', [`${DCTERMS}title`]: [{'@value': 'value'}]};
        const expected = {'@id': '', [`${DCTERMS}title`]: [{'@value': 'value', '@language': language}]};
        addLanguageToAnnotations(entity, language);
        expect(entity).toEqual(expected);
      });
      it('and it has a dcterms:description', function() {
        const entity = {'@id': '', [`${DCTERMS}description`]: [{'@value': 'value'}]};
        const expected = {'@id': '', [`${DCTERMS}description`]: [{'@value': 'value', '@language': language}]};
        addLanguageToAnnotations(entity, language);
        expect(entity).toEqual(expected);
      });
      it('and it has both dcterms:title and dcterms:description', function() {
        const entity = {
          '@id': '', 
          [`${DCTERMS}description`]: [{'@value': 'description'}],
          [`${DCTERMS}title`]: [{'@value': 'title'}]
        };
        const expected = {
          '@id': '', 
          [`${DCTERMS}description`]: [{'@value': 'description', '@language': language}],
          [`${DCTERMS}title`]: [{'@value': 'title', '@language': language}]
        };
        addLanguageToAnnotations(entity, language);
        expect(entity).toEqual(expected);
      });
      it('and it has a skos:prefLabel', function() {
        const entity = {'@id': '', [`${SKOS}prefLabel`]: [{'@value': 'value'}]};
        const expected = {'@id': '', [`${SKOS}prefLabel`]: [{'@value': 'value', '@language': language}]};
        addLanguageToAnnotations(entity, language);
        expect(entity).toEqual(expected);
      });
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
  describe('runningTime function', () => {
    it('returns "(none)" for missing start time', () => {
      const endTime = new Date();
      expect(runningTime(null, endTime)).toBe('(none)');
    });

    it('returns "(none)" for missing end time', () => {
      const startTime = new Date();
      expect(runningTime(startTime, null)).toBe('(none)');
    });

    it('returns correct running time for less than 60 seconds', () => {
      const startTime = new Date();
      const endTime = moment(startTime).add(30, 'seconds').toDate();
      expect(runningTime(startTime, endTime)).toBe('30 sec');
    });
    it('returns correct running time for less than 20 seconds with decimals', () => {
      const t1 = '2024-03-06T11:36:51.356097-06:00';
      const t2 = '2024-03-06T11:37:01.410147-06:00';
      const time1 = new Date(t1);
      const time2 = new Date(t2);
      const startTime = moment(t1);
      const endTime = moment(t2);
      const running  = moment.duration(endTime.diff(startTime)).asSeconds();
      expect(runningTime(time1, time2)).toBe(`${running} sec`);
    });
  });
  describe('toFormattedDateString function', () => {
    it('returns "(none)" for missing start time', () => {
      expect(toFormattedDateString(null)).toBe('(none)');
    });
    it('dates are in the specified format.', () => {
      const date = new Date();
      expect(toFormattedDateString(date)).toBe(moment(date).format('h:mm:ssA M/D/Y'));
    });
  });
  describe('orNone function', () => {
    it('returns "(none)" for null value', () => {
      expect(orNone(null)).toBe('(none)');
    });
    it('return the correct value when a non-null value is passed', () => {
      const data = 'value';
      expect(orNone(data)).toBe(data);
    });
    it('return the correct value when a non-null value is passed & a call back function is passed', () => {
      const id = '5d22e258-03d7-4289-87c0-49396a67929f';
      expect(orNone(id, condenseCommitId)).toBe(condenseCommitId(id));
    });
  });
  describe('getStatus function', () => {
    it('returns "(none)" for null value', () => {
      expect(getStatus(null)).toBe('(none)');
    });
    it('return the correct value when a never_run value is passed', () => {
      const data = 'never_run';
      expect(getStatus(data)).toBe('never-run');
    });
    it('returns the provided value without modification ', () => {
      const status = 'success';
      expect(getStatus(status)).toBe(status);
    });
  });
  describe('getEntityName should return', function() {
    beforeEach(function () {
      this.entity = cloneDeep({'@id': 'test'});
    });
    describe('returns the rdfs:label if present', function() {
      it('and in english', function() {
        this.entity[`${RDFS}label`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
        expect(getEntityName(this.entity)).toEqual('hello');
      });
      it('and there is no english version', function() {
        this.entity[`${RDFS}label`] = [{ '@value': 'title' }];
        expect(getEntityName(this.entity)).toEqual('title');
      });
    });
    describe('returns the dcterms:title if present and no rdfs:label', function() {
      it('and in english', function() {
        this.entity[`${DCTERMS}title`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
        expect(getEntityName(this.entity)).toEqual('hello');
      });
      it('and there is no english version', function() {
        this.entity[`${DCTERMS}title`] = [{ '@value': 'title' }];
        expect(getEntityName(this.entity)).toEqual('title');
      });
      describe('returns the  SKOSXL:literalForm,  if present and no rdfs:label or dcterms:title', function () {
        it('and in english', function () {
          this.entity[`${SKOSXL}literalForm`] = [{'@value': 'hello', '@language': 'en'}, {
            '@value': 'hola',
            '@language': 'es'
          }];
          expect(getEntityName(this.entity)).toEqual('hello');
        });
        it('and there is no english version', function () {
          this.entity[`${SKOSXL}literalForm`] = [{'@value': 'Salutos', '@language': 'eo'}];
          expect(getEntityName(this.entity)).toEqual('Salutos');
        });
      });
    });
    describe('returns the dc:title if present and no rdfs:label or dcterms:title', function() {
      it('and in english', function() {
        this.entity[`${DC}title`] = [{'@value': 'hello', '@language': 'en'}, {'@value': 'hola', '@language': 'es'}];
        expect(getEntityName(this.entity)).toEqual('hello');
      });
      it('and there is no english version', function() {
        this.entity[`${DC}title`] = [{ '@value': 'title' }];
        expect(getEntityName(this.entity)).toEqual('title');
      });
    });
    it('returns the @id if present and nothing else', function() {
      this.entity['@id'] = 'http://test.com#ontology';
      expect(getEntityName(this.entity)).toEqual('Ontology');
    });
  });
  it('getShaclGeneratedData should convert FormValues into JSON-LD', () => {
    const simpleTextProp = 'urn:simpleTextProp';
    const multiTextProp = 'urn:multiTextProp';
    const missingProp = 'urn:missingTextProp';
    const complexProp = 'urn:complexProp';
    const complexPropA = 'urn:subPropA';
    const multiComplexProp = 'urn:multiComplexProp';
    const multiComplexPropA = 'urn:multiSubPropA';
    const multiComplexPropB = 'urn:multiSubPropB';
    const nodeShape: JSONLDObject = { '@id': 'urn:Class', '@type': [`${SHACL}NodeShape`] };
    const simpleTextPropertyShape: JSONLDObject = {
      '@id': 'urn:SimpleTextPropertyShape',
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
      [`${SHACL}path`]: [{ '@id': simpleTextProp }],
      [`${SHACL}minCount`]: [{ '@value': '1' }],
      [`${SHACL}maxCount`]: [{ '@value': '2' }],
      [`${SHACL}datatype`]: [{ '@id': `${XSD}int` }],
    };
    const multiTextPropertyShape: JSONLDObject = {
      '@id': 'urn:MultiTextPropertyShape',
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
      [`${SHACL}path`]: [{ '@id': multiTextProp }],
      [`${SHACL}minCount`]: [{ '@value': '1' }],
      [`${SHACL}maxCount`]: [{ '@value': '2' }]
    };
    const missingPropertyShape: JSONLDObject = {
      '@id': 'urn:MissingPropertyShape',
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
      [`${SHACL}path`]: [{ '@id': missingProp }],
      [`${SHACL}minCount`]: [{ '@value': '1' }],
      [`${SHACL}maxCount`]: [{ '@value': '2' }]
    };
    const complexPropertyShape: JSONLDObject = {
      '@id': 'urn:ComplexPropertyShape',
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL}path`]: [{ '@id': complexProp }],
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
      [`${SHACL}path`]: [{ '@id': complexPropA }],
      [`${SHACL}name`]: [{ '@value': 'Complex Prop A' }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    };
    const multiComplexPropertyShape: JSONLDObject = {
      '@id': 'urn:multiComplexPropertyShape',
      '@type': [ `${SHACL}PropertyShape` ],
      [`${SHACL}path`]: [{ '@id': multiComplexProp }],
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
      [`${SHACL}path`]: [{ '@id': multiComplexPropA }],
      [`${SHACL}name`]: [{ '@value': 'Multi Complex Prop A' }],
      [`${SHACL}datatype`]: [{ '@id': `${XSD}string` }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    };
    const subPropertyShape3: JSONLDObject = {
      '@id': 'urn:subPropertyShape3',
      '@type': [`${SHACL}PropertyShape`],
      [`${SHACL}path`]: [{ '@id': multiComplexPropB }],
      [`${SHACL}name`]: [{ '@value': 'Multi Complex Prop B' }],
      [`${SHACL_FORM}usesFormField`]: [{ '@id': `${SHACL_FORM}TextInput` }],
    };
    const fullRDF: JSONLDObject[] = [nodeShape, simpleTextPropertyShape, multiTextPropertyShape, missingPropertyShape, complexPropertyShape, subNodeShape1, subPropertyShape1, multiComplexPropertyShape, subNodeShape2, subPropertyShape2, subPropertyShape3];
    const simpleTextConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, simpleTextPropertyShape['@id'], fullRDF);
    const multiTextConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, multiTextPropertyShape['@id'], fullRDF);
    const missingTextConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, missingPropertyShape['@id'], fullRDF);
    const complexConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, complexPropertyShape['@id'], fullRDF);
    const multiComplexConfig: SHACLFormFieldConfig = new SHACLFormFieldConfig(nodeShape, multiComplexPropertyShape['@id'], fullRDF);
    const formValues: FormValues = {
      [simpleTextProp]: '10',
      [multiTextProp]: ['A', 'B', ''],
      [complexProp]: {
        [complexPropA]: 'http://test.com'
      },
      [multiComplexProp]: [
        { [multiComplexPropA]: 'http://example.com/1', [multiComplexPropB]: 'B' },
        { [multiComplexPropA]: 'http://example.com/2', [multiComplexPropB]: 'Z' },
        { [multiComplexPropA]: 'http://example.com/3', [multiComplexPropB]: '' },
      ]
    };
    const instance: JSONLDObject = { '@id': 'test', '@type': [nodeShape['@id']] };
    const result = getShaclGeneratedData(instance, [simpleTextConfig, multiTextConfig, missingTextConfig, complexConfig, multiComplexConfig], formValues);
    expect(result.length).toEqual(5);
    expect(result[0]['@id']).toEqual(instance['@id']);
    expect(instance[simpleTextProp]).toEqual([{'@value': '10', '@type': `${XSD}int`}]);
    expect(instance[multiTextProp]).toEqual([ { '@value': 'A' }, { '@value': 'B' } ]);
    expect(instance[complexProp]).toEqual([ { '@id': jasmine.any(String) } ]);
    const complexNode: JSONLDObject = result.find(obj => obj['@id'] === instance[complexProp][0]['@id']);
    expect(complexNode).toBeTruthy();
    expect(complexNode['@type']).toEqual([subNodeShape1['@id']]);
    expect(complexNode[complexPropA]).toEqual([ { '@id': 'http://test.com' } ]);
    expect(instance[multiComplexProp]).toEqual([ { '@id': jasmine.any(String) }, { '@id': jasmine.any(String) }, { '@id': jasmine.any(String) } ]);
    const multiComplexNode1 = result.find(obj => obj['@id'] === instance[multiComplexProp][0]['@id']);
    expect(multiComplexNode1).toBeTruthy();
    expect(multiComplexNode1['@type']).toEqual([subNodeShape2['@id']]);
    expect(multiComplexNode1[multiComplexPropA]).toEqual([ { '@value': 'http://example.com/1' } ]);
    expect(multiComplexNode1[multiComplexPropB]).toEqual([ { '@value': 'B' } ]);
    const multiComplexNode2 = result.find(obj => obj['@id'] === instance[multiComplexProp][1]['@id']);
    expect(multiComplexNode2).toBeTruthy();
    expect(multiComplexNode2['@type']).toEqual([subNodeShape2['@id']]);
    expect(multiComplexNode2[multiComplexPropA]).toEqual([ { '@value': 'http://example.com/2' } ]);
    expect(multiComplexNode2[multiComplexPropB]).toEqual([ { '@value': 'Z' } ]);
    const multiComplexNode3 = result.find(obj => obj['@id'] === instance[multiComplexProp][2]['@id']);
    expect(multiComplexNode3).toBeTruthy();
    expect(multiComplexNode3['@type']).toEqual([subNodeShape2['@id']]);
    expect(multiComplexNode3[multiComplexPropA]).toEqual([ { '@value': 'http://example.com/3' } ]);
    expect(multiComplexNode3[multiComplexPropB]).toBeUndefined();
  });

  describe('getSubstringMatch helper method', () => {
    const str = 'This is a test string that has a bunch of words with more content.';
    const tests = [
      {
        searchText: 'bunch',
        expected: '...has a bunch of words...'
      },
      {
        searchText: 'test',
        expected: '...is a test string that...'
      },
      {
        searchText: 'content',
        expected: '...with more content.'
      },
      {
        searchText: 'This',
        expected: 'This is a...'
      },
      {
        searchText: 'string',
        expected: '...a test string that has...'
      },
      {
        searchText: 'has',
        expected: '...string that has a bunch...'
      }
    ];
    tests.forEach(test => {
      it(`should find and truncate appropriate text "${test.searchText}"`, () => {
        const result = getSubstringMatch(str, test.searchText);
        expect(result).toEqual(test.expected);
      });
    });
  });
});
