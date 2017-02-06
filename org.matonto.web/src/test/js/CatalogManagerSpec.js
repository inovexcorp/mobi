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
        $q,
        windowSvc,
        catalogId = 'http://matonto.org/catalogs/local',
        recordId = 'http://matonto.org/records/test',
        distributionId = 'http://matonto.org/distributions/test',
        versionId = 'http://matonto.org/versions/test',
        branchId = 'http://matonto.org/branches/test',
        commitId = 'http://matonto.org/commits/test';

    beforeEach(function() {
        module('catalogManager');
        mockPrefixes();
        mockUtil();

        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
        });

        inject(function(catalogManagerService, _prefixes_, _utilService_, _$httpBackend_, _$httpParamSerializer_, _$q_, _$window_) {
            catalogManagerSvc = catalogManagerService;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
            windowSvc = _$window_;
        });
    });

    describe('should set the correct initial state', function() {
        it('unless an error occurs', function(done) {
            spyOn(catalogManagerSvc, 'getRecordTypes').and.returnValue($q.reject());
            spyOn(catalogManagerSvc, 'getSortOptions').and.returnValue($q.reject());
            $httpBackend.whenGET('/matontorest/catalogs').respond(400, '');
            catalogManagerSvc.initialize().then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
        describe('successfully', function() {
            beforeEach(function() {
                this.types = ['type1', 'type2'];
                this.sortOptions = ['sort1', 'sort2'];
                spyOn(catalogManagerSvc, 'getRecordTypes').and.returnValue($q.when(this.types));
                spyOn(catalogManagerSvc, 'getSortOptions').and.returnValue($q.when(this.sortOptions));
            });
            it('unless a catalog cannot be found', function(done) {
                $httpBackend.whenGET('/matontorest/catalogs').respond(200, []);
                catalogManagerSvc.initialize().then(function(response) {
                    fail('Promise should have rejected');
                    done();
                }, function(error) {
                    expect(error).toContain('Could not find');
                    done();
                });
                $httpBackend.flush();
            });
            it('with all important data', function(done) {
                var types = this.types;
                var sortOptions = this.sortOptions;
                var localCatalog = {};
                localCatalog[prefixes.dcterms + 'title'] = [{'@value': 'MatOnto Catalog (Local)'}];
                var distributedCatalog = {};
                distributedCatalog[prefixes.dcterms + 'title'] = [{'@value': 'MatOnto Catalog (Distributed)'}];
                $httpBackend.whenGET('/matontorest/catalogs').respond(200, [localCatalog, distributedCatalog]);
                catalogManagerSvc.initialize().then(function(response) {
                    expect(catalogManagerSvc.recordTypes).toEqual(types);
                    expect(catalogManagerSvc.localCatalog).toEqual(localCatalog);
                    expect(catalogManagerSvc.distributedCatalog).toEqual(distributedCatalog);
                    expect(catalogManagerSvc.sortOptions.length).toEqual(sortOptions.length * 2);
                    _.forEach(sortOptions, function(option) {
                        expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: true})).not.toBeUndefined();
                        expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: false})).not.toBeUndefined();
                    });
                    done();
                });
                $httpBackend.flush();
            });
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
            this.config = {
                limit: 10,
                pageIndex: 0,
                sortOption: {
                    field: 'http://purl.org/dc/terms/title',
                    asc: true
                },
                recordType: prefixes.catalog + 'Record',
                searchText: 'Text'
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title'}];
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                searchText: this.config.searchText,
                sort: this.config.sortOption.field,
                type: this.config.recordType
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecords(catalogId, this.config).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with all config passed', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                searchText: this.config.searchText,
                sort: this.config.sortOption.field,
                type: this.config.recordType
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records?' + params).respond(200, []);
            catalogManagerSvc.getRecords(catalogId, this.config).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('without any config', function(done) {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records?' + params).respond(200, []);
            catalogManagerSvc.getRecords(catalogId, {}).then(function(response) {
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
            this.config = {
                limit: 10,
                pageIndex: 0,
                sortOption: {
                    field: 'http://purl.org/dc/terms/title',
                    asc: true
                }
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title'}];
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, this.config).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with all config passed', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions?' + params).respond(200, []);
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, this.config).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('without any config passed', function(done) {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions?' + params).respond(200, []);
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, {}).then(function(response) {
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
    describe('should create a new Record Distribution', function() {
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
    describe('should retrieve a list of Record Versions', function() {
        beforeEach(function(){
            this.config = {
                limit: 10,
                pageIndex: 0,
                sortOption: {
                    field: 'http://purl.org/dc/terms/title',
                    asc: true
                }
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title'}];
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordVersions(recordId, catalogId, this.config).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with all config passed', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions?' + params).respond(200, []);
            catalogManagerSvc.getRecordVersions(recordId, catalogId, this.config).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('without any config', function(done) {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions?' + params).respond(200, []);
            catalogManagerSvc.getRecordVersions(recordId, catalogId, {}).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve the latest Record Version', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/latest').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordLatestVersion(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/latest').respond(200, {});
            catalogManagerSvc.getRecordLatestVersion(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a Record Version', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordVersion(versionId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId)).respond(200, {});
            catalogManagerSvc.getRecordVersion(versionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new Version', function() {
        beforeEach(function() {
            this.versionConfig = {
                title: 'Title',
                description: 'Description'
            };
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.createRecordVersion(recordId, catalogId, this.versionConfig).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a description', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordVersion(recordId, catalogId, this.versionConfig).then(function(response) {
                expect(response).toBe(versionId);
                done();
            });
            $httpBackend.flush();
        });
        it('without a description', function(done) {
            delete this.versionConfig.description;
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordVersion(recordId, catalogId, this.versionConfig).then(function(response) {
                expect(response).toBe(versionId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new Tag', function() {
        beforeEach(function() {
            this.versionConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.version = {'@id': versionId};
            spyOn(catalogManagerSvc, 'getRecordVersion').and.returnValue($q.when(this.version));
            spyOn(catalogManagerSvc, 'updateRecordVersion').and.returnValue($q.when(versionId));
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.createRecordTag(recordId, catalogId, this.versionConfig, commitId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a description', function(done) {
            var expectedVersion = angular.copy(this.version);
            expectedVersion[prefixes.catalog + 'commit'] = [{'@id': commitId}];
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordTag(recordId, catalogId, this.versionConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId, expectedVersion);
                expect(response).toBe(versionId);
                done();
            });
            $httpBackend.flush();
        });
        it('without a description', function(done) {
            delete this.versionConfig.description;
            var expectedVersion = angular.copy(this.version);
            expectedVersion[prefixes.catalog + 'commit'] = [{'@id': commitId}];
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordTag(recordId, catalogId, this.versionConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId, expectedVersion);
                expect(response).toBe(versionId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a Record Version', function() {
        beforeEach(function() {
            this.newVersion = {};
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId), this.newVersion).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.updateRecordVersion(versionId, recordId, catalogId, this.newVersion).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId), this.newVersion).respond(200);
            catalogManagerSvc.updateRecordVersion(versionId, recordId, catalogId, this.newVersion).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a Record Version', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.deleteRecordVersion(versionId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId)).respond(200);
            catalogManagerSvc.deleteRecordVersion(versionId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve the Commit of a Version', function() {
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/commit?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getVersionCommit(versionId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a format', function(done) {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/commit?' + params).respond(200, {});
            catalogManagerSvc.getVersionCommit(versionId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
        it('without a format', function(done) {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/commit?' + params).respond(200, {});
            catalogManagerSvc.getVersionCommit(versionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a list of Version Distributions', function() {
        beforeEach(function(){
            this.config = {
                limit: 10,
                pageIndex: 0,
                sortOption: {
                    field: 'http://purl.org/dc/terms/title',
                    asc: true
                }
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title'}];
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getVersionDistributions(versionId, recordId, catalogId, this.config).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with all config passed', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions?' + params).respond(200, []);
            catalogManagerSvc.getVersionDistributions(versionId, recordId, catalogId, this.config).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('without any config', function(done) {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions?' + params).respond(200, []);
            catalogManagerSvc.getVersionDistributions(versionId, recordId, catalogId, {}).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a Version Distribution', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getVersionDistribution(distributionId, versionId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId)).respond(200, {});
            catalogManagerSvc.getVersionDistribution(distributionId, versionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new Version Distribution', function() {
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
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.createVersionDistribution(versionId, recordId, catalogId, this.distributionConfig).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a description, format, access URL, and download URL', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createVersionDistribution(versionId, recordId, catalogId, this.distributionConfig).then(function(response) {
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
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createVersionDistribution(versionId, recordId, catalogId, this.distributionConfig).then(function(response) {
                expect(response).toBe(distributionId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a Version Distribution', function() {
        beforeEach(function() {
            this.newDistribution = {};
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId), this.newDistribution).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.updateVersionDistribution(distributionId, versionId, recordId, catalogId, this.newDistribution).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId), this.newDistribution).respond(200);
            catalogManagerSvc.updateVersionDistribution(distributionId, versionId, recordId, catalogId, this.newDistribution).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a Version Distribution', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.deleteVersionDistribution(distributionId, versionId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId)).respond(200);
            catalogManagerSvc.deleteVersionDistribution(distributionId, versionId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a list of Record Branches', function() {
        beforeEach(function(){
            this.config = {
                limit: 10,
                pageIndex: 0,
                sortOption: {
                    field: 'http://purl.org/dc/terms/title',
                    asc: true
                }
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title'}];
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordBranches(recordId, catalogId, this.config).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with all config passed', function(done) {
            var params = $httpParamSerializer({
                ascending: this.config.sortOption.asc,
                limit: this.config.limit,
                offset: this.config.pageIndex * this.config.limit,
                sort: this.config.sortOption.field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches?' + params).respond(200, []);
            catalogManagerSvc.getRecordBranches(recordId, catalogId, this.config).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('without any config', function(done) {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches?' + params).respond(200, []);
            catalogManagerSvc.getRecordBranches(recordId, catalogId, {}).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve the master Branch of a Record', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/master').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordMasterBranch(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/master').respond(200, {});
            catalogManagerSvc.getRecordMasterBranch(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a Record Branch', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getRecordBranch(branchId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId)).respond(200, {});
            catalogManagerSvc.getRecordBranch(branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new Branch', function() {
        beforeEach(function() {
            this.branchConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.branch = {'@id': branchId};
            spyOn(catalogManagerSvc, 'getRecordBranch').and.returnValue($q.when(this.branch));
            spyOn(catalogManagerSvc, 'updateRecordBranch').and.returnValue($q.when(branchId));
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.createRecordBranch(recordId, catalogId, this.branchConfig, commitId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a description', function(done) {
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordBranch(recordId, catalogId, this.branchConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
                done();
            });
            $httpBackend.flush();
        });
        it('without a description', function(done) {
            delete this.branchConfig.description;
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordBranch(recordId, catalogId, this.branchConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new UserBranch', function() {
        beforeEach(function() {
            this.branchConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.branch = {'@id': branchId};
            spyOn(catalogManagerSvc, 'getRecordBranch').and.returnValue($q.when(this.branch));
            spyOn(catalogManagerSvc, 'updateRecordBranch').and.returnValue($q.when(branchId));
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.createRecordUserBranch(recordId, catalogId, this.branchConfig, commitId, branchId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a description', function(done) {
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            expectedBranch[prefixes.catalog + 'createdFrom'] = [{'@id': branchId}];
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordUserBranch(recordId, catalogId, this.branchConfig, commitId, branchId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
                done();
            });
            $httpBackend.flush();
        });
        it('without a description', function(done) {
            delete this.branchConfig.description;
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            expectedBranch[prefixes.catalog + 'createdFrom'] = [{'@id': branchId}];
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordUserBranch(recordId, catalogId, this.branchConfig, commitId, branchId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a Record Branch', function() {
        beforeEach(function() {
            this.newBranch = {};
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId), this.newBranch).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.updateRecordBranch(branchId, recordId, catalogId, this.newBranch).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.expectPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId), this.newBranch).respond(200);
            catalogManagerSvc.updateRecordBranch(branchId, recordId, catalogId, this.newBranch).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a Record Branch', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId)).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.deleteRecordBranch(branchId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId)).respond(200);
            catalogManagerSvc.deleteRecordBranch(branchId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve Branch Commits', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getBranchCommits(branchId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits').respond(200, []);
            catalogManagerSvc.getBranchCommits(branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new commit on a Branch', function() {
        beforeEach(function() {
            this.message = 'Message';
        });
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({message: this.message});
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.createBranchCommit(branchId, recordId, catalogId, this.message).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            var params = $httpParamSerializer({message: this.message});
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits?' + params).respond(200, commitId);
            catalogManagerSvc.createBranchCommit(branchId, recordId, catalogId, this.message).then(function(response) {
                expect(response).toBe(commitId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve the head Commit of a Branch', function() {
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/head?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getBranchHeadCommit(branchId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a format', function(done) {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/head?' + params).respond(200, {});
            catalogManagerSvc.getBranchHeadCommit(branchId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
        it('without a format', function(done) {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/head?' + params).respond(200, {});
            catalogManagerSvc.getBranchHeadCommit(branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve a Branch Commit', function() {
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getBranchCommit(commitId, branchId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a format', function(done) {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchCommit(commitId, branchId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
        it('without a format', function(done) {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchCommit(commitId, branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should get the conflicts between two Branches', function() {
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                format: 'jsonld',
                targetId: branchId
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getBranchConflicts(branchId, branchId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a format', function(done) {
            var params = $httpParamSerializer({
                format: 'turtle',
                targetId: branchId
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts?' + params).respond(200, []);
            catalogManagerSvc.getBranchConflicts(branchId, branchId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
        it('with a format', function(done) {
            var params = $httpParamSerializer({
                format: 'jsonld',
                targetId: branchId
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts?' + params).respond(200, []);
            catalogManagerSvc.getBranchConflicts(branchId, branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual([]);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should merge two Branches', function() {
        it('unless an error occurs', function(done) {
            var differenceObj = {};
            var params = $httpParamSerializer({targetId: branchId});
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts/resolution?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.mergeBranches(branchId, branchId, recordId, catalogId, differenceObj).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with additions and deletions', function(done) {
            var differenceObj = {additions: [], deletions: []};
            var params = $httpParamSerializer({targetId: branchId});
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts/resolution?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, commitId);
            catalogManagerSvc.mergeBranches(branchId, branchId, recordId, catalogId, differenceObj).then(function(response) {
                expect(response).toEqual(commitId);
                done();
            });
            $httpBackend.flush();
        });
        it('without additions and deletions', function(done) {
            var differenceObj = {};
            var params = $httpParamSerializer({targetId: branchId});
            $httpBackend.expectPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts/resolution?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, commitId);
            catalogManagerSvc.mergeBranches(branchId, branchId, recordId, catalogId, differenceObj).then(function(response) {
                expect(response).toEqual(commitId);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve the compiled resource from a Branch Commit', function() {
        it('unless an error occurs', function(done) {
            var params = $httpParamSerializer({
                applyInProgressCommit: true,
                format: 'jsonld'
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource?' + params).respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getResource(commitId, branchId, recordId, catalogId, true, 'jsonld').then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a format', function(done) {
            var params = $httpParamSerializer({
                applyInProgressCommit: true,
                format: 'turtle'
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource?' + params).respond(200, '');
            catalogManagerSvc.getResource(commitId, branchId, recordId, catalogId, true, 'turtle').then(function(response) {
                expect(response).toBe('');
                done();
            });
            $httpBackend.flush();
        });
        it('without a format', function(done) {
            var params = $httpParamSerializer({
                applyInProgressCommit: true,
                format: 'jsonld'
            });
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource?' + params).respond(200, '');
            catalogManagerSvc.getResource(commitId, branchId, recordId, catalogId, true).then(function(response) {
                expect(response).toBe('');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should download the compiled resource from a Branch Commit', function() {
        it('with a format', function() {
            catalogManagerSvc.downloadResource(commitId, branchId, recordId, catalogId, true, 'turtle');
            expect(windowSvc.location).toBe('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource?applyInProgressCommit=true&format=turtle');
        });
        it('without a format', function() {
            catalogManagerSvc.downloadResource(commitId, branchId, recordId, catalogId, true);
            expect(windowSvc.location).toBe('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource?applyInProgressCommit=true&format=jsonld');
        });
    });
    describe('should create a new InProgressCommit for the logged-in User', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.createInProgressCommit(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenPOST('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit').respond(200);
            catalogManagerSvc.createInProgressCommit(recordId, catalogId).then(function(response) {
                expect(true).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should retrieve an InProgressCommit for the logged-in User', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.getInProgressCommit(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenGET('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit').respond(200, {});
            catalogManagerSvc.getInProgressCommit(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update an InProgressCommit for the logged-in User', function() {
        it('unless an error occurs', function(done) {
            var differenceObj = {};
            $httpBackend.whenPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit',
                function(data) {
                    return data instanceof FormData;
                }).respond(function(method, url, data, headers) {
                    return [400, '', {}, 'Error Message'];
                });
            catalogManagerSvc.updateInProgressCommit(recordId, catalogId, differenceObj).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with additions and deletions', function(done) {
            var differenceObj = {additions: [], deletions: []};
            $httpBackend.whenPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit',
                function(data) {
                    return data instanceof FormData;
                }).respond(200);
            catalogManagerSvc.updateInProgressCommit(recordId, catalogId, differenceObj).then(function(response) {
                expect(true).toEqual(true);
                done();
            });
            $httpBackend.flush();
        });
        it('without additions and deletions', function(done) {
            var differenceObj = {};
            $httpBackend.whenPUT('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit',
                function(data) {
                    return data instanceof FormData;
                }).respond(200);
            catalogManagerSvc.updateInProgressCommit(recordId, catalogId, differenceObj).then(function(response) {
                expect(true).toEqual(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should remove an InProgressCommit for the logged-in User', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit').respond(function(method, url, data, headers) {
                return [400, '', {}, 'Error Message'];
            });
            catalogManagerSvc.deleteInProgressCommit(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('successfully', function(done) {
            $httpBackend.whenDELETE('/matontorest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit').respond(200);
            catalogManagerSvc.deleteInProgressCommit(recordId, catalogId).then(function(response) {
                expect(true).toEqual(true);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should get an entity name', function() {
        it('if it has a title', function() {
            var title = 'Title';
            utilSvc.getDctermsValue.and.returnValue(title);
            expect(catalogManagerSvc.getEntityName({})).toBe(title);
        });
        it('if it does not have a title', function() {
            expect(catalogManagerSvc.getEntityName({})).toBe('(Anonymous)');
        });
    });
    it('should test whether an entity is a Record', function() {
        var entity = {'@type': []};
        expect(catalogManagerSvc.isRecord(entity)).toBe(false);
        entity['@type'].push(prefixes.catalog + 'Record');
        expect(catalogManagerSvc.isRecord(entity)).toBe(true);
        entity['@type'].push(prefixes.catalog + 'Test');
        expect(catalogManagerSvc.isRecord(entity)).toBe(true);
    });
    it('should test whether an entity is a VersionedRDFRecord', function() {
        var entity = {'@type': []};
        expect(catalogManagerSvc.isVersionedRDFRecord(entity)).toBe(false);
        entity['@type'].push(prefixes.catalog + 'VersionedRDFRecord');
        expect(catalogManagerSvc.isVersionedRDFRecord(entity)).toBe(true);
        entity['@type'].push(prefixes.catalog + 'Test');
        expect(catalogManagerSvc.isVersionedRDFRecord(entity)).toBe(true);
    });
    it('should test whether an entity is a Distribution', function() {
        var entity = {'@type': []};
        expect(catalogManagerSvc.isDistribution(entity)).toBe(false);
        entity['@type'].push(prefixes.catalog + 'Distribution');
        expect(catalogManagerSvc.isDistribution(entity)).toBe(true);
        entity['@type'].push(prefixes.catalog + 'Test');
        expect(catalogManagerSvc.isDistribution(entity)).toBe(true);
    });
    it('should test whether an entity is a Branch', function() {
        var entity = {'@type': []};
        expect(catalogManagerSvc.isBranch(entity)).toBe(false);
        entity['@type'].push(prefixes.catalog + 'Branch');
        expect(catalogManagerSvc.isBranch(entity)).toBe(true);
        entity['@type'].push(prefixes.catalog + 'Test');
        expect(catalogManagerSvc.isBranch(entity)).toBe(true);
    });
    it('should test whether an entity is a Version', function() {
        var entity = {'@type': []};
        expect(catalogManagerSvc.isVersion(entity)).toBe(false);
        entity['@type'].push(prefixes.catalog + 'Version');
        expect(catalogManagerSvc.isVersion(entity)).toBe(true);
        entity['@type'].push(prefixes.catalog + 'Test');
        expect(catalogManagerSvc.isVersion(entity)).toBe(true);
    });
});