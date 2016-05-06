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

        url = '/matontorest/query?limit=' + sparqlManagerSvc.limit + '&query=';
    });

    it('should query the repository', function(done) {
        var response = {
            head: {},
            results: {}
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