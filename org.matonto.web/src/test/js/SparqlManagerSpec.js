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
describe('SPARQL Manager service', function() {
    var $httpBackend, $httpParamSerializer, sparqlManagerSvc, windowSvc, utilSvc, params;

    beforeEach(function() {
        module('sparqlManager');
        mockUtil();

        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
        });

        inject(function(sparqlManagerService, _$httpBackend_, _$httpParamSerializer_, _$window_, _utilService_) {
            sparqlManagerSvc = sparqlManagerService;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            windowSvc = _$window_;
            utilSvc = _utilService_;
        });

        params = { query: sparqlManagerSvc.queryString };
    });

    describe('should query the repository', function() {
        beforeEach(function() {
            params.limit = sparqlManagerSvc.limit;
            params.offset = sparqlManagerSvc.currentPage * sparqlManagerSvc.limit;
            this.url = '/matontorest/sparql/page?';
        });
        it('with a dataset', function() {
            sparqlManagerSvc.datasetRecordIRI = 'dataset';
            params.dataset = sparqlManagerSvc.datasetRecordIRI;
            this.url += $httpParamSerializer(params);
            $httpBackend.expectGET(this.url).respond(200);
            sparqlManagerSvc.queryRdf();
            $httpBackend.flush();
            expect(true).toBe(true);
        });
        it('unless an error occurs', function() {
            this.url += $httpParamSerializer(params);
            var statusMessage = 'Error message';
            utilSvc.getErrorMessage.and.returnValue(statusMessage);
            $httpBackend.expectGET(this.url).respond(400, undefined, undefined, statusMessage);
            sparqlManagerSvc.queryRdf();
            $httpBackend.flush();

            expect(sparqlManagerSvc.errorMessage).toEqual(statusMessage);
            expect(sparqlManagerSvc.currentPage).toBe(0);
            expect(sparqlManagerSvc.data).toBeUndefined();
        });
        it('when returning no bindings', function(done) {
            this.url += $httpParamSerializer(params);
            $httpBackend.expectGET(this.url).respond(200, {bindings: [], data: []});
            sparqlManagerSvc.queryRdf();
            $httpBackend.flush();

            expect(sparqlManagerSvc.infoMessage).toEqual('There were no results for the submitted query.');
            expect(sparqlManagerSvc.currentPage).toBe(0);
            expect(sparqlManagerSvc.data).toBeUndefined();
            done();
        });
        it('when returning bindings', function(done) {
            this.url += $httpParamSerializer(params);
            var nextLink = 'http://example.com/next';
            var prevLink = 'http://example.com/prev';
            var headers = {
                'X-Total-Count': '10'
            };
            utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
            $httpBackend.expectGET(this.url).respond(200, {bindings: [''], data: []}, headers);
            sparqlManagerSvc.queryRdf();
            $httpBackend.flush();

            expect(sparqlManagerSvc.data).toEqual([]);
            expect(sparqlManagerSvc.bindings).toEqual(['']);
            expect(sparqlManagerSvc.totalSize).toEqual(headers['X-Total-Count']);
            expect(sparqlManagerSvc.links.next).toEqual(nextLink);
            expect(sparqlManagerSvc.links.prev).toEqual(prevLink);
            done();
        });
    });
    describe('should download query results', function() {
        beforeEach(function() {
            params.fileType = 'csv';
        });
        it('with a dataset', function() {
            sparqlManagerSvc.datasetRecordIRI = 'dataset';
            params.dataset = sparqlManagerSvc.datasetRecordIRI;
            sparqlManagerSvc.downloadResults(params.fileType);
            expect(windowSvc.location).toBe('/matontorest/sparql?' + $httpParamSerializer(params));
        });
        it('with a file name', function() {
            params.fileName = 'test';
            sparqlManagerSvc.downloadResults(params.fileType, params.fileName);
            expect(windowSvc.location).toBe('/matontorest/sparql?' + $httpParamSerializer(params));
        });
        it('without a file name', function() {
            sparqlManagerSvc.downloadResults(params.fileType);
            expect(windowSvc.location).toBe('/matontorest/sparql?' + $httpParamSerializer(params));

            windowSvc.location = '';
            sparqlManagerSvc.downloadResults(params.fileType, '');
            expect(windowSvc.location).toBe('/matontorest/sparql?' + $httpParamSerializer(params));
        });
    });
});