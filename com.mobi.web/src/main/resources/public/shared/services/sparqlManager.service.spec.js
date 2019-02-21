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
describe('SPARQL Manager service', function() {
    var sparqlManagerSvc, $q, scope, $httpBackend, $httpParamSerializer, utilSvc;

    beforeEach(function() {
        module('shared');
        mockUtil();
        mockHttpService();
        injectRestPathConstant();

        inject(function(sparqlManagerService, _$q_, _$rootScope_, _$httpBackend_, _$httpParamSerializer_, _utilService_, _httpService_) {
            sparqlManagerSvc = sparqlManagerService;
            $q = _$q_;
            scope = _$rootScope_;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            utilSvc = _utilService_;
            httpSvc = _httpService_;
        });

        this.params = { query: sparqlManagerSvc.queryString };
    });

    afterEach(function() {
        sparqlManagerSvc = null;
        $q = null;
        scope = null;
        $httpBackend = null;
        $httpParamSerializer = null;
        utilSvc = null;
    });

    it('should reset the state variables', function() {
        sparqlManagerSvc.reset();
        expect(sparqlManagerSvc.prefixes).toEqual([]);
        expect(sparqlManagerSvc.queryString).toEqual('');
        expect(sparqlManagerSvc.datasetRecordIRI).toEqual('');
        expect(sparqlManagerSvc.data).toEqual(undefined);
        expect(sparqlManagerSvc.errorMessage).toEqual('');
        expect(sparqlManagerSvc.infoMessage).toEqual('Please submit a query to see results here.');
        expect(sparqlManagerSvc.currentPage).toEqual(1);
        expect(sparqlManagerSvc.links).toEqual({next: '', prev: ''});
        expect(sparqlManagerSvc.totalSize).toEqual(0);
        expect(sparqlManagerSvc.bindings).toEqual([]);
    });
    describe('should query the repository', function() {
        beforeEach(function () {
            this.query = 'query';
            this.url = '/mobirest/sparql';
            this.data = {head: {}};
            this.id = 'id';
        });
        describe('with a dataset', function() {
            beforeEach(function() {
                this.dataset = 'dataset';
            });
            describe('when id is set', function() {
                it('unless an error occurs', function() {
                    httpSvc.get.and.returnValue($q.reject({statusText: 'Error Message'}));
                    sparqlManagerSvc.query(this.query, this.dataset, this.id).then(function() {
                        fail('Promise should have rejected');
                    });
                    scope.$apply();
                    expect(httpSvc.get).toHaveBeenCalledWith(this.url, {params: {query: this.query, dataset: this.dataset}}, this.id);
                    expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                });
                it('successfully', function() {
                    httpSvc.get.and.returnValue($q.when({data: this.data}));
                    var self = this;
                    sparqlManagerSvc.query(this.query, this.dataset, this.id)
                        .then(function(response) {
                            expect(response).toEqual(self.data);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(httpSvc.get).toHaveBeenCalledWith(this.url, {params: {query: this.query, dataset: this.dataset}}, this.id);
                });
            });
            describe('when id is not set', function() {
                it('unless an error occurs', function() {
                    $httpBackend.expectGET(this.url + '?' + $httpParamSerializer({query: this.query})).respond(400, null, null, 'Error Message');
                    sparqlManagerSvc.query(this.query)
                        .then(function(response) {
                            fail('Promise should have rejected');
                        });
                    flushAndVerify($httpBackend);
                    expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                });
                it('successfully', function() {
                    $httpBackend.expectGET(this.url + '?' + $httpParamSerializer({query: this.query})).respond(200, this.data);
                    var self = this;
                    sparqlManagerSvc.query(this.query)
                        .then(function(response) {
                            expect(response).toEqual(self.data);
                        }, function(error) {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                });
            });
        });
        describe('without a dataset', function() {
            describe('when id is set', function() {
                it('unless an error occurs', function() {
                    httpSvc.get.and.returnValue($q.reject({statusText: 'Error Message'}));
                    sparqlManagerSvc.query(this.query, '', this.id)
                        .then(function() {
                            fail('Promise should have rejected');
                        });
                    scope.$apply();
                    expect(httpSvc.get).toHaveBeenCalledWith(this.url, {params: {query: this.query}}, this.id);
                    expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                });
                it('successfully', function() {
                    httpSvc.get.and.returnValue($q.when({data: this.data}));
                    var self = this;
                    sparqlManagerSvc.query(this.query, '', this.id)
                        .then(function(response) {
                            expect(response).toEqual(self.data);
                        }, function() {
                            fail('Promise should have resolved');
                        });
                    scope.$apply();
                    expect(httpSvc.get).toHaveBeenCalledWith(this.url, {params: {query: this.query}}, this.id);
                });
            });
            describe('when id is not set', function() {
                it('unless an error occurs', function() {
                    $httpBackend.expectGET(this.url + '?' + $httpParamSerializer({query: this.query})).respond(400, null, null, 'Error Message');
                    sparqlManagerSvc.query(this.query)
                        .then(function(response) {
                            fail('Promise should have rejected');
                        });
                    flushAndVerify($httpBackend);
                    expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({statusText: 'Error Message'}));
                });
                it('successfully', function() {
                    $httpBackend.expectGET(this.url + '?' + $httpParamSerializer({query: this.query})).respond(200, this.data);
                    var self = this;
                    sparqlManagerSvc.query(this.query)
                        .then(function(response) {
                            expect(response).toEqual(self.data);
                        }, function(error) {
                            fail('Promise should have resolved');
                        });
                    flushAndVerify($httpBackend);
                });
            });
        });
    });
    describe('pagedQuery should call the correct method', function() {
        beforeEach(function() {
            this.paramsObj = {
                limit: 10,
                page: 1
            };
            this.config = {
                query: 'query',
                limit: 10,
                offset: 10
            };
            this.url = '/mobirest/sparql/page?';
        });
        it('with a dataset', function() {
            this.paramsObj.datasetRecordIRI = 'record-id';
            this.config.dataset = 'record-id';
            this.url += $httpParamSerializer(this.config);
            $httpBackend.expectGET(this.url).respond(200);
            sparqlManagerSvc.pagedQuery('query', this.paramsObj)
                .then(function(response) {
                    expect(response).toEqual(jasmine.objectContaining({status: 200}));
                }, function() {
                    fail('Promise should have resolved');
                });
            flushAndVerify($httpBackend);
        });
        describe('when $http.get', function() {
            beforeEach(function() {
                this.url += $httpParamSerializer(this.config);
            });
            it('resolves', function() {
                $httpBackend.expectGET(this.url).respond(200);
                sparqlManagerSvc.pagedQuery('query', this.paramsObj)
                    .then(function(response) {
                        expect(response).toEqual(jasmine.objectContaining({status: 200}));
                    }, function() {
                        fail('Promise should have resolved');
                    });
                flushAndVerify($httpBackend);
            });
            it('rejects', function() {
                $httpBackend.expectGET(this.url).respond(400);
                sparqlManagerSvc.pagedQuery('query', this.paramsObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    });
                flushAndVerify($httpBackend);
                expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400}));
            });
        });
        describe('with an id and httpService.get', function() {
            beforeEach(function() {
                this.paramsObj.id = 'id';
            });
            it('resolves', function() {
                httpSvc.get.and.returnValue($q.when({status: 200}));
                sparqlManagerSvc.pagedQuery('query', this.paramsObj)
                    .then(function(response) {
                        expect(response).toEqual({status: 200});
                    }, function() {
                        fail('Promise should have resolved');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith(this.url.slice(0, -1), {params: this.config}, 'id');
            });
            it('rejects', function() {
                httpSvc.get.and.returnValue($q.reject({status: 400}));
                sparqlManagerSvc.pagedQuery('query', this.paramsObj)
                    .then(function() {
                        fail('Promise should have rejected');
                    });
                scope.$apply();
                expect(httpSvc.get).toHaveBeenCalledWith(this.url.slice(0, -1), {params: this.config}, 'id');
                expect(utilSvc.rejectError).toHaveBeenCalledWith({status: 400});
            });
        });
    });
    describe('should retrieve a page of a query against the repository', function() {
        beforeEach(function() {
            this.params.limit = sparqlManagerSvc.limit;
            this.params.offset = (sparqlManagerSvc.currentPage - 1) * sparqlManagerSvc.limit;
            this.url = '/mobirest/sparql/page?';
        });
        it('with a dataset', function() {
            sparqlManagerSvc.datasetRecordIRI = 'dataset';
            this.params.dataset = sparqlManagerSvc.datasetRecordIRI;
            this.url += $httpParamSerializer(this.params);
            $httpBackend.expectGET(this.url).respond(200);
            sparqlManagerSvc.queryRdf();
            flushAndVerify($httpBackend);
        });
        it('unless an error occurs', function() {
            this.url += $httpParamSerializer(this.params);
            var statusMessage = 'Error message';
            var details = 'Details';
            utilSvc.getErrorMessage.and.returnValue(statusMessage);
            $httpBackend.expectGET(this.url).respond(400, {details: details}, undefined, statusMessage);
            sparqlManagerSvc.queryRdf();
            flushAndVerify($httpBackend);
            expect(sparqlManagerSvc.errorMessage).toEqual(statusMessage);
            expect(sparqlManagerSvc.errorDetails).toEqual(details);
            expect(sparqlManagerSvc.currentPage).toBe(1);
            expect(sparqlManagerSvc.data).toBeUndefined();
        });
        it('when returning no bindings', function() {
            this.url += $httpParamSerializer(this.params);
            $httpBackend.expectGET(this.url).respond(200, {bindings: [], data: []});
            sparqlManagerSvc.queryRdf();
            flushAndVerify($httpBackend);

            expect(sparqlManagerSvc.infoMessage).toEqual('There were no results for the submitted query.');
            expect(sparqlManagerSvc.currentPage).toBe(1);
            expect(sparqlManagerSvc.data).toBeUndefined();
        });
        it('when returning bindings', function() {
            this.url += $httpParamSerializer(this.params);
            var nextLink = 'http://example.com/next';
            var prevLink = 'http://example.com/prev';
            var headers = {
                'X-Total-Count': '10'
            };
            utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
            $httpBackend.expectGET(this.url).respond(200, {bindings: [''], data: []}, headers);
            sparqlManagerSvc.queryRdf();
            flushAndVerify($httpBackend);

            expect(sparqlManagerSvc.data).toEqual([]);
            expect(sparqlManagerSvc.bindings).toEqual(['']);
            expect(sparqlManagerSvc.totalSize).toEqual(headers['X-Total-Count']);
            expect(sparqlManagerSvc.links.next).toEqual(nextLink);
            expect(sparqlManagerSvc.links.prev).toEqual(prevLink);
        });
    });
    describe('should download query results', function() {
        beforeEach(function() {
            this.params.fileType = 'csv';
        });
        it('with a dataset', function() {
            sparqlManagerSvc.datasetRecordIRI = 'dataset';
            this.params.dataset = sparqlManagerSvc.datasetRecordIRI;
            sparqlManagerSvc.downloadResults(this.params.fileType);
            expect(utilSvc.startDownload).toHaveBeenCalledWith('/mobirest/sparql?' + $httpParamSerializer(this.params));
        });
        it('with a file name', function() {
            this.params.fileName = 'test';
            sparqlManagerSvc.downloadResults(this.params.fileType, this.params.fileName);
            expect(utilSvc.startDownload).toHaveBeenCalledWith('/mobirest/sparql?' + $httpParamSerializer(this.params));
        });
        it('without a file name', function() {
            sparqlManagerSvc.downloadResults(this.params.fileType);
            expect(utilSvc.startDownload).toHaveBeenCalledWith('/mobirest/sparql?' + $httpParamSerializer(this.params));

            sparqlManagerSvc.downloadResults(this.params.fileType, '');
            expect(utilSvc.startDownload).toHaveBeenCalledWith('/mobirest/sparql?' + $httpParamSerializer(this.params));
        });
    });
});
