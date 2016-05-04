describe('SPARQL Manager service', function() {
    var $httpBackend,
        sparqlManagerSvc;

    beforeEach(function() {
        module('sparqlManager');

        inject(function(sparqlManagerService, _$httpBackend_) {
            sparqlManagerSvc = sparqlManagerService;
            $httpBackend = _$httpBackend_;
        });
    });

    it('should query the repository', function(done) {
        var response = {
            head: {},
            results: {}
        };

        $httpBackend
            .expectGET('/matontorest/query?query=')
            .respond(200, response);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.data).toEqual(response);
        done();
    });
    it('should set infoMessage', function(done) {
        var statusMessage = 'Status Message';

        $httpBackend
            .expectGET('/matontorest/query?query=')
            .respond(204, undefined, undefined, statusMessage);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.infoMessage).toEqual(statusMessage);
        done();
    });
    it('should set infoMessage to default if not provided', function(done) {
        var defaultStatusMessage = 'There was a problem getting the results.';

        $httpBackend
            .expectGET('/matontorest/query?query=')
            .respond(204);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.infoMessage).toEqual(defaultStatusMessage);
        done();
    });
    it('should set errorMessage', function(done) {
        var statusMessage = 'Status Message';

        $httpBackend
            .expectGET('/matontorest/query?query=')
            .respond(400, undefined, undefined, statusMessage);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.errorMessage).toEqual(statusMessage);
        done();
    });
    it('should set errorMessage to default if not provided', function(done) {
        var defaultStatusMessage = 'A server error has occurred. Please try again later.';

        $httpBackend
            .expectGET('/matontorest/query?query=')
            .respond(400);
        sparqlManagerSvc.queryRdf();
        $httpBackend.flush();

        expect(sparqlManagerSvc.errorMessage).toEqual(defaultStatusMessage);
        done();
    });
});