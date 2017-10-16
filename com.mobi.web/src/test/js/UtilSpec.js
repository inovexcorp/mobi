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
describe('Util service', function() {
    var utilSvc, prefixes, toastr, splitIRIFilter, beautifyFilter, uuid, $filter, $httpBackend, $q, scope, properties, regex, httpSvc;

    beforeEach(function() {
        module('util');
        mockPrefixes();
        mockToastr();
        mockHttpService();
        injectSplitIRIFilter();
        injectBeautifyFilter();
        injectRegexConstant();

        module(function($provide) {
            $provide.service('uuid', function() {
                this.v4 = jasmine.createSpy('v4').and.returnValue('');
            });
        });

        inject(function(utilService, _prefixes_, _toastr_, _splitIRIFilter_, _beautifyFilter_, _uuid_, _$filter_, _$httpBackend_, _$q_, _$rootScope_, _REGEX_, _httpService_) {
            utilSvc = utilService;
            prefixes = _prefixes_;
            toastr = _toastr_;
            splitIRIFilter = _splitIRIFilter_;
            beautifyFilter = _beautifyFilter_;
            $filter = _$filter_;
            $httpBackend = _$httpBackend_;
            $q = _$q_;
            scope = _$rootScope_;
            uuid = _uuid_;
            regex = _REGEX_;
            httpSvc = _httpService_;
        });

        properties = [
            prefixes.xsd + 'dateTime',
            prefixes.xsd + 'dateTimeStamp',
            prefixes.xsd + 'decimal',
            prefixes.xsd + 'double',
            prefixes.xsd + 'float',
            prefixes.xsd + 'int',
            prefixes.xsd + 'integer',
            prefixes.xsd + 'long',
            prefixes.xsd + 'short',
            prefixes.xsd + 'other',
            prefixes.xsd + 'byte'
        ];
    });

    describe('should get the beautified version of an IRI', function() {
        beforeEach(function() {
            this.iri = 'iri';
        });
        describe('if it has a local name', function() {
            it('that is a UUID', function() {
                var uuid = '01234567-9ABC-DEF0-1234-56789ABCDEF0';
                splitIRIFilter.and.returnValue({begin: 'begin', then: 'then', end: uuid});
                var result = utilSvc.getBeautifulIRI(this.iri);
                expect(splitIRIFilter).toHaveBeenCalledWith(this.iri);
                expect(beautifyFilter).not.toHaveBeenCalled();
                expect(result).toBe(uuid);
            });
            it('that is not a UUID', function() {
                splitIRIFilter.and.returnValue({begin: 'begin', then: 'then', end: 'end'});
                var result = utilSvc.getBeautifulIRI(this.iri);
                expect(splitIRIFilter).toHaveBeenCalledWith(this.iri);
                expect(beautifyFilter).toHaveBeenCalledWith('end');
                expect(result).toBe('end');
            });
        });
        it('if it does not have a local name', function() {
            var result = utilSvc.getBeautifulIRI(this.iri);
            expect(splitIRIFilter).toHaveBeenCalledWith(this.iri);
            expect(beautifyFilter).not.toHaveBeenCalled();
            expect(result).toBe(this.iri);
        });
    });
    describe('should get a property value from an entity', function() {
        var prop = 'property';
        it('if it contains the property', function() {
            var entity = {'property': [{'@value': 'value'}]};
            expect(utilSvc.getPropertyValue(entity, prop)).toBe('value');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getPropertyValue({}, prop)).toBe('');
        });
    });
    describe('should set a property value for an entity', function() {
        var prop = 'property', value = 'value';
        it('when not there', function() {
            var entity = {};
            var expected = {'property': [{'@value': value}]};
            utilSvc.setPropertyValue(entity, prop, value);
            expect(entity).toEqual(expected);
        });
        it('when there', function() {
            var entity = {'property': [{'@value': 'other'}]};
            var expected = {'property': [{'@value': 'other'}, {'@value': value}]};
            utilSvc.setPropertyValue(entity, prop, value);
            expect(entity).toEqual(expected);
        });
    });
    it('should test whether an entity has a property value', function() {
        var prop = 'property';
        var value = {'@value': 'value'};
        expect(utilSvc.hasPropertyValue({}, prop, value['@value'])).toEqual(false);
        expect(utilSvc.hasPropertyValue({'property': [value]}, prop, value['@value'])).toEqual(true);
    });
    it('should remove a property value from an entity', function() {
        var prop = 'property';
        var value = {'@value': 'value'};
        var other = {'@value': 'other'};
        var entity = {'property': [value, other]};
        utilSvc.removePropertyValue(entity, prop, value['@value']);
        expect(entity[prop]).not.toContain(value);
        utilSvc.removePropertyValue(entity, prop, other['@value']);
        expect(_.has(entity, prop)).toEqual(false);
    });
    describe('should get a property id value from an entity', function() {
        var prop = 'property';
        it('if it contains the property', function() {
            var entity = {'property': [{'@id': 'id'}]};
            expect(utilSvc.getPropertyId(entity, prop)).toBe('id');
        });
        it('if it does not contain the property', function() {
            expect(utilSvc.getPropertyId({}, prop)).toBe('');
        });
    });
    describe('should set a property id value for an entity', function() {
        var prop = 'property', id = 'id';
        it('when not there', function() {
            var entity = {};
            var expected = {'property': [{'@id': id}]};
            utilSvc.setPropertyId(entity, prop, id);
            expect(entity).toEqual(expected);
        });
        it('when there', function() {
            var entity = {'property': [{'@id': 'otherId'}]};
            var expected = {'property': [{'@id': 'otherId'}, {'@id': id}]};
            utilSvc.setPropertyId(entity, prop, id);
            expect(entity).toEqual(expected);
        });
    });
    it('should test whether an entity has a property id value', function() {
        var prop = 'property';
        var value = {'@id': 'id'};
        expect(utilSvc.hasPropertyId({}, prop, value['@id'])).toEqual(false);
        expect(utilSvc.hasPropertyId({'property': [value]}, prop, value['@id'])).toEqual(true);
    });
    it('should remove a property id value from an entity', function() {
        var prop = 'property';
        var value = {'@id': 'id'};
        var other = {'@id': 'other'};
        var entity = {'property': [value, other]};
        utilSvc.removePropertyId(entity, prop, value['@id']);
        expect(entity[prop]).not.toContain(value);
        utilSvc.removePropertyId(entity, prop, other['@id']);
        expect(_.has(entity, prop)).toEqual(false);
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
        expect(toastr.error).toHaveBeenCalledWith('Text', 'Error', {timeOut: 3000});
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
        describe('if an id is provided', function() {
            var id = 'id';
            it('and the call succeeds', function() {
                httpSvc.get.and.returnValue($q.when({}))
                utilSvc.getResultsPage('/test', undefined, id).then(function(response) {
                    expect(httpSvc.get).toHaveBeenCalledWith('/test', undefined, id);
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
                scope.$apply();
            });
            describe('and the call fails', function() {
                var failFunction;
                beforeEach(function() {
                    failFunction = jasmine.createSpy('failFunction').and.returnValue($q.reject('Test'));
                    httpSvc.get.and.returnValue($q.reject({}))
                });
                it('with a passed error function', function() {
                    utilSvc.getResultsPage('/test', failFunction, id).then(function(response) {
                        fail('Promise should have rejected.');
                    }, function(response) {
                        expect(httpSvc.get).toHaveBeenCalledWith('/test', undefined, id);
                        expect(failFunction).toHaveBeenCalled();
                        expect(response).toBe('Test');
                    });
                    scope.$apply();
                });
                it('with a default error function', function() {
                    spyOn(utilSvc, 'getErrorMessage').and.returnValue('Test');
                    utilSvc.getResultsPage('/test', undefined, id).then(function(response) {
                        fail('Promise should have rejected.');
                    }, function(response) {
                        expect(httpSvc.get).toHaveBeenCalledWith('/test', undefined, id);
                        expect(utilSvc.getErrorMessage).toHaveBeenCalled();
                        expect(response).toBe('Test');
                    });
                    scope.$apply();
                });
            });
        });
        describe('if id is not provided', function() {
            it('and the call succeeds', function() {
                $httpBackend.whenGET('/test').respond(200);
                utilSvc.getResultsPage('/test').then(function(response) {
                    expect(_.isObject(response)).toBe(true);
                }, function(response) {
                    fail('Promise should have resolved');
                });
                flushAndVerify($httpBackend);
            });
            describe('and the call fails', function() {
                var failFunction;
                beforeEach(function() {
                    failFunction = jasmine.createSpy('failFunction').and.returnValue($q.reject('Test'));
                    $httpBackend.whenGET('/test').respond(400);
                });
                it('with a passed error function', function() {
                    utilSvc.getResultsPage('/test', failFunction).then(function(response) {
                        fail('Promise should have rejected.');
                    }, function(response) {
                        expect(failFunction).toHaveBeenCalled();
                        expect(response).toBe('Test');
                    });
                    flushAndVerify($httpBackend);
                });
                it('with a default error function', function() {
                    spyOn(utilSvc, 'getErrorMessage').and.returnValue('Test');
                    utilSvc.getResultsPage('/test').then(function(response) {
                        fail('Promise should have rejected.');
                    }, function(response) {
                        expect(utilSvc.getErrorMessage).toHaveBeenCalled();
                        expect(response).toBe('Test');
                    });
                    flushAndVerify($httpBackend);
                });
            });
        });
    });
    describe('should reject a deferred promise with an error message', function() {
        var deferred;
        beforeEach(function() {
            deferred = $q.defer();
            spyOn(utilSvc, 'getErrorMessage').and.returnValue('Test');
        });
        it('unless the response was canceled', function() {
            utilSvc.onError({status: -1}, deferred, 'Test');
            deferred.promise.then(function() {
                fail('Promise should have rejected.');
            }, function(error) {
                expect(error).toBe('');
                expect(utilSvc.getErrorMessage).not.toHaveBeenCalled();
            });
            scope.$apply();
        });
        it('successfully', function() {
            utilSvc.onError({}, deferred, 'Test');
            deferred.promise.then(function() {
                fail('Promise should have rejected.');
            }, function(error) {
                expect(error).toBe('Test');
                expect(utilSvc.getErrorMessage).toHaveBeenCalledWith({}, 'Test');
            });
            scope.$apply();
        });
    });
    describe('should create a rejected promise with an error message', function() {
        beforeEach(function() {
            spyOn(utilSvc, 'getErrorMessage').and.returnValue('Test');
        });
        it('unless the response was canceled', function() {
            utilSvc.rejectError({status: -1}, 'Test').then(function() {
                fail('Promise should have rejected.');
            }, function(error) {
                expect(error).toBe('');
                expect(utilSvc.getErrorMessage).not.toHaveBeenCalled();
            });
            scope.$apply();
        });
        it('successfully', function() {
            utilSvc.rejectError({}, 'Test').then(function() {
                fail('Promise should have rejected.');
            }, function(error) {
                expect(error).toBe('Test');
                expect(utilSvc.getErrorMessage).toHaveBeenCalledWith({}, 'Test');
            });
            scope.$apply();
        });
    });
    it('should retrieve an error message from a http response', function() {
        expect(utilSvc.getErrorMessage({}, 'default')).toBe('default');
        expect(utilSvc.getErrorMessage({})).toBe('Something went wrong. Please try again later.');
        expect(utilSvc.getErrorMessage({statusText: ''})).toBe('Something went wrong. Please try again later.');
        expect(utilSvc.getErrorMessage({statusText: 'Test'})).toBe('Test');
    });
    it('should get correct statement predicates and objects for the provided id and array', function() {
        var array = [{
            '@id': 'id',
            prop1: 'value1',
            prop2: 'value2'
        }, {
            '@id': 'different',
            prop3: 'value3',
            prop4: 'value4'
        }];
        var expected = [{
            p: 'prop1', o: 'value1'
        }, {
            p: 'prop2', o: 'value2'
        }];
        expect(utilSvc.getChangesById('id', array)).toEqual(expected);
    });
    it("should return the localname of the split IRI for the provided object's p property", function() {
        splitIRIFilter.and.returnValue({end: 'localname'});
        expect(utilSvc.getPredicateLocalName({p: 'predicate'})).toBe('localname');
        expect(splitIRIFilter).toHaveBeenCalledWith('predicate');
        utilSvc.getPredicateLocalName();
        expect(splitIRIFilter).toHaveBeenCalledWith('');
    });
    it('create a unique IRI for a blank node.', function() {
        var result = _.startsWith(utilSvc.getIdForBlankNode(), '_:mobi-bnode-');
        expect(result).toBe(true);
        expect(uuid.v4).toHaveBeenCalled();
    });
    it('getSkolemizedIRI should create the correct type of string', function() {
        expect(_.startsWith(utilSvc.getSkolemizedIRI(), 'http://mobi.com/.well-known/genid/')).toBe(true);
        expect(uuid.v4).toHaveBeenCalled();
    });
    it('getInputType should return the proper input type based on datatype', function() {
        _.forEach([0, 1], function(id) {
            expect(utilSvc.getInputType(properties[id])).toBe('datetime-local');
        });
        _.forEach([2, 3, 4, 5, 6, 7, 8, 10], function(id) {
            expect(utilSvc.getInputType(properties[id])).toBe('number');
        });
        expect(utilSvc.getInputType(properties[9])).toBe('text');
    });
    it('getPattern should return the proper REGEX based on datatype', function() {
        _.forEach([0, 1], function(id) {
            expect(utilSvc.getPattern(properties[id])).toBe(regex.DATETIME);
        });
        _.forEach([2, 3, 4], function(id) {
            expect(utilSvc.getPattern(properties[id])).toBe(regex.DECIMAL);
        });
        _.forEach([5, 6, 7, 8, 10], function(id) {
            expect(utilSvc.getPattern(properties[id])).toBe(regex.INTEGER);
        });
        expect(utilSvc.getPattern(properties[9])).toBe(regex.ANYTHING);
    });
});
