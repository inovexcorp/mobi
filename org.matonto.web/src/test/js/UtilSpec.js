/*-
 * #%L
 * org.matonto.web
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
describe('Util service', function() {
    var utilSvc, prefixes, toastr, splitIRIFilter, beautifyFilter, $filter, $httpBackend, $q, $timeout;

    beforeEach(function() {
        module('util');
        mockPrefixes();
        injectSplitIRIFilter();
        injectBeautifyFilter();
        mockToastr();

        inject(function(utilService, _prefixes_, _toastr_, _splitIRIFilter_, _beautifyFilter_, _$filter_, _$httpBackend_, _$q_, _$timeout_) {
            utilSvc = utilService;
            prefixes = _prefixes_;
            toastr = _toastr_;
            splitIRIFilter = _splitIRIFilter_;
            beautifyFilter = _beautifyFilter_;
            $filter = _$filter_;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
            $timeout = _$timeout_;
        });
    });

    describe('should get the beautified version of an IRI', function() {
        beforeEach(function() {
            this.iri = 'iri';
        });
        it('if it has a local name', function() {
            splitIRIFilter.and.returnValue({begin: 'begin', then: 'then', end: 'end'});
            var result = utilSvc.getBeautifulIRI(this.iri);
            expect(splitIRIFilter).toHaveBeenCalledWith(this.iri);
            expect(beautifyFilter).toHaveBeenCalledWith('end');
            expect(result).toBe('end');
        });
        it('if it does not have a local name', function() {
            var result = utilSvc.getBeautifulIRI(this.iri);
            expect(splitIRIFilter).toHaveBeenCalledWith(this.iri);
            expect(beautifyFilter).not.toHaveBeenCalled();
            expect(result).toBe(this.iri);
        });
    });
    describe('should get a property value from an entity', function() {
        it('if it contains the property', function() {
            var prop = 'property';
            var entity = {'property': [{'@value': 'value'}]};
            expect(utilSvc.getPropertyValue(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getPropertyValue({}, 'prop')).toBe('');
        });
    });
    describe('should set a property value for an entity', function() {
        it('when not there', function() {
            var prop = 'property';
            var value = 'value';
            var entity = {};
            var expected = {'property': [{'@value': value}]};
            utilSvc.setPropertyValue(entity, prop, value);
            expect(entity).toEqual(expected);
        });
        it('when there', function() {
            var prop = 'property';
            var value = 'value';
            var entity = {'property': [{'@value': 'other'}]};
            var expected = {'property': [{'@value': 'other'}, {'@value': value}]};
            utilSvc.setPropertyValue(entity, prop, value);
            expect(entity).toEqual(expected);
        });
    });
    describe('should set a property id for an entity', function() {
        it('when not there', function() {
            var prop = 'property';
            var id = 'id';
            var entity = {};
            var expected = {'property': [{'@id': id}]};
            utilSvc.setPropertyId(entity, prop, id);
            expect(entity).toEqual(expected);
        });
        it('when there', function() {
            var prop = 'property';
            var id = 'id';
            var entity = {'property': [{'@id': 'otherId'}]};
            var expected = {'property': [{'@id': 'otherId'}, {'@id': id}]};
            utilSvc.setPropertyId(entity, prop, id);
            expect(entity).toEqual(expected);
        });
    });
    describe('should get a dcterms property value from an entity', function() {
        it('if it contains the property', function() {
            var prop = 'prop';
            var entity = {};
            entity[prefixes.dcterms + prop] = [{'@value': 'value'}];
            expect(utilSvc.getDctermsValue(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getDctermsValue({}, 'prop')).toBe('');
        });
    });
    it('should set a dcterms property value for an entity', function() {
        var prop = 'prop';
        var value = 'value';
        var entity = {};
        var expected = {};
        expected[prefixes.dcterms + prop] = [{'@value': value}];
        utilSvc.setDctermsValue(entity, prop, value);
        expect(entity).toEqual(expected);
    });
    describe('getItemNamespace returns', function() {
        it('item.namespace value when present', function() {
            var result = utilSvc.getItemNamespace({namespace: 'namespace'});
            expect(result).toEqual('namespace');
        });
        it("'No namespace' when item.namespace is not present", function() {
            var result = utilSvc.getItemNamespace({});
            expect(result).toEqual('No namespace');
        });
    });
    describe('should get a dcterms property id value from an entity', function() {
        it('if it contains the property', function() {
            var prop = 'prop',
                entity = {};
            entity[prefixes.dcterms + prop] = [{'@id': 'value'}];
            expect(utilSvc.getDctermsId(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getDctermsId({}, 'prop')).toBe('');
        });
    });
    describe('should parse a link header string', function() {
        it('unless it is empty', function() {
            expect(utilSvc.parseLinks('')).toEqual({});
        })
        it('correctly', function() {
            var link = 'http://example.com';
            var links = '<' + link + '>; rel="test"';
            expect(utilSvc.parseLinks(links)).toEqual({test: link});
        });
    });
    it('should create an error toast', function() {
        utilSvc.createErrorToast('Text');
        expect(toastr.error).toHaveBeenCalledWith('Text', 'Error', {timeOut: 0});
    });
    it('should get the namespace of an iri', function() {
        var result = utilSvc.getIRINamespace('iri');
        expect(splitIRIFilter).toHaveBeenCalledWith('iri');
        expect(_.isString(result)).toBe(true);
    });
    describe('should get the specified date entity', function() {
        it('when provided', function() {
            var date = '1/1/2000';
            expect(utilSvc.getDate(date, 'short')).toBe($filter('date')(new Date(date), 'short'));
        });
        it('unless it is not provided', function() {
            expect(utilSvc.getDate('')).toBe('(No Date Specified)');
        });
    });
    it('should condense a commit id', function() {
        var id = 'testId';
        expect(utilSvc.condenseCommitId(id)).toEqual($filter('splitIRI')(id).end.substr(0,10));
    });
    it('should turn a paginated configuration object into HTTP query parameters', function () {
        expect(utilSvc.paginatedConfigToParams({sortOption: {field: 'test', asc: true}, limit: 10, pageIndex: 1})).toEqual({sort: 'test', ascending: true, limit: 10, offset: 10});
        expect(utilSvc.paginatedConfigToParams({sortOption: {field: 'test'}, limit: 10})).toEqual({sort: 'test', limit: 10});
        expect(utilSvc.paginatedConfigToParams({sortOption: {asc: true}, pageIndex: 0})).toEqual({ascending: true});
        expect(utilSvc.paginatedConfigToParams({})).toEqual({});
    });
    describe('should get a page of paginated results from a URL', function() {
        it('if the call succeeds', function(done) {
            $httpBackend.whenGET('/test').respond(200);
            utilSvc.getResultsPage('/test').then(function(response) {
                expect(_.isObject(response)).toBe(true);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        describe('if the call fails', function() {
            var failFunction;
            beforeEach(function() {
                failFunction = jasmine.createSpy('failFunction').and.returnValue($q.reject('Test'));
                $httpBackend.whenGET('/test').respond(400);
            });
            it('with a passed error function', function(done) {
                utilSvc.getResultsPage('/test', failFunction).then(function(response) {
                    fail('Promise should have rejected.');
                    done();
                }, function(response) {
                    expect(failFunction).toHaveBeenCalled();
                    expect(response).toBe('Test');
                    done();
                });
                $httpBackend.flush();
            });
            it('with a default error function', function(done) {
                spyOn(utilSvc, 'getErrorMessage').and.returnValue('Test');
                utilSvc.getResultsPage('/test').then(function(response) {
                    fail('Promise should have rejected.');
                    done();
                }, function(response) {
                    expect(utilSvc.getErrorMessage).toHaveBeenCalled();
                    expect(response).toBe('Test');
                    done();
                });
                $httpBackend.flush();
            });
        });
    });
    it('should reject a deferred promise with an error message', function(done) {
        spyOn(utilSvc, 'getErrorMessage').and.returnValue('Test');
        var deferred = $q.defer();
        utilSvc.onError({}, deferred, 'Test');
        deferred.promise.then(function() {
            fail('Promise should have rejected.');
            done();
        }, function(error) {
            expect(error).toBe('Test');
            expect(utilSvc.getErrorMessage).toHaveBeenCalledWith({}, 'Test');
            done();
        });
        $timeout.flush();
    });
    it('should retrieve an error message from a http response', function() {
        expect(utilSvc.getErrorMessage({}, 'default')).toBe('default');
        expect(utilSvc.getErrorMessage({})).toBe('Something went wrong. Please try again later.');
        expect(utilSvc.getErrorMessage({statusText: ''})).toBe('Something went wrong. Please try again later.');
        expect(utilSvc.getErrorMessage({statusText: 'Test'})).toBe('Test');
    });
});