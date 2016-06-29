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
        sparqlManagerSvc,
        url;

    beforeEach(function() {
        module('sparqlManager');

        inject(function(sparqlManagerService, _$httpBackend_) {
            sparqlManagerSvc = sparqlManagerService;
            $httpBackend = _$httpBackend_;
        });

        url = '/matontorest/sparql/page?limit=100&query=&start=0';
    });

    it('should query the repository', function(done) {
        var response = {
            paginatedResults: {
                links: {},
                limit: 100,
                start: 0,
                results: [],
                totalSize: 0
            },
            bindingNames: []
        };

        $httpBackend
            .expectGET(url)
            .respond(200, response);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.data).toEqual(response);
        done();
    });
    it('should set infoMessage', function(done) {
        var statusMessage = 'Status Message';

        $httpBackend
            .expectGET(url)
            .respond(204, undefined, undefined, statusMessage);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.infoMessage).toEqual(statusMessage);
        done();
    });
    it('should set infoMessage to default if not provided', function(done) {
        var defaultStatusMessage = 'There was a problem getting the results.';

        $httpBackend
            .expectGET(url)
            .respond(204);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.infoMessage).toEqual(defaultStatusMessage);
        done();
    });
    it('should set errorMessage', function(done) {
        var statusMessage = 'Status Message';

        $httpBackend
            .expectGET(url)
            .respond(400, undefined, undefined, statusMessage);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.errorMessage).toEqual(statusMessage);
        done();
    });
    it('should set errorMessage to default if not provided', function(done) {
        var defaultStatusMessage = 'A server error has occurred. Please try again later.';

        $httpBackend
            .expectGET(url)
            .respond(400);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.errorMessage).toEqual(defaultStatusMessage);
        done();
    });
});