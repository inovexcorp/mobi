describe('SPARQL Manager service', function() {
    var $httpBackend,
        sparqlSvc;

    beforeEach(function() {
        module('sparqlManager');

        inject(function(sparqlService, _$httpBackend_) {
            sparqlSvc = sparqlService;
            $httpBackend = _$httpBackend_;
        });
    });

    describe('testing queryRdf', function() {
        it('should query the repository', function(done) {
            var response = {
                head: {},
                results: {}
            };

            $httpBackend.expectGET('/matontorest/query?query=').respond(200, response);
            sparqlSvc.queryRdf().then(function() {
                expect(sparqlSvc.data).toEqual(response);
                done();
            });

            $httpBackend.flush();
        });
    });
});