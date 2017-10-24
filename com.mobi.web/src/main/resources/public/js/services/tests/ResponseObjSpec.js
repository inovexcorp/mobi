/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Response Obj service', function() {
    var responseObjSvc, splitIRI;

    beforeEach(function() {
        module('responseObj');
        injectSplitIRIFilter();

        inject(function(responseObj, _splitIRIFilter_) {
            responseObjSvc = responseObj;
            splitIRI = _splitIRIFilter_;
        });
    });

    afterEach(function() {
        responseObjSvc = null;
        splitIRI = null;
    });

    it('validates an item', function() {
        var result,
            tests = [
                {
                    value: null,
                    result: false
                },
                {
                    value: undefined,
                    result: false
                },
                {
                    value: '',
                    result: false
                },
                {
                    value: 0,
                    result: false
                },
                {
                    value: 'test',
                    result: false
                },
                {
                    value: {},
                    result: false
                },
                {
                    value: [],
                    result: false
                },
                {
                    value: {namespace: ''},
                    result: false
                },
                {
                    value: {localName: ''},
                    result: false
                },
                {
                    value: {namespace: '', localName: ''},
                    result: true
                }
            ];
        _.forEach(tests, function(test) {
            result = responseObjSvc.validateItem(test.value);
            expect(result).toBe(test.result);
        });
    });
    it('returns an item\'s IRI if it is valid', function() {
        var result,
            tests = [
                {
                    value: {},
                    result: ''
                },
                {
                    value: {namespace: 'test/', localName: 'test'},
                    result: 'test/test'
                }
            ];
        _.forEach(tests, function(test) {
            result = responseObjSvc.getItemIri(test.value);
            expect(result).toBe(test.result);
        });
    });
    it('createItemFromIri should call the correct functions', function() {
        splitIRI.and.returnValue({begin: 'begin', then: 'then', end: 'end'});
        expect(responseObjSvc.createItemFromIri('iri')).toEqual({namespace: 'beginthen', localName: 'end'});
        expect(splitIRI).toHaveBeenCalledWith('iri');
    });
});