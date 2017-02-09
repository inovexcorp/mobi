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
    var $httpBackend,
        $httpParamSerializer,
        sparqlManagerSvc,
        windowSvc,
        utilSvc;

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
    });

    describe('should query the repository', function() {
        beforeEach(function() {
            var params = {
                limit: sparqlManagerSvc.limit,
                query: sparqlManagerSvc.queryString,
                offset: sparqlManagerSvc.currentPage * sparqlManagerSvc.limit
            }
            this.url = '/matontorest/sparql/page?' + $httpParamSerializer(params);
        });
        it('unless an error occurs', function(done) {
            var statusMessage = 'Error message';
            $httpBackend.expectGET(this.url).respond(400, undefined, undefined, statusMessage);
            sparqlManagerSvc.queryRdf();
            $httpBackend.flush();

            expect(sparqlManagerSvc.errorMessage).toEqual(statusMessage);
            expect(sparqlManagerSvc.currentPage).toBe(0);
            expect(sparqlManagerSvc.data).toBeUndefined();
            done();
        });
        it('unless something goes wrong', function(done) {
            var statusMessage = 'Status Message';
            $httpBackend.expectGET(this.url).respond(204, undefined, undefined, statusMessage);
            sparqlManagerSvc.queryRdf();
            $httpBackend.flush();

            expect(sparqlManagerSvc.infoMessage).toEqual(statusMessage);
            expect(sparqlManagerSvc.currentPage).toBe(0);
            expect(sparqlManagerSvc.data).toBeUndefined();
            done();
        });
        it('successfully', function(done) {
            var nextLink = 'http://example.com/next';
            var prevLink = 'http://example.com/prev';
            var headers = {
                'X-Total-Count': '10'
            };
            utilSvc.parseLinks.and.returnValue({next: nextLink, prev: prevLink});
            $httpBackend.expectGET(this.url).respond(200, {bindings: [], data: []}, headers);
            sparqlManagerSvc.queryRdf();
            $httpBackend.flush();

            expect(sparqlManagerSvc.data).toEqual([]);
            expect(sparqlManagerSvc.bindings).toEqual([]);
            expect(sparqlManagerSvc.totalSize).toEqual(headers['X-Total-Count']);
            expect(sparqlManagerSvc.links.next).toEqual(nextLink);
            expect(sparqlManagerSvc.links.prev).toEqual(prevLink);
            done();
        });
    });
    describe('should download query results', function() {
        beforeEach(function() {
            this.params = {
                query: sparqlManagerSvc.queryString,
                fileType: 'csv'
            };
        });
        it('with a file name', function() {
            this.params.fileName = 'test';
            sparqlManagerSvc.downloadResults(this.params.fileType, this.params.fileName);
            expect(windowSvc.location).toBe('/matontorest/sparql?' + $httpParamSerializer(this.params));
        });
        it('without a file name', function() {
            sparqlManagerSvc.downloadResults(this.params.fileType);
            expect(windowSvc.location).toBe('/matontorest/sparql?' + $httpParamSerializer(this.params));

            windowSvc.location = '';
            sparqlManagerSvc.downloadResults(this.params.fileType, '');
            expect(windowSvc.location).toBe('/matontorest/sparql?' + $httpParamSerializer(this.params));
        });
    });
});