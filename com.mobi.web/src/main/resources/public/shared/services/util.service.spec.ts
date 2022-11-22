/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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

import { formatDate } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { has, isString, startsWith } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockPipe, MockProvider } from 'ng-mocks';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { cleanStylesFromDOM } from '../../../../../test/ts/Shared';
import { REGEX } from '../../constants';
import { DCTERMS, XSD } from '../../prefixes';

import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { BeautifyPipe } from '../pipes/beautify.pipe';
import { SplitIRIPipe } from '../pipes/splitIRI.pipe';
import { UtilService } from './util.service';

describe('Util service', function() {
    let service: UtilService;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let toastrStub: jasmine.SpyObj<ToastrService>;
    let splitIRIStub: jasmine.SpyObj<SplitIRIPipe>;
    let beautifyStub: jasmine.SpyObj<BeautifyPipe>;

    const properties = [
        XSD + 'dateTime',
        XSD + 'dateTimeStamp',
        XSD + 'decimal',
        XSD + 'double',
        XSD + 'float',
        XSD + 'int',
        XSD + 'integer',
        XSD + 'long',
        XSD + 'short',
        XSD + 'other',
        XSD + 'byte'
    ];

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                UtilService,
                MockProvider(ProgressSpinnerService),
                MockProvider(ToastrService),
                { provide: BeautifyPipe, useClass: MockPipe(BeautifyPipe) },
                { provide: SplitIRIPipe, useClass: MockPipe(SplitIRIPipe) },
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(UtilService);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);
        toastrStub = TestBed.get(ToastrService);
        splitIRIStub = TestBed.get(SplitIRIPipe);
        beautifyStub = TestBed.get(BeautifyPipe);

        progressSpinnerStub.track.and.callFake((ob) => ob);
        splitIRIStub.transform.and.returnValue({begin: '', then: '', end: ''});
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        progressSpinnerStub = null;
        toastrStub = null;
        splitIRIStub = null;
        beautifyStub = null;
    });

    describe('should determine whether an entity is a blank node', function() {
        it('if the entity contains a blank node id', function() {
            expect(service.isBlankNode({ '@id': '_:genid0' })).toBe(true);
        });
        it('if the entity does not contain a blank node id', function() {
            expect(service.isBlankNode({'@id': 'test'})).toBe(false);
        });
    });
    it('should determine whether a string is a blank node id', function() {
        expect(service.isBlankNodeId('_:genid')).toBe(true);
        expect(service.isBlankNodeId('_:b')).toBe(true);
        expect(service.isBlankNodeId('http://mobi.com/.well-known/genid/')).toBe(true);
        ['', 'notblanknode', undefined, null].forEach((test) => {
            expect(service.isBlankNodeId(test)).toBe(false);
        });
    });
    describe('should get the beautified version of an IRI', function() {
        beforeEach(function() {
            this.iri = 'iri';
            beautifyStub.transform.and.callFake(a => '' + a);
        });
        describe('if it has a local name', function() {
            it('that is a UUID', function() {
                const uuid = '01234567-9ABC-DEF0-1234-56789ABCDEF0';
                splitIRIStub.transform.and.returnValue({begin: 'begin', then: 'then', end: uuid});
                const result = service.getBeautifulIRI(this.iri);
                expect(splitIRIStub.transform).toHaveBeenCalledWith(this.iri);
                expect(beautifyStub.transform).not.toHaveBeenCalled();
                expect(result).toBe(uuid);
            });
            it('that is not a UUID', function() {
                splitIRIStub.transform.and.returnValue({begin: 'begin', then: 'then', end: 'end'});
                const result = service.getBeautifulIRI(this.iri);
                expect(splitIRIStub.transform).toHaveBeenCalledWith(this.iri);
                expect(beautifyStub.transform).toHaveBeenCalledWith('end');
                expect(result).toBe('end');
            });
        });
        it('if it does not have a local name', function() {
            const result = service.getBeautifulIRI(this.iri);
            expect(splitIRIStub.transform).toHaveBeenCalledWith(this.iri);
            expect(beautifyStub.transform).not.toHaveBeenCalled();
            expect(result).toBe(this.iri);
        });
    });
    describe('should get a property value from an entity', function() {
        it('if it contains the property', function() {
            const entity = {'@id': '', 'property': [{'@value': 'value'}]};
            expect(service.getPropertyValue(entity, 'property')).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(service.getPropertyValue({'@id': ''}, 'property')).toBe('');
        });
    });
    describe('should set a property value for an entity', function() {
        beforeEach(function() {
            this.value = 'value';
        });
        it('when not there', function() {
            const entity = {'@id': ''};
            const expected = {'@id': '', 'property': [{'@value': this.value}]};
            service.setPropertyValue(entity, 'property', this.value);
            expect(entity).toEqual(expected);
        });
        it('when there', function() {
            const entity = {'@id': '', 'property': [{'@value': 'other'}]};
            const expected = {'@id': '', 'property': [{'@value': 'other'}, {'@value': this.value}]};
            service.setPropertyValue(entity, 'property', this.value);
            expect(entity).toEqual(expected);
        });
    });
    it('should test whether an entity has a property value', function() {
        const prop = 'property';
        const value = {'@value': 'value'};
        expect(service.hasPropertyValue({'@id': ''}, prop, value['@value'])).toEqual(false);
        expect(service.hasPropertyValue({'@id': '', 'property': [value]}, prop, value['@value'])).toEqual(true);
    });
    it('should remove a property value from an entity', function() {
        const prop = 'property';
        const value = {'@value': 'value'};
        const other = {'@value': 'other'};
        const entity = {'@id': '', 'property': [value, other]};
        service.removePropertyValue(entity, prop, value['@value']);
        expect(entity[prop]).not.toContain(value);
        service.removePropertyValue(entity, prop, other['@value']);
        expect(has(entity, prop)).toEqual(false);
    });
    it('should replace a property value from an entity', function() {
        const prop = 'property';
        const value = {'@value': 'value'};
        const other = {'@value': 'other'};
        const entity = {'@id': '', 'property': [value]};
        service.replacePropertyValue(entity, prop, value['@value'], other['@value']);
        expect(entity[prop]).toContain(other);
        expect(entity[prop]).not.toContain(value);
    });
    describe('should get a property id value from an entity', function() {
        it('if it contains the property', function() {
            const entity = {'@id': '', 'property': [{'@id': 'id'}]};
            expect(service.getPropertyId(entity, 'property')).toBe('id');
        });
        it('if it does not contain the property', function() {
            expect(service.getPropertyId({'@id': ''}, 'property')).toBe('');
        });
    });
    describe('should set a property id value for an entity', function() {
        beforeEach(function() {
            this.id = 'id';
        });
        it('when not there', function() {
            const entity = {'@id': ''};
            const expected = {'@id': '', 'property': [{'@id': this.id}]};
            service.setPropertyId(entity, 'property', this.id);
            expect(entity).toEqual(expected);
        });
        it('when there', function() {
            const entity = {'@id': '', 'property': [{'@id': 'otherId'}]};
            const expected = {'@id': '', 'property': [{'@id': 'otherId'}, {'@id': this.id}]};
            service.setPropertyId(entity, 'property', this.id);
            expect(entity).toEqual(expected);
        });
    });
    it('should test whether an entity has a property id value', function() {
        const prop = 'property';
        const value = {'@id': 'id'};
        expect(service.hasPropertyId({'@id': ''}, prop, value['@id'])).toEqual(false);
        expect(service.hasPropertyId({'@id': '', 'property': [value]}, prop, value['@id'])).toEqual(true);
    });
    it('should remove a property id value from an entity', function() {
        const prop = 'property';
        const value = {'@id': 'id'};
        const other = {'@id': 'other'};
        const entity = {'@id': '', 'property': [value, other]};
        service.removePropertyId(entity, prop, value['@id']);
        expect(entity[prop]).not.toContain(value);
        service.removePropertyId(entity, prop, other['@id']);
        expect(has(entity, prop)).toEqual(false);
    });
    it('should replace a property id value from an entity', function() {
        const prop = 'property';
        const value = {'@id': 'id'};
        const other = {'@id': 'other'};
        const entity = {'@id': '', 'property': [value]};
        service.replacePropertyId(entity, prop, value['@id'], other['@id']);
        expect(entity[prop]).toContain(other);
        expect(entity[prop]).not.toContain(value);
    });
    describe('should get a dcterms property value from an entity', function() {
        it('if it contains the property', function() {
            const prop = 'prop';
            const entity = {'@id': '', [DCTERMS + prop]: [{'@value': 'value'}]};
            expect(service.getDctermsValue(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(service.getDctermsValue({'@id': ''}, 'prop')).toBe('');
        });
    });
    it('should remove a dcterms property value from an entity', function() {
        const prop = 'prop';
        const value = {'@value': 'value'};
        const other = {'@value': 'other'};
        const entity = {'@id': '', [DCTERMS + prop]: [value, other]};
        service.removeDctermsValue(entity, prop, value['@value']);
        expect(entity[prop]).not.toContain(value);
        service.removeDctermsValue(entity, prop, other['@value']);
        expect(has(entity, prop)).toEqual(false);
    });
    it('should set a dcterms property value for an entity', function() {
        const prop = 'prop';
        const value = 'value';
        const entity = {'@id': ''};
        const expected = {'@id': '', [DCTERMS + prop]: [{'@value': value}]};
        service.setDctermsValue(entity, prop, value);
        expect(entity).toEqual(expected);
    });
    it('should update a dcterms property value for an entity', function() {
        const prop = 'prop';
        const value = 'value';
        const newValue = 'newValue';
        const entity = {'@id': ''};
        const expected = {'@id': '', [DCTERMS + prop]: [{'@value': value}]};
        service.setDctermsValue(entity, prop, value);
        expect(entity).toEqual(expected);
        expected[DCTERMS + prop] = [{'@value': newValue}];
        service.updateDctermsValue(entity, prop, newValue);
        expect(entity).toEqual(expected);
    });
    describe('should get a dcterms property id value from an entity', function() {
        it('if it contains the property', function() {
            const prop = 'prop';
            const entity = {'@id': '', [DCTERMS + prop]: [{'@id': 'value'}]};
            expect(service.getDctermsId(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(service.getDctermsId({'@id': ''}, 'prop')).toBe('');
        });
    });
    it('should create an error toast', function() {
        service.createErrorToast('Text');
        expect(toastrStub.error).toHaveBeenCalledWith('Text', 'Error', {timeOut: 3000});
    });
    it('should create a success toast', function() {
        service.createSuccessToast('Text');
        expect(toastrStub.success).toHaveBeenCalledWith('Text', 'Success', {timeOut: 3000});
    });
    describe('should create a warning toast', function() {
        it('with provided config', function() {
            service.createWarningToast('Text', {timeOut: 10000});
            expect(toastrStub.warning).toHaveBeenCalledWith('Text', 'Warning', {timeOut: 10000});
        });
        it('with default config', function() {
            service.createWarningToast('Text');
            expect(toastrStub.warning).toHaveBeenCalledWith('Text', 'Warning', {timeOut: 3000});
        });
    });
    it('should get the namespace of an iri', function() {
        const result = service.getIRINamespace('iri');
        expect(splitIRIStub.transform).toHaveBeenCalledWith('iri');
        expect(isString(result)).toBe(true);
    });
    it('should get the localname of an iri', function() {
        const result = service.getIRILocalName('iri');
        expect(splitIRIStub.transform).toHaveBeenCalledWith('iri');
        expect(isString(result)).toBe(true);
    });
    describe('should get the specified date entity', function() {
        it('when provided', function() {
            const date = '1/1/2000';
            expect(service.getDate(date, 'short')).toBe(formatDate(new Date(date), 'short', 'en-US'));
        });
        it('unless it is not provided', function() {
            expect(service.getDate('', '')).toBe('(No Date Specified)');
        });
    });
    it('should condense a commit id', function() {
        const id = 'AAAAAAAAAAAAAAA';
        splitIRIStub.transform.and.callFake(a => ({begin: '', then: '', end: a}));
        expect(service.condenseCommitId(id)).toEqual('AAAAAAAAAA');
    });
    it('should turn a paginated configuration object into HTTP query parameters', function () {
        expect(service.paginatedConfigToParams({sortOption: {field: 'test', asc: true, label: ''}, limit: 10, pageIndex: 1})).toEqual({sort: 'test', ascending: true, limit: 10, offset: 10});
        expect(service.paginatedConfigToParams({sortOption: {field: 'test', asc: false , label: ''}, limit: 10})).toEqual({sort: 'test', ascending: false, limit: 10});
        expect(service.paginatedConfigToParams({sortOption: {field: '', asc: true, label: ''}, pageIndex: 0})).toEqual({ascending: true});
        expect(service.paginatedConfigToParams({})).toEqual({});
    });
    describe('should create a rejected promise with an error message', function() {
        beforeEach(function() {
            spyOn(service, 'getErrorMessage').and.returnValue('Test');
        });
        it('unless the response was canceled', fakeAsync(function() {
            service.rejectError(new HttpErrorResponse({status: -1}), 'Test')
                .then(() => {
                    fail('Promise should have rejected.');
                }, error => {
                    expect(error).toBe('');
                });
            tick();
            expect(service.getErrorMessage).not.toHaveBeenCalled();
        }));
        it('successfully', fakeAsync(function() {
            const resp = new HttpErrorResponse({});
            service.rejectError(resp, 'Test')
                .then(() => {
                    fail('Promise should have rejected.');
                }, error => {
                    expect(error).toBe('Test');
                });
            tick();
            expect(service.getErrorMessage).toHaveBeenCalledWith(resp, 'Test');
        }));
    });
    it('should retrieve an error message from a http response', function() {
        expect(service.getErrorMessage(new HttpErrorResponse({}), 'default')).toBe('default');
        expect(service.getErrorMessage(new HttpErrorResponse({}))).toBe('Something went wrong. Please try again later.');
        expect(service.getErrorMessage(new HttpErrorResponse({statusText: ''}))).toBe('Something went wrong. Please try again later.');
        expect(service.getErrorMessage(new HttpErrorResponse({statusText: 'Test'}))).toBe('Test');
    });
    describe('should create a rejected promise with an error object', function() {
        beforeEach(function() {
            spyOn(service, 'getErrorDataObject').and.returnValue({'errorMessage': 'test', 'errorDetails': []});
        });
        it('unless the response was canceled', fakeAsync(function() {
            service.rejectErrorObject(new HttpErrorResponse({status: -1}), 'test')
                .then(() => {
                    fail('Promise should have rejected.');
                }, error => {
                    expect(error).toEqual({'errorMessage': '', 'errorDetails': []});
                });
            tick();
            expect(service.getErrorDataObject).not.toHaveBeenCalled();
        }));
        it('successfully', fakeAsync(function() {
            const resp = new HttpErrorResponse({});
            service.rejectErrorObject(resp, 'test')
                .then(() => {
                    fail('Promise should have rejected.');
                }, error => {
                    expect(error).toEqual({'errorMessage': 'test', 'errorDetails': []});
                });
            tick();
            expect(service.getErrorDataObject).toHaveBeenCalledWith(resp, 'test');
        }));
    });
    it('should retrieve an error object from a http response', function() {
        expect(service.getErrorDataObject(new HttpErrorResponse({error: {}}), 'default'))
            .toEqual({'errorMessage': 'default', 'errorDetails': []});
        expect(service.getErrorDataObject(new HttpErrorResponse({})))
             .toEqual({'errorMessage': 'Something went wrong. Please try again later.', 'errorDetails': []});
        expect(service.getErrorDataObject(new HttpErrorResponse({error: {errorMessage: ''}})))
            .toEqual({'errorMessage': 'Something went wrong. Please try again later.', 'errorDetails': []});
        expect(service.getErrorDataObject(new HttpErrorResponse({error: {errorMessage: 'error'}})))
            .toEqual({'errorMessage': 'error', 'errorDetails': []});
    });
    describe('should create HttpParams from an object', function() {
        it('with string values', function() {
            const obj = {
                param1: 'a',
                param2: 'b'
            };
            const result = service.createHttpParams(obj);
            expect(result.get('param1')).toEqual('a');
            expect(result.get('param2')).toEqual('b');
        });
        it('with non string values', function() {
            const obj = {
                param1: 10,
                param2: false
            };
            const result = service.createHttpParams(obj);
            expect(result.get('param1')).toEqual('10');
            expect(result.get('param2')).toEqual('false');
        });
        it('with string array values', function() {
            const obj = {
                param1: ['a', 'b']
            };
            const result = service.createHttpParams(obj);
            expect(result.getAll('param1')).toEqual(['a', 'b']);
        });
        it('with non string array values', function() {
            const obj = {
                param1: [10, 15]
            };
            const result = service.createHttpParams(obj);
            expect(result.getAll('param1')).toEqual(['10', '15']);
        });
        it('with undefined, null, or empty string values', function() {
            const obj = {
                param1: undefined,
                param2: null,
                param3: ''
            };
            const result = service.createHttpParams(obj);
            expect(result.get('param1')).toBeNull();
            expect(result.get('param2')).toBeNull();
            expect(result.get('param3')).toBeNull();
        });
    });
    it('should properly track a request', function() {
        const ob = of(null);
        service.trackedRequest(ob, true);
        expect(progressSpinnerStub.track).not.toHaveBeenCalled();
        service.trackedRequest(ob, false);
        expect(progressSpinnerStub.track).toHaveBeenCalledWith(ob);
    });
    it('should get correct statement predicates and objects for the provided id and array', function() {
        const array = [{
            '@id': 'id',
            prop1: 'value1',
            prop2: 'value2'
        }, {
            '@id': 'different',
            prop3: 'value3',
            prop4: 'value4'
        }];
        const expected = [{
            p: 'prop1', o: 'value1'
        }, {
            p: 'prop2', o: 'value2'
        }];
        expect(service.getChangesById('id', array)).toEqual(expected);
    });
    it('should get correct statement predicates and objects for the provided addition or deletion', function() {
        const addition = {
            '@id': 'id',
            prop1: 'value1',
            prop2: 'value2',
            prop3: ['value3', 'value4'],
            prop5: 'value5'
        };
        const expected = [{
            p: 'prop1', o: 'value1'
        }, {
            p: 'prop2', o: 'value2'
        }, {
            p: 'prop3', o: 'value3'
        }, {
            p: 'prop3', o: 'value4'
        }, {
            p: 'prop5', o: 'value5'
        }];
        expect(service.getPredicatesAndObjects(addition)).toEqual(expected);
    });
    it('should get correct object IRIs for the provided addition or deletion', function() {
        const additions = [{
            '@id': 'id',
            prop1: 'value1',
            prop2: [{'@id': 'iri1'}],
            prop3: [{'@id': 'iri2'}, {'@id': 'iri3'}],
            prop5: 'value5'
        }];
        const expected = ['iri1', 'iri2', 'iri3'];
        expect(service.getObjIrisFromDifference(additions)).toEqual(expected);
    });
    it('should return the localname of the split IRI for the provided object\'s p property', function() {
        splitIRIStub.transform.and.returnValue({begin: '', then: '', end: 'localname'});
        expect(service.getPredicateLocalName({p: 'predicate', o: ''})).toBe('localname');
        expect(splitIRIStub.transform).toHaveBeenCalledWith('predicate');
        service.getPredicateLocalName({p: '', o: ''});
        expect(splitIRIStub.transform).toHaveBeenCalledWith('');
    });
    it('create a unique IRI for a blank node.', function() {
        const result = startsWith(service.getIdForBlankNode(), '_:mobi-bnode-');
        expect(result).toBe(true);
    });
    it('getSkolemizedIRI should create the correct type of string', function() {
        expect(startsWith(service.getSkolemizedIRI(), 'http://mobi.com/.well-known/genid/')).toBe(true);
    });
    it('getInputType should return the proper input type based on datatype', function() {
        [0, 1].forEach(id => {
            expect(service.getInputType(properties[id])).toBe('datetime-local');
        });
        [2, 3, 4, 5, 6, 7, 8, 10].forEach(id => {
            expect(service.getInputType(properties[id])).toBe('number');
        });
        expect(service.getInputType(properties[9])).toBe('text');
    });
    it('getPattern should return the proper REGEX based on datatype', function() {
        [0, 1].forEach(id => {
            expect(service.getPattern(properties[id])).toBe(REGEX.DATETIME);
        });
        [2, 3, 4].forEach(id => {
            expect(service.getPattern(properties[id])).toBe(REGEX.DECIMAL);
        });
        [5, 6, 7, 8, 10].forEach(id => {
            expect(service.getPattern(properties[id])).toBe(REGEX.INTEGER);
        });
        expect(service.getPattern(properties[9])).toBe(REGEX.ANYTHING);
    });
});
