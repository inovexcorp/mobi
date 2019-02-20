/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
/* global expect, FormData */

describe('Dataset Manager service', function() {
    var $httpBackend, $httpParamSerializer, $q, scope, datasetManagerSvc, catalogManagerSvc, utilSvc, prefixes, discoverStateSvc, httpSvc;

    beforeEach(function() {
        module('shared');
        mockUtil();
        mockPrefixes();
        mockDiscoverState();
        mockCatalogManager();
        injectRestPathConstant();
        mockHttpService();

        inject(function(_$httpBackend_, _$httpParamSerializer_, _$q_, _$rootScope_, _datasetManagerService_, _catalogManagerService_, _utilService_, _prefixes_, _discoverStateService_, _httpService_) {
            datasetManagerSvc = _datasetManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
            utilSvc = _utilService_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            discoverStateSvc = _discoverStateService_;
            httpSvc = _httpService_;
        });

        this.recordId = 'http://mobi.com/records/test';
        utilSvc.paginatedConfigToParams.and.callFake(_.identity);
        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    afterEach(function() {
        $httpBackend = null;
        $httpParamSerializer = null;
        datasetManagerSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        $q = null;
        scope = null;
        prefixes = null;
        discoverStateSvc = null;
        httpSvc = null;
    });

    describe('should retrieve a list of DatasetRecords', function() {
        beforeEach(function(){
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/title',
                ascending: true
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/datasets').respond(400, null, null, 'Error Message');
            datasetManagerSvc.getDatasetRecords()
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('with all config passed', function() {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET('/mobirest/datasets?' + params).respond(200, []);
            datasetManagerSvc.getDatasetRecords(this.config)
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        it('without any config', function() {
            $httpBackend.whenGET('/mobirest/datasets').respond(200, []);
            datasetManagerSvc.getDatasetRecords()
                .then(function(response) {
                    expect(response.data).toEqual([]);
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a DatasetRecord', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenGET('/mobirest/datasets/' + encodeURIComponent(this.recordId)).respond(400, null, null, 'Error Message');
            datasetManagerSvc.getDatasetRecord(this.recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual(jasmine.objectContaining({
                        status: 400,
                        statusText: 'Error Message'
                    }));
                });
            flushAndVerify($httpBackend);
        });
        it('when resolved', function() {
            $httpBackend.whenGET('/mobirest/datasets/' + encodeURIComponent(this.recordId)).respond(200, {});
            datasetManagerSvc.getDatasetRecord(this.recordId)
                .then(function(response) {
                    expect(response).toEqual({});
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
    });
    describe('should create a new Record', function() {
        beforeEach(function() {
            this.recordConfig = {
                title: 'Title',
                repositoryId: 'repo',
                datasetIRI: 'dataset',
                description: 'Description',
                keywords: ['keyword0', 'keyword1'],
                ontologies: ['ontology1', 'ontology2']
            };
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/datasets',
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            datasetManagerSvc.createDatasetRecord(this.recordConfig)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        describe('when no error occurs', function() {
            beforeEach(function() {
                $httpBackend.expectPOST('/mobirest/datasets',
                    function(data) {
                        return data instanceof FormData;
                    }).respond(200, this.recordId);
            });
            it('when getDatasetRecord is rejected', function() {
                spyOn(datasetManagerSvc, 'getDatasetRecord').and.returnValue($q.reject({prop: 'error'}));
                datasetManagerSvc.createDatasetRecord(this.recordConfig)
                    .then(function() {
                        fail('Promise should have rejected');
                    });
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith({prop: 'error'});
            });
            describe('when getDatasetRecord is resolved', function() {
                beforeEach(function() {
                    this.record = {'@id': this.recordId};
                    spyOn(datasetManagerSvc, 'getDatasetRecord').and.returnValue($q.when(this.record));
                });
                it('using a datasetIRI, description, keywords, and ontologies', function() {
                    var self = this;
                    datasetManagerSvc.createDatasetRecord(this.recordConfig)
                        .then(function(response) {
                            expect(response).toBe(self.recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                    expect(datasetManagerSvc.datasetRecords).toContain(this.record);
                });
                it('not using a datasetIRI, description, keywords, or ontologies', function() {
                    delete this.recordConfig.datasetIRI;
                    delete this.recordConfig.description;
                    delete this.recordConfig.keywords;
                    delete this.recordConfig.ontologies;
                    var self = this;
                    datasetManagerSvc.createDatasetRecord(this.recordConfig)
                        .then(function(response) {
                            expect(response).toBe(self.recordId);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                    expect(datasetManagerSvc.datasetRecords).toContain(this.record);
                });
            });
        });
    });
    describe('should delete a DatasetRecord', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '?force=false').respond(400, null, null, 'Error Message');
            datasetManagerSvc.deleteDatasetRecord(this.recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('with force delete', function() {
            var datasetRecord = [{'@id': this.recordId, '@type': [prefixes.dataset + 'DatasetRecord']}];
            datasetManagerSvc.datasetRecords = [datasetRecord];
            $httpBackend.whenDELETE('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '?force=true').respond(200);
            datasetManagerSvc.deleteDatasetRecord(this.recordId, true)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(datasetManagerSvc.datasetRecords).toEqual([]);
            expect(discoverStateSvc.cleanUpOnDatasetDelete).toHaveBeenCalledWith(this.recordId);
        });
        it('without force delete', function() {
            var datasetRecord = [{'@id': this.recordId, '@type': [prefixes.dataset + 'DatasetRecord']}];
            datasetManagerSvc.datasetRecords = [datasetRecord];
            $httpBackend.whenDELETE('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '?force=false').respond(200);
            datasetManagerSvc.deleteDatasetRecord(this.recordId)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(datasetManagerSvc.datasetRecords).toEqual([]);
            expect(discoverStateSvc.cleanUpOnDatasetDelete).toHaveBeenCalledWith(this.recordId);
        });
    });
    describe('should clear a DatasetRecord', function() {
        it('unless an error occurs', function() {
            $httpBackend.whenDELETE('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '/data?force=false').respond(400, null, null, 'Error Message');
            datasetManagerSvc.clearDatasetRecord(this.recordId)
                .then(function() {
                    fail('Promise should have rejected');
                }, function(response) {
                    expect(response).toEqual('Error Message');
                });
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('with force delete', function() {
            $httpBackend.whenDELETE('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '/data?force=true').respond(200);
            datasetManagerSvc.clearDatasetRecord(this.recordId, true)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(discoverStateSvc.cleanUpOnDatasetClear).toHaveBeenCalledWith(this.recordId);
        });
        it('without force delete', function() {
            $httpBackend.whenDELETE('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '/data?force=false').respond(200);
            datasetManagerSvc.clearDatasetRecord(this.recordId)
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
            expect(discoverStateSvc.cleanUpOnDatasetClear).toHaveBeenCalledWith(this.recordId);
        });
    });
    describe('should update a DatasetRecord', function() {
        it('unless an error occurs', function() {
            catalogManagerSvc.updateRecord.and.returnValue($q.reject('Error Message'));
            datasetManagerSvc.updateDatasetRecord(this.recordId, '', [])
                .then(function() {
                    fail('Promise should have rejected');
                }, function(error) {
                    expect(error).toEqual('Error Message');
                });
            scope.$apply();
            expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith(this.recordId, '', []);
        });
        it('on success.', function() {
            expected = [
                [{'@id': 'record1', 'dcterms:title': [{'@value': 'title 1'}]}],
                [{'@id': 'record3', 'dcterms:title': [{'@value': 'title 3'}]}],
                [{'@id': this.recordId, 'dcterms:title': [{'@value': ''}]}]
            ];
            datasetManagerSvc.datasetRecords = [
                [{'@id': 'record1', 'dcterms:title': [{'@value': 'title 1'}]}],
                [{'@id': this.recordId, 'dcterms:title': [{'@value': 'title 2'}]}],
                [{'@id': 'record3', 'dcterms:title': [{'@value': 'title 3'}]}]
            ];
            catalogManagerSvc.updateRecord.and.returnValue($q.resolve(''));
            datasetManagerSvc.updateDatasetRecord(this.recordId, '', expected[2])
                .then(_.noop, function() {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith(this.recordId, '', expected[2]);
            expect(datasetManagerSvc.datasetRecords).toEqual(expected);
        });
    });
    describe('should upload data to a Dataset', function() {
        describe('with a promise id set', function() {
            it('unless an error occurs', function() {
                httpSvc.post.and.returnValue($q.reject({status: 400, statusText: 'Error Message'}));
                datasetManagerSvc.uploadData(this.recordId, {}, 'id')
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual('Error Message');
                    });
                scope.$apply();
                expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '/data', jasmine.any(Object), {transformRequest: angular.identity, headers: {'Content-Type': undefined}}, 'id');
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                    status: 400,
                    statusText: 'Error Message'
                }));
            });
            it('successfully', function() {
                httpSvc.post.and.returnValue($q.when());
                datasetManagerSvc.uploadData(this.recordId, {}, 'id')
                    .then(_.noop, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.post).toHaveBeenCalledWith('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '/data', jasmine.any(Object), {transformRequest: angular.identity, headers: {'Content-Type': undefined}}, 'id');
                expect(utilSvc.rejectError).not.toHaveBeenCalled();
            });
        });
        describe('with no promise id set', function() {
            it('unless an error occurs', function() {
                $httpBackend.expectPOST('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '/data',
                    function(data) {
                        return data instanceof FormData;
                    }, function(headers) {
                        return headers['Content-Type'] === undefined;
                    }).respond(400, null, null, 'Error Message');
                datasetManagerSvc.uploadData(this.recordId, {})
                    .then(function() {
                        fail('Promise should have rejected');
                    }, function(response) {
                        expect(response).toEqual('Error Message');
                    });
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                    status: 400,
                    statusText: 'Error Message'
                }));
            });
            it('successfully', function() {
                $httpBackend.expectPOST('/mobirest/datasets/' + encodeURIComponent(this.recordId) + '/data',
                    function(data) {
                        return data instanceof FormData;
                    }, function(headers) {
                        return headers['Content-Type'] === undefined;
                    }).respond(200);
                datasetManagerSvc.uploadData(this.recordId, {})
                    .then(_.noop, function() {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).not.toHaveBeenCalled();
            });
        });
    });
    describe('initialize should call the correct method when getDatasetRecords was', function() {
        it('resolved', function() {
            var datasetRecord = [{'@id': 'dataset', '@type': [prefixes.dataset + 'DatasetRecord']}];
            spyOn(datasetManagerSvc, 'getDatasetRecords').and.returnValue($q.when({data: [[datasetRecord]]}));
            datasetManagerSvc.initialize();
            scope.$apply();
            var config = {
                sortOption: {
                    field: prefixes.dcterms + 'title'
                }
            };
            expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalledWith(config);
            expect(datasetManagerSvc.datasetRecords).toEqual([[datasetRecord]]);
        });
        it('rejected', function() {
            spyOn(datasetManagerSvc, 'getDatasetRecords').and.returnValue($q.reject('error'));
            datasetManagerSvc.initialize();
            scope.$apply();
            var config = {
                sortOption: {
                    field: prefixes.dcterms + 'title'
                }
            };
            expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalledWith(config);
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('error');
        });
    });
    describe('should retrieve the ontology identifiers for a dataset', function() {
        beforeEach(function () {
            this.identifier = {'@id': 'id'};
            this.record = _.set({}, "['" + prefixes.dataset + "ontology'][0]", this.identifier);
            this.arr = [this.identifier, {'@id': 'extra'}, this.record];
        });
        it('if passed the record', function() {
            spyOn(datasetManagerSvc, 'getRecordFromArray').and.returnValue(this.record);
            expect(datasetManagerSvc.getOntologyIdentifiers(this.arr)).toEqual([this.identifier]);
        });
        it('if not passed the record', function() {
            expect(datasetManagerSvc.getOntologyIdentifiers(this.arr, this.record)).toEqual([this.identifier]);
        });
    });
});
