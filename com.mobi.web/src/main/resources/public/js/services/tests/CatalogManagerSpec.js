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
describe('Catalog Manager service', function() {
    var catalogManagerSvc, scope, $httpBackend, prefixes, utilSvc, $q, httpSvc, $httpParamSerializer;

    beforeEach(function() {
        module('catalogManager');
        mockPrefixes();
        mockUtil();
        mockHttpService();
        injectRestPathConstant();

        inject(function(catalogManagerService, _$rootScope_, _$httpBackend_, _prefixes_, _utilService_, _$q_, _httpService_, _$httpParamSerializer_) {
            catalogManagerSvc = catalogManagerService;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            $q = _$q_;
            httpSvc = _httpService_;
            $httpParamSerializer = _$httpParamSerializer_;
        });

        this.catalogId = 'http://mobi.com/catalogs/local';
        this.recordId = 'http://mobi.com/records/test';
        this.distributionId = 'http://mobi.com/distributions/test';
        this.versionId = 'http://mobi.com/versions/test';
        this.branchId = 'http://mobi.com/branches/test';
        this.commitId = 'http://mobi.com/commits/test';

        utilSvc.paginatedConfigToParams.and.callFake(_.identity);
        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    afterEach(function() {
        catalogManagerSvc = null;
        scope = null;
        $httpBackend = null;
        prefixes = null;
        utilSvc = null;
        $q = null;
        httpSvc = null;
        $httpParamSerializer = null;
    });

    describe('should set the correct initial state', function() {
        it('unless an error occurs', function() {
            spyOn(catalogManagerSvc, 'getRecordTypes').and.returnValue($q.reject());
            spyOn(catalogManagerSvc, 'getSortOptions').and.returnValue($q.reject());
            $httpBackend.whenGET('/mobirest/catalogs').respond(400, '');
            catalogManagerSvc.initialize()
                .then(function(response) {
                    fail('Promise should have rejected');
                });
            flushAndVerify($httpBackend);
            expect(catalogManagerSvc.recordTypes).toEqual([]);
            expect(catalogManagerSvc.localCatalog).toBeUndefined();
            expect(catalogManagerSvc.distributedCatalog).toBeUndefined();
            expect(catalogManagerSvc.sortOptions).toEqual([]);
        });
        describe('successfully', function() {
            beforeEach(function() {
                this.types = ['type1', 'type2'];
                this.sortOptions = ['sort1', 'sort2'];
                spyOn(catalogManagerSvc, 'getRecordTypes').and.returnValue($q.when(this.types));
                spyOn(catalogManagerSvc, 'getSortOptions').and.returnValue($q.when(this.sortOptions));
            });
            it('unless a catalog cannot be found', function() {
                $httpBackend.whenGET('/mobirest/catalogs').respond(200, []);
                catalogManagerSvc.initialize()
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(error) {
                        expect(error).toContain('Could not find');
                    });
                flushAndVerify($httpBackend);
            });
            it('with all important data', function() {
                var localCatalog = {};
                localCatalog[prefixes.dcterms + 'title'] = [{'@value': 'Mobi Catalog (Local)'}];
                var distributedCatalog = {};
                distributedCatalog[prefixes.dcterms + 'title'] = [{'@value': 'Mobi Catalog (Distributed)'}];
                $httpBackend.whenGET('/mobirest/catalogs').respond(200, [localCatalog, distributedCatalog]);
                catalogManagerSvc.initialize()
                    .then(_.noop, function(response) {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
                expect(catalogManagerSvc.recordTypes).toEqual(this.types);
                expect(catalogManagerSvc.localCatalog).toEqual(localCatalog);
                expect(catalogManagerSvc.distributedCatalog).toEqual(distributedCatalog);
                expect(catalogManagerSvc.sortOptions.length).toEqual(this.sortOptions.length * 2);
                _.forEach(this.sortOptions, function(option) {
                    expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: true})).not.toBeUndefined();
                    expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: false})).not.toBeUndefined();
                });
            });
        });
    });
    it('should get the IRIs for all record types', function() {
        $httpBackend.whenGET('/mobirest/catalogs/record-types').respond(200, []);
        catalogManagerSvc.getRecordTypes()
            .then(function(value) {
                expect(value).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
        flushAndVerify($httpBackend);
    });
    it('should get the IRIs for all sort options', function() {
        $httpBackend.whenGET('/mobirest/catalogs/sort-options').respond(200, []);
        catalogManagerSvc.getSortOptions()
            .then(function(value) {
                expect(value).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
        flushAndVerify($httpBackend);
    });
    describe('should get a page of results based on the passed URL', function() {
        beforeEach(function() {
            this.url = 'mobirest/catalogs/local/records';
        });
        it('unless there is an error', function() {
            $httpBackend.expectGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getResultsPage(this.url)
                .then(function(response) {
                    fail('Promise should have rejected');
                },function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.expectGET(this.url).respond(200, []);
            catalogManagerSvc.getResultsPage(this.url)
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Records', function() {
        beforeEach(function() {
            this.promiseId = 'id';
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records';
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true,
                type: prefixes.catalog + 'Record',
                searchText: 'Text'
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        describe('unless an error occurs', function() {
            it('with no promise id set', function() {
                var params = $httpParamSerializer(this.config);
                $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
                catalogManagerSvc.getRecords(this.catalogId, this.config)
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toBe('Error Message');
                    });
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
            });
            it('with a promise id set', function() {
                httpSvc.get.and.returnValue($q.reject({}));
                catalogManagerSvc.getRecords(this.catalogId, this.config, this.promiseId)
                    .then(function(response) {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toBe('Error Message');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith(this.url, {params: this.config}, this.promiseId);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.any(Object));
            });
        });
        describe('successfully', function() {
            describe('with no promise id set', function() {
                it('and all config passed', function() {
                    var params = $httpParamSerializer(this.config);
                    $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
                    catalogManagerSvc.getRecords(this.catalogId, this.config)
                        .then(function(response) {
                            expect(response.data).toEqual([]);
                        }, function(response) {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                });
                it('and no config passed', function() {
                    var params = $httpParamSerializer({
                        sort: catalogManagerSvc.sortOptions[0].field,
                        ascending: catalogManagerSvc.sortOptions[0].asc
                    });
                    $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
                    catalogManagerSvc.getRecords(this.catalogId, {})
                        .then(function(response) {
                            expect(response.data).toEqual([]);
                        }, function(response) {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                });
            });
            describe('with a promise id set', function() {
                beforeEach(function() {
                    httpSvc.get.and.returnValue($q.when({data: []}));
                });
                it('and all config passed', function() {
                    catalogManagerSvc.getRecords(this.catalogId, this.config, this.promiseId)
                        .then(function(response) {
                            expect(response.data).toEqual([]);
                        }, function(response) {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(httpSvc.get).toHaveBeenCalledWith(this.url, {params: this.config}, this.promiseId);
                });
                it('and no config passed', function() {
                    var params = {
                        sort: catalogManagerSvc.sortOptions[0].field,
                        ascending: catalogManagerSvc.sortOptions[0].asc
                    };
                    catalogManagerSvc.getRecords(this.catalogId, {}, this.promiseId)
                        .then(function(response) {
                            expect(response.data).toEqual([]);
                        }, function(response) {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                            expect(httpSvc.get).toHaveBeenCalledWith(this.url, {params: params}, this.promiseId);
                });
            });
        });
    });
    describe('should retrieve a Record', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecord(this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getRecord(this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Record', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records';
            this.recordConfig = {
                type: prefixes.catalog + 'Record',
                title: 'Title',
                description: 'Description',
                keywords: ['keyword0', 'keyword1']
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecord(this.catalogId, this.recordConfig)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description and keywords', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.recordId);
            var self = this;
            catalogManagerSvc.createRecord(this.catalogId, this.recordConfig)
                .then(function(response) {
                    expect(response).toBe(self.recordId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a description or keywords', function() {
            delete this.recordConfig.description;
            delete this.recordConfig.keywords;
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.recordId);
            var self = this;
            catalogManagerSvc.createRecord(this.catalogId, this.recordConfig)
                .then(function(response) {
                    expect(response).toBe(self.recordId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Record', function() {
        beforeEach(function() {
            this.newRecord = {};
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(this.url, this.newRecord).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecord(this.recordId, this.catalogId, this.newRecord).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.expectPUT(this.url, this.newRecord).respond(200);
            var self = this;
            catalogManagerSvc.updateRecord(this.recordId, this.catalogId, this.newRecord)
                .then(function(response) {
                    expect(response).toEqual(self.recordId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecord(this.recordId, this.catalogId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(this.url).respond(200);
            catalogManagerSvc.deleteRecord(this.recordId, this.catalogId)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Record Distributions', function() {
        beforeEach(function() {
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/distributions';
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordDistributions(this.recordId, this.catalogId, this.config)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with all config passed', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordDistributions(this.recordId, this.catalogId, this.config)
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without any config passed', function() {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field,
                ascending: catalogManagerSvc.sortOptions[0].asc
            });
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordDistributions(this.recordId, this.catalogId, {})
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Record Distribution', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/distributions/' + encodeURIComponent(this.distributionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordDistribution(this.distributionId, this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getRecordDistribution(this.distributionId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
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
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/distributions';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordDistribution(this.recordId, this.catalogId, this.distributionConfig)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description, format, access URL, and download URL', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.distributionId);
            var self = this;
            catalogManagerSvc.createRecordDistribution(this.recordId, this.catalogId, this.distributionConfig)
                .then(function(response) {
                    expect(response).toBe(self.distributionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a description, format, access URL, or download URL', function() {
            delete this.distributionConfig.description;
            delete this.distributionConfig.format;
            delete this.distributionConfig.accessURL;
            delete this.distributionConfig.downloadURL;
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.distributionId);
            var self = this;
            catalogManagerSvc.createRecordDistribution(this.recordId, this.catalogId, this.distributionConfig)
                .then(function(response) {
                    expect(response).toBe(self.distributionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Record Distribution', function() {
        beforeEach(function() {
            this.newDistribution = {};
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/distributions/' + encodeURIComponent(this.distributionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(this.url, this.newDistribution).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecordDistribution(this.distributionId, this.recordId, this.catalogId, this.newDistribution)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.expectPUT(this.url, this.newDistribution).respond(200);
            var self = this;
            catalogManagerSvc.updateRecordDistribution(this.distributionId, this.recordId, this.catalogId, this.newDistribution)
                .then(function(response) {
                    expect(response).toBe(self.distributionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record Distribution', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/distributions/' + encodeURIComponent(this.distributionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecordDistribution(this.distributionId, this.recordId, this.catalogId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(this.url).respond(200);
            catalogManagerSvc.deleteRecordDistribution(this.distributionId, this.recordId, this.catalogId)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Record Versions', function() {
        beforeEach(function() {
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions';
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordVersions(this.recordId, this.catalogId, this.config)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with all config passed', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordVersions(this.recordId, this.catalogId, this.config)
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without any config', function() {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field,
                ascending: catalogManagerSvc.sortOptions[0].asc
            });
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordVersions(this.recordId, this.catalogId, {})
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the latest Record Version', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/latest';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordLatestVersion(this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getRecordLatestVersion(this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Record Version', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordVersion(this.versionId, this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getRecordVersion(this.versionId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Version', function() {
        beforeEach(function () {
            this.versionConfig = {
                    title: 'Title',
                    description: 'Description'
                };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordVersion(this.recordId, this.catalogId, this.versionConfig)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.versionId);
            var self = this;
            catalogManagerSvc.createRecordVersion(this.recordId, this.catalogId, this.versionConfig)
                .then(function(response) {
                    expect(response).toBe(self.versionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a description', function() {
            delete this.versionConfig.description;
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.versionId);
            var self = this;
            catalogManagerSvc.createRecordVersion(this.recordId, this.catalogId, this.versionConfig)
                .then(function(response) {
                    expect(response).toBe(self.versionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Tag', function() {
        beforeEach(function() {
            this.versionConfig = {
                    title: 'Title',
                    description: 'Description'
                };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions';
            this.version = {'@id': this.versionId};
            spyOn(catalogManagerSvc, 'getRecordVersion').and.returnValue($q.when(this.version));
            spyOn(catalogManagerSvc, 'updateRecordVersion').and.returnValue($q.when(this.versionId));
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordTag(this.recordId, this.catalogId, this.versionConfig, this.commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description', function() {
            var expectedVersion = angular.copy(this.version);
            expectedVersion[prefixes.catalog + 'commit'] = [{'@id': this.commitId}];
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.versionId);
            var self = this;
            catalogManagerSvc.createRecordTag(this.recordId, this.catalogId, this.versionConfig, this.commitId)
                .then(function(response) {
                    expect(response).toBe(self.versionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.versionId, this.recordId, this.catalogId);
            expect(catalogManagerSvc.updateRecordVersion).toHaveBeenCalledWith(this.versionId, this.recordId, this.catalogId, expectedVersion);
        });
        it('without a description', function() {
            delete this.versionConfig.description;
            var expectedVersion = angular.copy(this.version);
            expectedVersion[prefixes.catalog + 'commit'] = [{'@id': this.commitId}];
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.versionId);
            var self = this;
            catalogManagerSvc.createRecordTag(this.recordId, this.catalogId, this.versionConfig, this.commitId)
                .then(function(response) {
                    expect(response).toBe(self.versionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(this.versionId, this.recordId, this.catalogId);
            expect(catalogManagerSvc.updateRecordVersion).toHaveBeenCalledWith(this.versionId, this.recordId, this.catalogId, expectedVersion);
        });
    });
    describe('should update a Record Version', function() {
        beforeEach(function() {
            this.newVersion = {};
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(this.url, this.newVersion).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecordVersion(this.versionId, this.recordId, this.catalogId, this.newVersion)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.expectPUT(this.url, this.newVersion).respond(200, '');
            catalogManagerSvc.updateRecordVersion(this.versionId, this.recordId, this.catalogId, this.newVersion)
                .then(function(response) {
                    expect(response).toBe('');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record Version', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecordVersion(this.versionId, this.recordId, this.catalogId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(this.url).respond(200);
            catalogManagerSvc.deleteRecordVersion(this.versionId, this.recordId, this.catalogId)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the Commit of a Version', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId) + '/commit';
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getVersionCommit(this.versionId, this.recordId, this.catalogId, 'jsonld')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a format', function() {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET(this.url + '?' + params).respond(200, {});
            catalogManagerSvc.getVersionCommit(this.versionId, this.recordId, this.catalogId, 'turtle')
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(this.url + '?' + params).respond(200, {});
            catalogManagerSvc.getVersionCommit(this.versionId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Version Distributions', function() {
        beforeEach(function() {
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId) + '/distributions';
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getVersionDistributions(this.versionId, this.recordId, this.catalogId, this.config)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with all config passed', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getVersionDistributions(this.versionId, this.recordId, this.catalogId, this.config)
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without any config', function() {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field,
                ascending: catalogManagerSvc.sortOptions[0].asc
            });
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getVersionDistributions(this.versionId, this.recordId, this.catalogId, {})
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Version Distribution', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId) + '/distributions/' + encodeURIComponent(this.distributionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getVersionDistribution(this.distributionId, this.versionId, this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getVersionDistribution(this.distributionId, this.versionId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Version Distribution', function() {
        beforeEach(function () {
            this.distributionConfig = {
                title: 'Title',
                description: 'Description',
                format: 'text/plain',
                accessURL: 'http://example.com/access',
                downloadURL: 'http://example.com/download',
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId) + '/distributions';
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createVersionDistribution(this.versionId, this.recordId, this.catalogId, this.distributionConfig)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description, format, access URL, and download URL', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.distributionId);
            var self = this;
            catalogManagerSvc.createVersionDistribution(this.versionId, this.recordId, this.catalogId, this.distributionConfig)
                .then(function(response) {
                    expect(response).toBe(self.distributionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a description, format, access URL, or download URL', function() {
            delete this.distributionConfig.description;
            delete this.distributionConfig.format;
            delete this.distributionConfig.accessURL;
            delete this.distributionConfig.downloadURL;
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.distributionId);
            var self = this;
            catalogManagerSvc.createVersionDistribution(this.versionId, this.recordId, this.catalogId, this.distributionConfig)
                .then(function(response) {
                    expect(response).toBe(self.distributionId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Version Distribution', function() {
        beforeEach(function() {
            this.newDistribution = {};
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId) + '/distributions/' + encodeURIComponent(this.distributionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(this.url, this.newDistribution).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateVersionDistribution(this.distributionId, this.versionId, this.recordId, this.catalogId, this.newDistribution)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.expectPUT(this.url, this.newDistribution).respond(200, '');
            catalogManagerSvc.updateVersionDistribution(this.distributionId, this.versionId, this.recordId, this.catalogId, this.newDistribution)
                .then(function(response) {
                    expect(response).toBe('');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Version Distribution', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/versions/' + encodeURIComponent(this.versionId) + '/distributions/' + encodeURIComponent(this.distributionId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteVersionDistribution(this.distributionId, this.versionId, this.recordId, this.catalogId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(this.url).respond(200);
            catalogManagerSvc.deleteVersionDistribution(this.distributionId, this.versionId, this.recordId, this.catalogId)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Record Branches', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches';
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true,
                applyUserFilter: false
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordBranches(this.recordId, this.catalogId, this.config)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with all config passed', function() {
            this.config.applyUserFilter = true;
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordBranches(this.recordId, this.catalogId, this.config, true)
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without any config', function() {
            var params = $httpParamSerializer({
                sort: catalogManagerSvc.sortOptions[0].field,
                ascending: catalogManagerSvc.sortOptions[0].asc,
                applyUserFilter: false
            });
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordBranches(this.recordId, this.catalogId, {})
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the master Branch of a Record', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/master';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordMasterBranch(this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getRecordMasterBranch(this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Record Branch', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordBranch(this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getRecordBranch(this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Branch', function() {
        beforeEach(function() {
            this.branchConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches';
            this.branch = {'@id': this.branchId};
            spyOn(catalogManagerSvc, 'getRecordBranch').and.returnValue($q.when(this.branch));
            spyOn(catalogManagerSvc, 'updateRecordBranch').and.returnValue($q.when(this.branchId));
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordBranch(this.recordId, this.catalogId, this.branchConfig, this.commitId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description', function() {
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': this.commitId}];
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.branchId);
            var self = this;
            catalogManagerSvc.createRecordBranch(this.recordId, this.catalogId, this.branchConfig, this.commitId)
                .then(function(response) {
                    expect(response).toBe(self.branchId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
            expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId, expectedBranch);
        });
        it('without a description', function() {
            delete this.branchConfig.description;
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': this.commitId}];
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.branchId);
            var self = this;
            catalogManagerSvc.createRecordBranch(this.recordId, this.catalogId, this.branchConfig, this.commitId)
                .then(function(response) {
                    expect(response).toBe(self.branchId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
            expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId, expectedBranch);
        });
    });
    describe('should create a new UserBranch', function() {
        beforeEach(function() {
            this.branchConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches';
            this.branch = {'@id': this.branchId};
            spyOn(catalogManagerSvc, 'getRecordBranch').and.returnValue($q.when(this.branch));
            spyOn(catalogManagerSvc, 'updateRecordBranch').and.returnValue($q.when(this.branchId));
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordUserBranch(this.recordId, this.catalogId, this.branchConfig, this.commitId, this.branchId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a description', function() {
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': this.commitId}];
            expectedBranch[prefixes.catalog + 'createdFrom'] = [{'@id': this.branchId}];
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.branchId);
            var self = this;
            catalogManagerSvc.createRecordUserBranch(this.recordId, this.catalogId, this.branchConfig, this.commitId, this.branchId)
                .then(function(response) {
                    expect(response).toBe(self.branchId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
            expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId, expectedBranch);
        });
        it('without a description', function() {
            delete this.branchConfig.description;
            var expectedBranch = angular.copy(this.branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': this.commitId}];
            expectedBranch[prefixes.catalog + 'createdFrom'] = [{'@id': this.branchId}];
            $httpBackend.expectPOST(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.branchId);
            var self = this;
            catalogManagerSvc.createRecordUserBranch(this.recordId, this.catalogId, this.branchConfig, this.commitId, this.branchId)
                .then(function(response) {
                    expect(response).toBe(self.branchId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId);
            expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(this.branchId, this.recordId, this.catalogId, expectedBranch);
        });
    });
    describe('should update a Record Branch', function() {
        beforeEach(function() {
            this.newBranch = {};
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId);
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(this.url, this.newBranch).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecordBranch(this.branchId, this.recordId, this.catalogId, this.newBranch)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.expectPUT(this.url, this.newBranch).respond(200);
            var self = this;
            catalogManagerSvc.updateRecordBranch(this.branchId, this.recordId, this.catalogId, this.newBranch)
                .then(function(response) {
                    expect(response).toBe(self.branchId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record Branch', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId);
        });
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecordBranch(this.branchId, this.recordId, this.catalogId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(this.url).respond(200);
            catalogManagerSvc.deleteRecordBranch(this.branchId, this.recordId, this.catalogId)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve Branch Commits', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/commits';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchCommits(this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, []);
            catalogManagerSvc.getBranchCommits(this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('successfully with target ID', function() {
            var params = $httpParamSerializer({targetId: this.branchId})
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getBranchCommits(this.branchId, this.recordId, this.catalogId, this.branchId)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new commit on a Branch', function() {
        beforeEach(function() {
            this.message = 'Message';
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/commits';
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({message: this.message});
            $httpBackend.expectPOST(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createBranchCommit(this.branchId, this.recordId, this.catalogId, this.message)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            var params = $httpParamSerializer({message: this.message});
            $httpBackend.expectPOST(this.url + '?' + params).respond(200, this.commitId);
            var self = this;
            catalogManagerSvc.createBranchCommit(this.branchId, this.recordId, this.catalogId, this.message)
                .then(function(response) {
                    expect(response).toBe(self.commitId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the head Commit of a Branch', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/commits/head';
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchHeadCommit(this.branchId, this.recordId, this.catalogId, 'jsonld')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a format', function() {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET(this.url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchHeadCommit(this.branchId, this.recordId, this.catalogId, 'turtle')
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(this.url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchHeadCommit(this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Branch Commit', function() {
        beforeEach(function () {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/commits/' + encodeURIComponent(this.commitId);
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchCommit(this.commitId, this.branchId, this.recordId, this.catalogId, 'jsonld')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a format', function() {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET(this.url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchCommit(this.commitId, this.branchId, this.recordId, this.catalogId, 'turtle')
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(this.url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchCommit(this.commitId, this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should get the difference between two Branches', function() {
        beforeEach(function() {
            this.config = {
                format: 'jsonld',
                targetId: this.branchId
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/difference';
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchDifference(this.branchId, this.branchId, this.recordId, this.catalogId, 'jsonld')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a format', function() {
            this.config.format = 'turtle';
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getBranchDifference(this.branchId, this.branchId, this.recordId, this.catalogId, 'turtle')
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getBranchDifference(this.branchId, this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should get the conflicts between two Branches', function() {
        beforeEach(function() {
            this.config = {
                format: 'jsonld',
                targetId: this.branchId
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/conflicts';
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchConflicts(this.branchId, this.branchId, this.recordId, this.catalogId, 'jsonld')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a format', function() {
            this.config.format = 'turtle';
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getBranchConflicts(this.branchId, this.branchId, this.recordId, this.catalogId, 'turtle')
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, []);
            catalogManagerSvc.getBranchConflicts(this.branchId, this.branchId, this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual([]);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should merge two Branches', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/conflicts/resolution';
        });
        it('unless an error occurs', function() {
            var differenceObj = {};
            var params = $httpParamSerializer({targetId: this.branchId});
            $httpBackend.expectPOST(this.url + '?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.mergeBranches(this.branchId, this.branchId, this.recordId, this.catalogId, differenceObj)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with additions and deletions', function() {
            var differenceObj = {additions: [], deletions: []};
            var params = $httpParamSerializer({targetId: this.branchId});
            $httpBackend.expectPOST(this.url + '?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.commitId);
            var self = this;
            catalogManagerSvc.mergeBranches(this.branchId, this.branchId, this.recordId, this.catalogId, differenceObj)
                .then(function(response) {
                    expect(response).toEqual(self.commitId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without additions and deletions', function() {
            var differenceObj = {};
            var params = $httpParamSerializer({targetId: this.branchId});
            $httpBackend.expectPOST(this.url + '?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, this.commitId);
            var self = this;
            catalogManagerSvc.mergeBranches(this.branchId, this.branchId, this.recordId, this.catalogId, differenceObj)
                .then(function(response) {
                    expect(response).toEqual(self.commitId);
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the compiled resource from a Branch Commit', function() {
        beforeEach(function() {
            this.config = {
                applyInProgressCommit: true,
                format: 'jsonld'
            };
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/commits/' + encodeURIComponent(this.commitId) + '/resource';
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getResource(this.commitId, this.branchId, this.recordId, this.catalogId, true, 'jsonld')
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with a format', function() {
            this.config.format = 'turtle';
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, '');
            catalogManagerSvc.getResource(this.commitId, this.branchId, this.recordId, this.catalogId, true, 'turtle')
                .then(function(response) {
                    expect(response).toBe('');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET(this.url + '?' + params).respond(200, '');
            catalogManagerSvc.getResource(this.commitId, this.branchId, this.recordId, this.catalogId, true)
                .then(function(response) {
                    expect(response).toBe('');
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should download the compiled resource from a Branch Commit', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/branches/' + encodeURIComponent(this.branchId) + '/commits/' + encodeURIComponent(this.commitId) + '/resource';
            this.params = {
                applyInProgressCommit: true,
                fileName: 'resource',
                format: 'jsonld'
            };
        });
        it('with a format', function() {
            this.params.format = 'turtle';
            var params = $httpParamSerializer(this.params);
            catalogManagerSvc.downloadResource(this.commitId, this.branchId, this.recordId, this.catalogId, true, 'turtle');
            expect(utilSvc.startDownload).toHaveBeenCalledWith(this.url + '?' + params);
        });
        it('without a format', function() {
            var params = $httpParamSerializer(this.params);
            catalogManagerSvc.downloadResource(this.commitId, this.branchId, this.recordId, this.catalogId, true);
            expect(utilSvc.startDownload).toHaveBeenCalledWith(this.url + '?' + params);
        });
    });
    describe('should create a new InProgressCommit for the logged-in User', function() {
        beforeEach(function () {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenPOST(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createInProgressCommit(this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenPOST(this.url).respond(200);
            catalogManagerSvc.createInProgressCommit(this.recordId, this.catalogId)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve an InProgressCommit for the logged-in User', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getInProgressCommit(this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenGET(this.url).respond(200, {});
            catalogManagerSvc.getInProgressCommit(this.recordId, this.catalogId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update an InProgressCommit for the logged-in User', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            var differenceObj = {};
            $httpBackend.whenPUT(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateInProgressCommit(this.recordId, this.catalogId, differenceObj)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('with additions and deletions', function() {
            var differenceObj = {additions: [], deletions: []};
            $httpBackend.whenPUT(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200);
            catalogManagerSvc.updateInProgressCommit(this.recordId, this.catalogId, differenceObj)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without additions and deletions', function() {
            var differenceObj = {};
            $httpBackend.whenPUT(this.url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200);
            catalogManagerSvc.updateInProgressCommit(this.recordId, this.catalogId, differenceObj)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should remove an InProgressCommit for the logged-in User', function() {
        beforeEach(function() {
            this.url = '/mobirest/catalogs/' + encodeURIComponent(this.catalogId) + '/records/' + encodeURIComponent(this.recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(this.url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteInProgressCommit(this.recordId, this.catalogId)
                .then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toBe('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(this.url).respond(200);
            catalogManagerSvc.deleteInProgressCommit(this.recordId, this.catalogId)
                .then(_.noop, function(response) {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
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