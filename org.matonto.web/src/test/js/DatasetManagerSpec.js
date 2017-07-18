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
describe('Dataset Manager service', function() {
    var $httpBackend,
        $httpParamSerializer,
        datasetManagerSvc,
        catalogManagerSvc,
        utilSvc,
        $q,
        scope,
        prefixes,
        discoverStateSvc,
        recordId = 'http://matonto.org/records/test';

    beforeEach(function() {
        module('datasetManager');
        mockUtil();
        mockPrefixes();
        mockDiscoverState();
        mockCatalogManager();

        inject(function(datasetManagerService, _catalogManagerService_, _$httpBackend_, _$httpParamSerializer_, _$q_, _utilService_, _$rootScope_, _prefixes_, _discoverStateService_) {
            datasetManagerSvc = datasetManagerService;
            catalogManagerSvc = _catalogManagerService_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            $q = _$q_;
            utilSvc = _utilService_;
            scope = _$rootScope_;
            prefixes = _prefixes_;
            discoverStateSvc = _discoverStateService_;
        });

        utilSvc.paginatedConfigToParams.and.callFake(_.identity);
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
        it('unless an error occurs', function(done) {
            $httpBackend.whenGET('/matontorest/datasets').respond(400, null, null, 'Error Message');
            datasetManagerSvc.getDatasetRecords().then(function(response) {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with all config passed', function(done) {
            var params = $httpParamSerializer(this.config);
            $httpBackend.whenGET('/matontorest/datasets?' + params).respond(200, []);
            datasetManagerSvc.getDatasetRecords(this.config).then(function(response) {
                expect(response.data).toEqual([]);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        it('without any config', function(done) {
            $httpBackend.whenGET('/matontorest/datasets').respond(200, []);
            datasetManagerSvc.getDatasetRecords().then(function(response) {
                expect(response.data).toEqual([]);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should create a new Record', function() {
        var record;
        beforeEach(function() {
            this.recordConfig = {
                title: 'Title',
                repositoryId: 'repo',
                datasetIRI: 'dataset',
                description: 'Description',
                keywords: ['keyword0', 'keyword1'],
                ontologies: ['ontology1', 'ontology2']
            };
            record = {'@id': recordId};
            record[prefixes.dcterms + 'title'] = [{'@value': this.recordConfig.title}];
        });
        it('unless an error occurs', function(done) {
            $httpBackend.expectPOST('/matontorest/datasets',
                function(data) {
                    return data instanceof FormData;
                }).respond(400, null, null, 'Error Message');
            datasetManagerSvc.createDatasetRecord(this.recordConfig).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with a datasetIRI, description, keywords, and ontologies', function(done) {
            $httpBackend.expectPOST('/matontorest/datasets',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, recordId);
            datasetManagerSvc.createDatasetRecord(this.recordConfig).then(function(response) {
                expect(datasetManagerSvc.datasetRecords).toContain(record);
                expect(response).toBe(recordId);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        it('without a datasetIRI, description, keywords, or ontologies', function(done) {
            delete this.recordConfig.datasetIRI;
            delete this.recordConfig.description;
            delete this.recordConfig.keywords;
            delete this.recordConfig.ontologies;
            $httpBackend.expectPOST('/matontorest/datasets',
                function(data) {
                    return data instanceof FormData;
                }).respond(200, recordId);
            datasetManagerSvc.createDatasetRecord(this.recordConfig).then(function(response) {
                expect(datasetManagerSvc.datasetRecords).toContain(record);
                expect(response).toBe(recordId);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should delete a DatasetRecord', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/datasets/' + encodeURIComponent(recordId) + '?force=false').respond(400, null, null, 'Error Message');
            datasetManagerSvc.deleteDatasetRecord(recordId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with force delete', function(done) {
            var datasetRecord = {'@id': recordId, '@type': [prefixes.dataset + 'DatasetRecord']};
            datasetManagerSvc.datasetRecords = [datasetRecord];
            $httpBackend.whenDELETE('/matontorest/datasets/' + encodeURIComponent(recordId) + '?force=true').respond(200);
            datasetManagerSvc.deleteDatasetRecord(recordId, true).then(function() {
                expect(datasetManagerSvc.datasetRecords).toEqual([]);
                expect(discoverStateSvc.cleanUpOnDatasetDelete).toHaveBeenCalledWith(recordId);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        it('without force delete', function(done) {
            var datasetRecord = {'@id': recordId, '@type': [prefixes.dataset + 'DatasetRecord']};
            datasetManagerSvc.datasetRecords = [datasetRecord];
            $httpBackend.whenDELETE('/matontorest/datasets/' + encodeURIComponent(recordId) + '?force=false').respond(200);
            datasetManagerSvc.deleteDatasetRecord(recordId).then(function() {
                expect(datasetManagerSvc.datasetRecords).toEqual([]);
                expect(discoverStateSvc.cleanUpOnDatasetDelete).toHaveBeenCalledWith(recordId);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should clear a DatasetRecord', function() {
        it('unless an error occurs', function(done) {
            $httpBackend.whenDELETE('/matontorest/datasets/' + encodeURIComponent(recordId) + '/data?force=false').respond(400, null, null, 'Error Message');
            datasetManagerSvc.clearDatasetRecord(recordId).then(function() {
                fail('Promise should have rejected');
                done();
            }, function(response) {
                expect(response).toBe('Error Message');
                done();
            });
            $httpBackend.flush();
        });
        it('with force delete', function(done) {
            $httpBackend.whenDELETE('/matontorest/datasets/' + encodeURIComponent(recordId) + '/data?force=true').respond(200);
            datasetManagerSvc.clearDatasetRecord(recordId, true).then(function() {
                expect(discoverStateSvc.cleanUpOnDatasetClear).toHaveBeenCalledWith(recordId);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
        it('without force delete', function(done) {
            $httpBackend.whenDELETE('/matontorest/datasets/' + encodeURIComponent(recordId) + '/data?force=false').respond(200);
            datasetManagerSvc.clearDatasetRecord(recordId).then(function() {
                expect(discoverStateSvc.cleanUpOnDatasetClear).toHaveBeenCalledWith(recordId);
                done();
            }, function(response) {
                fail('Promise should have resolved');
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should update a DatasetRecord', function() {
        it('unless an error occurs', function(done) {
            catalogManagerSvc.updateRecord.and.returnValue($q.reject('Error Message'));
            datasetManagerSvc.updateDatasetRecord(recordId, '', '', '').then(function() {
                fail('Promise should have rejected');
                done();
            }, function() {
                expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith(recordId, '', '');
                expect(utilSvc.onError).toHaveBeenCalled();
                done();
            });
            scope.$apply();
        });
        it('on success.', function(done) {
            expected = [
                {'@id': 'record1', 'dcterms:title': [{'@value': 'title 1'}]}, 
                {'@id': 'record3', 'dcterms:title': [{'@value': 'title 3'}]},
                {'@id': recordId, 'dcterms:title': [{'@value': ''}]}
            ];
            datasetManagerSvc.datasetRecords = [
                {'@id': 'record1', 'dcterms:title': [{'@value': 'title 1'}]}, 
                {'@id': recordId, 'dcterms:title': [{'@value': 'title 2'}]}, 
                {'@id': 'record3', 'dcterms:title': [{'@value': 'title 3'}]}
            ];
            catalogManagerSvc.updateRecord.and.returnValue($q.resolve(''));
            datasetManagerSvc.updateDatasetRecord(recordId, '', '', '').then(function() {
                expect(catalogManagerSvc.updateRecord).toHaveBeenCalledWith(recordId, '', '');
                expect(datasetManagerSvc.datasetRecords).toEqual(expected);
                done();
            }, function() {
                fail('Promise should have resolved');
                done();
            });
            scope.$apply();
        });
    });
    describe('initialize should call the correct method when getDatasetRecords was', function() {
        it('resolved', function() {
            var datasetRecord = {'@id': 'dataset', '@type': [prefixes.dataset + 'DatasetRecord']};
            spyOn(datasetManagerSvc, 'getDatasetRecords').and.returnValue($q.when({data: [[datasetRecord]]}));
            datasetManagerSvc.initialize();
            scope.$apply();
            var config = {
                sortOption: {
                    field: prefixes.dcterms + 'title'
                }
            };
            expect(datasetManagerSvc.getDatasetRecords).toHaveBeenCalledWith(config);
            expect(datasetManagerSvc.datasetRecords).toEqual([datasetRecord]);
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
});
