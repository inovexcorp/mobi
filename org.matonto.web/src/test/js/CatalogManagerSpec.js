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
describe('Catalog Manager service', function() {
    var $httpBackend,
        catalogManagerSvc;

    beforeEach(function() {
        module('catalogManager');
        mockPrefixes();

        inject(function(catalogManagerService, _$httpBackend_) {
            catalogManagerSvc = catalogManagerService;
            $httpBackend = _$httpBackend_;
        });
    });

    it('should set the correct initial state for resource filters', function() {
        var types = ['type1', 'type2'];
        $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, types);
        $httpBackend.flush();
        expect(catalogManagerSvc.filters.Resources.length).toBe(types.length);
        _.forEach(catalogManagerSvc.filters.Resources, function(filter, idx) {
            expect(filter.value).toBe(types[idx]);
        });
    });
    it('should get the IRIs for all resource types', function(done) {
        $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, []);
        catalogManagerSvc.getResourceTypes().then(function(value) {
            expect(value).toEqual([]);
            done();
        });
        $httpBackend.flush();
    });
    it('should get the IRIs for all sort options', function(done) {
        $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, []);
        $httpBackend.whenGET('/matontorest/catalog/sort-options').respond(200, []);
        catalogManagerSvc.getSortOptions().then(function(value) {
            expect(value).toEqual([]);
            done();
        });
        $httpBackend.flush();
    });
    describe('should retrieve resources', function() {
        it('unless there is an error', function() {
            $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, []);
            $httpBackend.flush();
            var params = createQueryString({
                asc: catalogManagerSvc.asc,
                limit: 10,
                sortBy: catalogManagerSvc.sortBy,
                start: 0
            });
            $httpBackend.expectGET('/matontorest/catalog/resources' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResources();
            $httpBackend.flush();
            expect(catalogManagerSvc.errorMessage).toBe('Error Message');
        });
        it('with the set parameters', function() {
            $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, ['test1']);
            $httpBackend.flush();
            catalogManagerSvc.filters.Resources[0].applied = true;
            var params = createQueryString({
                asc: catalogManagerSvc.asc,
                limit: 10,
                sortBy: catalogManagerSvc.sortBy,
                start: 0,
                type: 'test1'
            });
            var results = {limit: 10, results: [], links: {}, size: 0, start: 0, totalSize: 0};
            $httpBackend.expectGET('/matontorest/catalog/resources' + params).respond(200, results);
            catalogManagerSvc.getResources();
            $httpBackend.flush();
            expect(catalogManagerSvc.results).toEqual(results);
        });
    });
    describe('should get a page of resources based on the passed URL', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, []);
            $httpBackend.flush();
        });
        it('unless there is an error', function() {
            var url = 'matontorest/catalog/resources';
            $httpBackend.expectGET(url).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResultsPage(url);
            $httpBackend.flush();
            expect(catalogManagerSvc.errorMessage).toBe('Error Message');
        });
        it('successfully', function() {
            var url = 'matontorest/catalog/resources';
            var results = {limit: 10, results: [], links: {}, size: 0, start: 0, totalSize: 0};
            $httpBackend.expectGET(url).respond(200, results);
            catalogManagerSvc.getResultsPage(url);
            $httpBackend.flush();
            expect(catalogManagerSvc.results).toEqual(results);
        });
    });
    describe('should retrieve a resource by id', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, []);
            $httpBackend.flush();
        });
        it('unless it does not exist', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id)).respond(204, '');
            catalogManagerSvc.getResource(id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Resource does not exist');
                done();
            });
            $httpBackend.flush();
        });
        it('unless something went wrong', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id)).respond(206, '');
            catalogManagerSvc.getResource(id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('An error has occurred');
                done();
            });
            $httpBackend.flush();
        });
        it('unless an error occured', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResource(id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id)).respond(200, {});
            catalogManagerSvc.getResource(id).then(function(response) {
                expect(response).toEqual({});
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve the distributions of a resource by id', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, []);
            $httpBackend.flush();
        });
        it('unless it does not exist', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id) + '/distributions').respond(204, '');
            catalogManagerSvc.getResourceDistributions(id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Resource does not exist');
                done();
            });
            $httpBackend.flush();
        });
        it('unless something went wrong', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id) + '/distributions').respond(206, '');
            catalogManagerSvc.getResourceDistributions(id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('An error has occurred');
                done();
            });
            $httpBackend.flush();
        });
        it('unless an error occured', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id) + '/distributions').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResourceDistributions(id).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var id = 'http://matonto.org/resourceid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(id) + '/distributions').respond(200, []);
            catalogManagerSvc.getResourceDistributions(id).then(function(response) {
                expect(response).toEqual([]);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a distribution of a resource by ids', function() {
        beforeEach(function() {
            $httpBackend.whenGET('/matontorest/catalog/resource-types').respond(200, []);
            $httpBackend.flush();
        });
        it('unless it does not exist', function(done) {
            var resourceId = 'http://matonto.org/resourceid';
            var distributionId = 'http://matonto.org/distributionid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(resourceId) 
                + '/distributions/' + encodeURIComponent(distributionId)).respond(204, '');
            catalogManagerSvc.getResourceDistribution(resourceId, distributionId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Resource and/or distribution does not exist');
                done();
            });
            $httpBackend.flush();
        });
        it('unless an error occured', function(done) {
            var resourceId = 'http://matonto.org/resourceid';
            var distributionId = 'http://matonto.org/distributionid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(resourceId) 
                + '/distributions/' + encodeURIComponent(distributionId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResourceDistribution(resourceId, distributionId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var resourceId = 'http://matonto.org/resourceid';
            var distributionId = 'http://matonto.org/distributionid';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(resourceId) 
                + '/distributions/' + encodeURIComponent(distributionId)).respond(200, {});
            catalogManagerSvc.getResourceDistribution(resourceId, distributionId).then(function(response) {
                expect(response).toEqual({});
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should get the name of a resource type', function() {
        var result = catalogManagerSvc.getType('type');
        expect(typeof result).toBe('string');

        var result = catalogManagerSvc.getType({});
        expect(typeof result).toBe('string');
        expect(result).toBe('');
    });
    describe('should create a Date object for a resource or distribution date', function() {
        it('unless passed something other than an object', function() {
            var tests = ['', undefined, null, 0, false];
            _.forEach(tests, function(test) {
                expect(catalogManagerSvc.getDate(test)).toBe(undefined);
            });
        });
        it('if passed a valid object', function() {
            var date = {
                year: 2000,
                month: 1,
                day: 1,
                hour: 1,
                minute: 1,
                second: 1
            };
            var result = catalogManagerSvc.getDate(date);
            expect(result instanceof Date).toBe(true);
            expect(result.getFullYear()).toBe(date.year);
            expect(result.getMonth()).toBe(date.month - 1);
            expect(result.getDate()).toBe(date.day);
            expect(result.getHours()).toBe(date.hour);
            expect(result.getMinutes()).toBe(date.minute);
            expect(result.getSeconds()).toBe(date.second);
        });
        
    });
});