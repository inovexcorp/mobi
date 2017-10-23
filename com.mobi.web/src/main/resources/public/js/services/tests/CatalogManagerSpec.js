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
    var catalogManagerSvc, scope, $httpBackend, prefixes, utilSvc, $q, windowSvc, httpSvc,
        catalogId = 'http://mobi.com/catalogs/local',
        recordId = 'http://mobi.com/records/test',
        distributionId = 'http://mobi.com/distributions/test',
        versionId = 'http://mobi.com/versions/test',
        branchId = 'http://mobi.com/branches/test',
        commitId = 'http://mobi.com/commits/test';

    beforeEach(function() {
        module('catalogManager');
        mockPrefixes();
        mockUtil();
        mockHttpService();
        injectRestPathConstant();

        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
        });

        inject(function(catalogManagerService, _$rootScope_, _prefixes_, _utilService_, _$httpBackend_, _httpService_, _$httpParamSerializer_, _$q_, _$window_) {
            catalogManagerSvc = catalogManagerService;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            utilSvc = _utilService_;
            $httpBackend = _$httpBackend_;
            httpSvc = _httpService_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
            windowSvc = _$window_;
        });

        utilSvc.paginatedConfigToParams.and.callFake(_.identity);
        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    describe('should set the correct initial state', function() {
        it('unless an error occurs', function() {
            spyOn(catalogManagerSvc, 'getRecordTypes').and.returnValue($q.reject());
            spyOn(catalogManagerSvc, 'getSortOptions').and.returnValue($q.reject());
            $httpBackend.whenGET('/mobirest/catalogs').respond(400, '');
            catalogManagerSvc.initialize().then(function(response) {
                fail('Promise should have rejected');
            }, function() {
                expect(true).toBe(true);
            });
            flushAndVerify($httpBackend);
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
                catalogManagerSvc.initialize().then(function(response) {
                    fail('Promise should have rejected');
                }, function(error) {
                    expect(error).toContain('Could not find');
                });
                flushAndVerify($httpBackend);
            });
            it('with all important data', function() {
                var types = this.types;
                var sortOptions = this.sortOptions;
                var localCatalog = {};
                localCatalog[prefixes.dcterms + 'title'] = [{'@value': 'Mobi Catalog (Local)'}];
                var distributedCatalog = {};
                distributedCatalog[prefixes.dcterms + 'title'] = [{'@value': 'Mobi Catalog (Distributed)'}];
                $httpBackend.whenGET('/mobirest/catalogs').respond(200, [localCatalog, distributedCatalog]);
                catalogManagerSvc.initialize().then(function(response) {
                    expect(catalogManagerSvc.recordTypes).toEqual(types);
                    expect(catalogManagerSvc.localCatalog).toEqual(localCatalog);
                    expect(catalogManagerSvc.distributedCatalog).toEqual(distributedCatalog);
                    expect(catalogManagerSvc.sortOptions.length).toEqual(sortOptions.length * 2);
                    _.forEach(sortOptions, function(option) {
                        expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: true})).not.toBeUndefined();
                        expect(_.find(catalogManagerSvc.sortOptions, {field: option, asc: false})).not.toBeUndefined();
                    });
                }, function(response) {
                    fail('Promise should have resolved');
                });
                flushAndVerify($httpBackend);
            });
        });
    });
    it('should get the IRIs for all record types', function() {
        $httpBackend.whenGET('/mobirest/catalogs/record-types').respond(200, []);
        catalogManagerSvc.getRecordTypes().then(function(value) {
            expect(value).toEqual([]);
        }, function(response) {
            fail('Promise should have resolved');
        });
        flushAndVerify($httpBackend);
    });
    it('should get the IRIs for all sort options', function() {
        $httpBackend.whenGET('/mobirest/catalogs/sort-options').respond(200, []);
        catalogManagerSvc.getSortOptions().then(function(value) {
            expect(value).toEqual([]);
        }, function(response) {
            fail('Promise should have resolved');
        });
        flushAndVerify($httpBackend);
    });
    describe('should get a page of results based on the passed URL', function() {
        var url = 'mobirest/catalogs/local/records';
        it('unless there is an error', function() {
            $httpBackend.expectGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getResultsPage(url).then(function(response) {
                fail('Promise should have rejected');
            },function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectGET(url).respond(200, []);
            catalogManagerSvc.getResultsPage(url).then(function(response) {
                expect(response.data).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Records', function() {
        var promiseId = 'id',
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records',
            config;
        beforeEach(function(){
            config = {
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
                var params = $httpParamSerializer(config);
                $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
                catalogManagerSvc.getRecords(catalogId, config).then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                    expect(response).toBe('Error Message');
                });
                flushAndVerify($httpBackend);
            });
            it('with a promise id set', function() {
                httpSvc.get.and.returnValue($q.reject({}));
                catalogManagerSvc.getRecords(catalogId, config, promiseId).then(function(response) {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(httpSvc.get).toHaveBeenCalledWith(url, {params: config}, promiseId);
                    expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.any(Object));
                    expect(response).toBe('Error Message');
                });
                scope.$apply();
            });
        });
        describe('successfully', function() {
            describe('with no promise id set', function() {
                it('and all config passed', function() {
                    var params = $httpParamSerializer(config);
                    $httpBackend.whenGET(url + '?' + params).respond(200, []);
                    catalogManagerSvc.getRecords(catalogId, config).then(function(response) {
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
                    $httpBackend.whenGET(url + '?' + params).respond(200, []);
                    catalogManagerSvc.getRecords(catalogId, {}).then(function(response) {
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
                    catalogManagerSvc.getRecords(catalogId, config, promiseId).then(function(response) {
                        expect(httpSvc.get).toHaveBeenCalledWith(url, {params: config}, promiseId);
                        expect(response.data).toEqual([]);
                    }, function(response) {
                        fail('Promise should have resolved');
                    });
                    scope.$apply();
                });
                it('and no config passed', function() {
                    var params = {
                        sort: catalogManagerSvc.sortOptions[0].field,
                        ascending: catalogManagerSvc.sortOptions[0].asc
                    };
                    catalogManagerSvc.getRecords(catalogId, {}, promiseId).then(function(response) {
                        expect(httpSvc.get).toHaveBeenCalledWith(url, {params: params}, promiseId);
                        expect(response.data).toEqual([]);
                    }, function(response) {
                        fail('Promise should have resolved');
                    });
                    scope.$apply();
                });
            });
        });
    });
    describe('should retrieve a Record', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId);
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecord(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getRecord(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Record', function() {
        var recordConfig,
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records';
        beforeEach(function() {
            recordConfig = {
                type: prefixes.catalog + 'Record',
                title: 'Title',
                description: 'Description',
                keywords: ['keyword0', 'keyword1']
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecord(catalogId, recordConfig).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description and keywords', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, recordId);
            catalogManagerSvc.createRecord(catalogId, recordConfig).then(function(response) {
                expect(response).toBe(recordId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description or keywords', function() {
            delete recordConfig.description;
            delete recordConfig.keywords;
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, recordId);
            catalogManagerSvc.createRecord(catalogId, recordConfig).then(function(response) {
                expect(response).toBe(recordId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Record', function() {
        var newRecord = {},
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId);
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(url, newRecord).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecord(recordId, catalogId, newRecord).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectPUT(url, newRecord).respond(200);
            catalogManagerSvc.updateRecord(recordId, catalogId, newRecord).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId);
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecord(recordId, catalogId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(url).respond(200);
            catalogManagerSvc.deleteRecord(recordId, catalogId).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Record Distributions', function() {
        var config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions';
        beforeEach(function() {
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, config).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with all config passed', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, config).then(function(response) {
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
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordDistributions(recordId, catalogId, {}).then(function(response) {
                expect(response.data).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Record Distribution', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId);
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordDistribution(distributionId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getRecordDistribution(distributionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Record Distribution', function() {
        var distributionConfig = {
                title: 'Title',
                description: 'Description',
                format: 'text/plain',
                accessURL: 'http://example.com/access',
                downloadURL: 'http://example.com/download',
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions';
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordDistribution(recordId, catalogId, distributionConfig).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description, format, access URL, and download URL', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createRecordDistribution(recordId, catalogId, distributionConfig).then(function(response) {
                expect(response).toBe(distributionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description, format, access URL, or download URL', function() {
            delete distributionConfig.description;
            delete distributionConfig.format;
            delete distributionConfig.accessURL;
            delete distributionConfig.downloadURL;
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createRecordDistribution(recordId, catalogId, distributionConfig).then(function(response) {
                expect(response).toBe(distributionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Record Distribution', function() {
        var newDistribution = {},
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId);
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(url, newDistribution).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecordDistribution(distributionId, recordId, catalogId, newDistribution).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectPUT(url, newDistribution).respond(200);
            catalogManagerSvc.updateRecordDistribution(distributionId, recordId, catalogId, newDistribution).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record Distribution', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId);
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecordDistribution(distributionId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(url).respond(200);
            catalogManagerSvc.deleteRecordDistribution(distributionId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Record Versions', function() {
        var config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions';
        beforeEach(function() {
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordVersions(recordId, catalogId, config).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with all config passed', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordVersions(recordId, catalogId, config).then(function(response) {
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
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordVersions(recordId, catalogId, {}).then(function(response) {
                expect(response.data).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the latest Record Version', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/latest';
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordLatestVersion(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getRecordLatestVersion(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Record Version', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId);
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordVersion(versionId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getRecordVersion(versionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Version', function() {
        var versionConfig = {
                title: 'Title',
                description: 'Description'
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions';
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordVersion(recordId, catalogId, versionConfig).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordVersion(recordId, catalogId, versionConfig).then(function(response) {
                expect(response).toBe(versionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description', function() {
            delete versionConfig.description;
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordVersion(recordId, catalogId, versionConfig).then(function(response) {
                expect(response).toBe(versionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Tag', function() {
        var version,
            versionConfig = {
                title: 'Title',
                description: 'Description'
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions';
        beforeEach(function() {
            version = {'@id': versionId};
            spyOn(catalogManagerSvc, 'getRecordVersion').and.returnValue($q.when(version));
            spyOn(catalogManagerSvc, 'updateRecordVersion').and.returnValue($q.when(versionId));
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordTag(recordId, catalogId, versionConfig, commitId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description', function() {
            var expectedVersion = angular.copy(version);
            expectedVersion[prefixes.catalog + 'commit'] = [{'@id': commitId}];
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordTag(recordId, catalogId, versionConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId, expectedVersion);
                expect(response).toBe(versionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description', function() {
            delete versionConfig.description;
            var expectedVersion = angular.copy(version);
            expectedVersion[prefixes.catalog + 'commit'] = [{'@id': commitId}];
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, versionId);
            catalogManagerSvc.createRecordTag(recordId, catalogId, versionConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordVersion).toHaveBeenCalledWith(versionId, recordId, catalogId, expectedVersion);
                expect(response).toBe(versionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Record Version', function() {
        var newVersion = {},
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId);
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(url, newVersion).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecordVersion(versionId, recordId, catalogId, newVersion).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectPUT(url, newVersion).respond(200);
            catalogManagerSvc.updateRecordVersion(versionId, recordId, catalogId, newVersion).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record Version', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId);
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecordVersion(versionId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(url).respond(200);
            catalogManagerSvc.deleteRecordVersion(versionId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the Commit of a Version', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/commit';
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getVersionCommit(versionId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a format', function() {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET(url + '?' + params).respond(200, {});
            catalogManagerSvc.getVersionCommit(versionId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(url + '?' + params).respond(200, {});
            catalogManagerSvc.getVersionCommit(versionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Version Distributions', function() {
        var config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions';
        beforeEach(function() {
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getVersionDistributions(versionId, recordId, catalogId, config).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with all config passed', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getVersionDistributions(versionId, recordId, catalogId, config).then(function(response) {
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
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getVersionDistributions(versionId, recordId, catalogId, {}).then(function(response) {
                expect(response.data).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Version Distribution', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId);
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getVersionDistribution(distributionId, versionId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getVersionDistribution(distributionId, versionId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Version Distribution', function() {
        var distributionConfig = {
                title: 'Title',
                description: 'Description',
                format: 'text/plain',
                accessURL: 'http://example.com/access',
                downloadURL: 'http://example.com/download',
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions';
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createVersionDistribution(versionId, recordId, catalogId, distributionConfig).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description, format, access URL, and download URL', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createVersionDistribution(versionId, recordId, catalogId, distributionConfig).then(function(response) {
                expect(response).toBe(distributionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description, format, access URL, or download URL', function() {
            delete distributionConfig.description;
            delete distributionConfig.format;
            delete distributionConfig.accessURL;
            delete distributionConfig.downloadURL;
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, distributionId);
            catalogManagerSvc.createVersionDistribution(versionId, recordId, catalogId, distributionConfig).then(function(response) {
                expect(response).toBe(distributionId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Version Distribution', function() {
        var newDistribution = {},
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId);
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(url, newDistribution).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateVersionDistribution(distributionId, versionId, recordId, catalogId, newDistribution).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectPUT(url, newDistribution).respond(200);
            catalogManagerSvc.updateVersionDistribution(distributionId, versionId, recordId, catalogId, newDistribution).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Version Distribution', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId);
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteVersionDistribution(distributionId, versionId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(url).respond(200);
            catalogManagerSvc.deleteVersionDistribution(distributionId, versionId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a list of Record Branches', function() {
        var config,
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches';
        beforeEach(function() {
            config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true,
                applyUserFilter: false
            };
            catalogManagerSvc.sortOptions = [{field: 'http://purl.org/dc/terms/title', asc: false}];
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordBranches(recordId, catalogId, config).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with all config passed', function() {
            config.applyUserFilter = true;
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordBranches(recordId, catalogId, config, true).then(function(response) {
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
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getRecordBranches(recordId, catalogId, {}).then(function(response) {
                expect(response.data).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the master Branch of a Record', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/master';
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordMasterBranch(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getRecordMasterBranch(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Record Branch', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId);
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getRecordBranch(branchId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getRecordBranch(branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Branch', function() {
        var branch,
            branchConfig = {
                title: 'Title',
                description: 'Description'
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches';
        beforeEach(function() {
            branch = {'@id': branchId};
            spyOn(catalogManagerSvc, 'getRecordBranch').and.returnValue($q.when(branch));
            spyOn(catalogManagerSvc, 'updateRecordBranch').and.returnValue($q.when(branchId));
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordBranch(recordId, catalogId, branchConfig, commitId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description', function() {
            var expectedBranch = angular.copy(branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordBranch(recordId, catalogId, branchConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description', function() {
            delete branchConfig.description;
            var expectedBranch = angular.copy(branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordBranch(recordId, catalogId, branchConfig, commitId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new UserBranch', function() {
        var branch,
            branchConfig = {
                title: 'Title',
                description: 'Description'
            },
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches';
        beforeEach(function() {
            branch = {'@id': branchId};
            spyOn(catalogManagerSvc, 'getRecordBranch').and.returnValue($q.when(branch));
            spyOn(catalogManagerSvc, 'updateRecordBranch').and.returnValue($q.when(branchId));
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createRecordUserBranch(recordId, catalogId, branchConfig, commitId, branchId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a description', function() {
            var expectedBranch = angular.copy(branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            expectedBranch[prefixes.catalog + 'createdFrom'] = [{'@id': branchId}];
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordUserBranch(recordId, catalogId, branchConfig, commitId, branchId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a description', function() {
            delete branchConfig.description;
            var expectedBranch = angular.copy(branch);
            expectedBranch[prefixes.catalog + 'head'] = [{'@id': commitId}];
            expectedBranch[prefixes.catalog + 'createdFrom'] = [{'@id': branchId}];
            $httpBackend.expectPOST(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, branchId);
            catalogManagerSvc.createRecordUserBranch(recordId, catalogId, branchConfig, commitId, branchId).then(function(response) {
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId);
                expect(catalogManagerSvc.updateRecordBranch).toHaveBeenCalledWith(branchId, recordId, catalogId, expectedBranch);
                expect(response).toBe(branchId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update a Record Branch', function() {
        var newBranch = {},
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId);
        it('unless an error occurs', function() {
            $httpBackend.expectPUT(url, newBranch).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateRecordBranch(branchId, recordId, catalogId, newBranch).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.expectPUT(url, newBranch).respond(200);
            catalogManagerSvc.updateRecordBranch(branchId, recordId, catalogId, newBranch).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should delete a Record Branch', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId);
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteRecordBranch(branchId, recordId, catalogId).then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(url).respond(200);
            catalogManagerSvc.deleteRecordBranch(branchId, recordId, catalogId).then(function() {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve Branch Commits', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits';
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchCommits(branchId, recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, []);
            catalogManagerSvc.getBranchCommits(branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new commit on a Branch', function() {
        var message = 'Message',
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits';
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({message: message});
            $httpBackend.expectPOST(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createBranchCommit(branchId, recordId, catalogId, message).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            var params = $httpParamSerializer({message: message});
            $httpBackend.expectPOST(url + '?' + params).respond(200, commitId);
            catalogManagerSvc.createBranchCommit(branchId, recordId, catalogId, message).then(function(response) {
                expect(response).toBe(commitId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the head Commit of a Branch', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/head';
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchHeadCommit(branchId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a format', function() {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET(url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchHeadCommit(branchId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchHeadCommit(branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a Branch Commit', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId);
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchCommit(commitId, branchId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a format', function() {
            var params = $httpParamSerializer({format: 'turtle'});
            $httpBackend.whenGET(url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchCommit(commitId, branchId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer({format: 'jsonld'});
            $httpBackend.whenGET(url + '?' + params).respond(200, {});
            catalogManagerSvc.getBranchCommit(commitId, branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should get the conflicts between two Branches', function() {
        var config,
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts';
        beforeEach(function() {
            config = {
                format: 'jsonld',
                targetId: branchId
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getBranchConflicts(branchId, branchId, recordId, catalogId, 'jsonld').then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a format', function() {
            config.format = 'turtle';
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getBranchConflicts(branchId, branchId, recordId, catalogId, 'turtle').then(function(response) {
                expect(response).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, []);
            catalogManagerSvc.getBranchConflicts(branchId, branchId, recordId, catalogId).then(function(response) {
                expect(response).toEqual([]);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should merge two Branches', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts/resolution';
        it('unless an error occurs', function() {
            var differenceObj = {};
            var params = $httpParamSerializer({targetId: branchId});
            $httpBackend.expectPOST(url + '?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.mergeBranches(branchId, branchId, recordId, catalogId, differenceObj).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with additions and deletions', function() {
            var differenceObj = {additions: [], deletions: []};
            var params = $httpParamSerializer({targetId: branchId});
            $httpBackend.expectPOST(url + '?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, commitId);
            catalogManagerSvc.mergeBranches(branchId, branchId, recordId, catalogId, differenceObj).then(function(response) {
                expect(response).toEqual(commitId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without additions and deletions', function() {
            var differenceObj = {};
            var params = $httpParamSerializer({targetId: branchId});
            $httpBackend.expectPOST(url + '?' + params,
                function(data) {
                    return data instanceof FormData;
                }).respond(200, commitId);
            catalogManagerSvc.mergeBranches(branchId, branchId, recordId, catalogId, differenceObj).then(function(response) {
                expect(response).toEqual(commitId);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the compiled resource from a Branch Commit', function() {
        var config,
            url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource';
        beforeEach(function() {
            config = {
                applyInProgressCommit: true,
                format: 'jsonld'
            };
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getResource(commitId, branchId, recordId, catalogId, true, 'jsonld').then(function() {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with a format', function() {
            config.format = 'turtle';
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, '');
            catalogManagerSvc.getResource(commitId, branchId, recordId, catalogId, true, 'turtle').then(function(response) {
                expect(response).toBe('');
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without a format', function() {
            var params = $httpParamSerializer(config);
            $httpBackend.whenGET(url + '?' + params).respond(200, '');
            catalogManagerSvc.getResource(commitId, branchId, recordId, catalogId, true).then(function(response) {
                expect(response).toBe('');
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should download the compiled resource from a Branch Commit', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource';
        it('with a format', function() {
            catalogManagerSvc.downloadResource(commitId, branchId, recordId, catalogId, true, 'turtle');
            expect(windowSvc.location).toBe(url + '?applyInProgressCommit=true&format=turtle&fileName=resource');
        });
        it('without a format', function() {
            catalogManagerSvc.downloadResource(commitId, branchId, recordId, catalogId, true);
            expect(windowSvc.location).toBe(url + '?applyInProgressCommit=true&format=jsonld&fileName=resource');
        });
    });
    describe('should create a new InProgressCommit for the logged-in User', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        it('unless an error occurs', function() {
            $httpBackend.whenPOST(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.createInProgressCommit(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenPOST(url).respond(200);
            catalogManagerSvc.createInProgressCommit(recordId, catalogId).then(function(response) {
                expect(true).toBe(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve an InProgressCommit for the logged-in User', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        it('unless an error occurs', function() {
            $httpBackend.whenGET(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.getInProgressCommit(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenGET(url).respond(200, {});
            catalogManagerSvc.getInProgressCommit(recordId, catalogId).then(function(response) {
                expect(response).toEqual({});
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should update an InProgressCommit for the logged-in User', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        it('unless an error occurs', function() {
            var differenceObj = {};
            $httpBackend.whenPUT(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            catalogManagerSvc.updateInProgressCommit(recordId, catalogId, differenceObj).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('with additions and deletions', function() {
            var differenceObj = {additions: [], deletions: []};
            $httpBackend.whenPUT(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200);
            catalogManagerSvc.updateInProgressCommit(recordId, catalogId, differenceObj).then(function(response) {
                expect(true).toEqual(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
        it('without additions and deletions', function() {
            var differenceObj = {};
            $httpBackend.whenPUT(url,
                function(data) {
                    return data instanceof FormData;
                }).respond(200);
            catalogManagerSvc.updateInProgressCommit(recordId, catalogId, differenceObj).then(function(response) {
                expect(true).toEqual(true);
            }, function(response) {
                fail('Promise should have resolved');
            });
            flushAndVerify($httpBackend);
        });
    });
    describe('should remove an InProgressCommit for the logged-in User', function() {
        var url = '/mobirest/catalogs/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE(url).respond(400, null, null, 'Error Message');
            catalogManagerSvc.deleteInProgressCommit(recordId, catalogId).then(function(response) {
                fail('Promise should have rejected');
            }, function(response) {
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                expect(response).toBe('Error Message');
            });
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            $httpBackend.whenDELETE(url).respond(200);
            catalogManagerSvc.deleteInProgressCommit(recordId, catalogId).then(function(response) {
                expect(true).toEqual(true);
            }, function(response) {
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
