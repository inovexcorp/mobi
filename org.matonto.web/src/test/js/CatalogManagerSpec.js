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
        catalogManagerSvc,
        prefixes,
        utilSvc,
        catalogId = 'http://matonto.org/catalogs/local',
        recordId = 'http://matonto.org/records/test',
        distributionId = 'http://matonto.org/distributions/test',
        versionid = 'http://matonto.org/versions/test',
        branchId = 'http://matonto.org/branches/test';

    beforeEach(function() {
        module('catalogManager');
        mockPrefixes();
        mockUtil();

        inject(function(catalogManagerService, _$httpBackend_, _$httpParamSerializer_, _prefixes_) {
            catalogManagerSvc = catalogManagerService;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            prefixes = _prefixes_;
        });

    });

    it('should set the correct initial state', function() {
        var types = ['type1', 'type2'];
        var sortOptions = ['sort1', 'sort2'];
        var localCatalog = {};
        localCatalog[prefixes.dcterms + 'title'] = [{'@value': 'MatOnto Catalog (Local)'}];
        var distributedCatalog = {};
        distributedCatalog[prefixes.dcterms + 'title'] = [{'@value': 'MatOnto Catalog (Distributed)'}];
        $httpBackend.whenGET('/matontorest/catalogs/record-types').respond(200, types);
        $httpBackend.whenGET('/matontorest/catalogs/sort-options').respond(200, sortOptions);
        $httpBackend.whenGET('/matontorest/catalogs').respond(200, [localCatalog, distributedCatalog]);
        catalogManagerSvc.initialize();
        $httpBackend.flush();
        expect(catalogManagerSvc.recordTypes).toEqual(types);
        expect(catalogManagerSvc.localCatalog).toEqual(localCatalog);
        expect(catalogManagerSvc.distributedCatalog).toEqual(distributedCatalog);
        expect(catalogManagerSvc.sortOptions.length).toEqual(sortOptions.length * 2);
        _.forEach(sortOptions, function(option) {
            expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: true})).not.toBeUndefined();
            expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: false})).not.toBeUndefined();
        });
    });
    it('should get the IRIs for all record types', function(done) {
        $httpBackend.whenGET('/matontorest/catalogs/record-types').respond(200, []);
        catalogManagerSvc.getRecordTypes().then(function(value) {
            expect(value).toEqual([]);
            done();
        });
        $httpBackend.flush();
    });
    it('should get the IRIs for all sort options', function(done) {
        $httpBackend.whenGET('/matontorest/catalogs/sort-options').respond(200, []);
        catalogManagerSvc.getSortOptions().then(function(value) {
            expect(value).toEqual([]);
            done();
        });
        $httpBackend.flush();
    });
    describe('should get a page of results based on the passed URL', function() {
        beforeEach(function() {
            this.url = 'matontorest/catalogs/local/records';
        });
        it('unless there is an error', function(done) {
            $httpBackend.expectGET(this.url).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResultsPage(this.url).then(function(response) {
                fail('Promise should have rejected');
                done();
            },function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectGET(this.url).respond(200, []);
            catalogManagerSvc.getResultsPage(this.url).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a list of Records', function() {
        beforeEach(function(){
            this.limit = 10;
            this.currentPage = 0;
            this.sortOption = {
                field: 'http://purl.org/dc/terms/title',
                asc: true
            };
            this.type = prefixes.catalog + 'Record';
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * 10,
                sort: this.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecords(catalogId, this.currentPage, this.limit, this.sortOption, '').then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a type filter', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * this.limit,
                sort: this.sortOption.field,
                type: this.type
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records?' + params).respond(200, []);
            catalogManagerSvc.getRecords(catalogId, this.currentPage, this.limit, this.sortOption, this.type).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('without a type filter', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * this.limit,
                sort: this.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records?' + params).respond(200, []);
            catalogManagerSvc.getRecords(catalogId, this.currentPage, this.limit, this.sortOption, '').then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a Record', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecord(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId)).respond(200, {});
            catalogManagerSvc.getRecord(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new Record', function() {
        beforeEach(function() {
            this.recordConfig = {
                type: prefixes.catalog + 'Record',
                title: 'Title',
                identifier: 'id',
                description: 'Description',
                keywords: ['keyword0', 'keyword1']
            };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.createRecord(catalogId, this.recordConfig).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a description and keywords', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, recordId);
            catalogManagerSvc.createRecord(catalogId, this.recordConfig).then(function(response) {
                expect(response).toBe(recordId);
                done();
            });
            $httpBackend.flush();
        });
        it('without a description or keywords', function(done) {
            delete this.recordConfig.description;
            delete this.recordConfig.keywords;
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, recordId);
            catalogManagerSvc.createRecord(catalogId, this.recordConfig).then(function(response) {
                expect(response).toBe(recordId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a Record', function() {
        beforeEach(function() {
            this.newRecord = {};
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId), this.newRecord).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.updateRecord(recordId, catalogId, this.newRecord).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId), this.newRecord).respond(200);
            catalogManagerSvc.updateRecord(recordId, catalogId, this.newRecord).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a Record', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.deleteRecord(recordId, catalogId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId)).respond(200);
            catalogManagerSvc.deleteRecord(recordId, catalogId).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a list of Record Distributions', function() {
        beforeEach(function(){
            this.limit = 10;
            this.currentPage = 0;
            this.sortOption = {
                field: 'http://purl.org/dc/terms/title',
                asc: true
            };
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * 10,
                sort: this.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, this.currentPage, this.limit, this.sortOption).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var params = $httpParamSerializer({
                asc: this.sortOption.asc,
                limit: this.limit,
                offset: this.currentPage * 10,
                sort: this.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions?' + params).respond(200, []);
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, this.currentPage, this.limit, this.sortOption).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a Record Distribution', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordDistribution(distributionId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId)).respond(200, {});
            catalogManagerSvc.getRecordDistribution(distributionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new Record', function() {
        beforeEach(function() {
            this.distributionConfig = {
                title: 'Title',
                description: 'Description',
                format: 'text/plain',
                accessURL: 'http://example.com/access',
                downloadURL: 'http://example.com/download',
            };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.createRecordDistribution(recordId, catalogId, this.distributionConfig).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a description, format, access URL, and download URL', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createRecordDistribution(recordId, catalogId, this.distributionConfig).then(function(response) {
                expect(response).toBe(distributionId);
                done();
            });
            $httpBackend.flush();
        });
        it('without a description, format, access URL, or download URL', function(done) {
            delete this.distributionConfig.description;
            delete this.distributionConfig.format;
            delete this.distributionConfig.accessURL;
            delete this.distributionConfig.downloadURL;
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createRecordDistribution(recordId, catalogId, this.distributionConfig).then(function(response) {
                expect(response).toBe(distributionId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a Record Distribution', function() {
        beforeEach(function() {
            this.newDistribution = {};
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId), this.newDistribution).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.updateRecordDistribution(distributionId, recordId, catalogId, this.newDistribution).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId), this.newDistribution).respond(200);
            catalogManagerSvc.updateRecordDistribution(distributionId, recordId, catalogId, this.newDistribution).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a Record Distribution', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.deleteRecordDistribution(distributionId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId)).respond(200);
            catalogManagerSvc.deleteRecordDistribution(distributionId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
});