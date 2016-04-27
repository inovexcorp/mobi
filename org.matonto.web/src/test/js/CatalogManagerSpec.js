describe('Catalog Manager service', function() {
    var $httpBackend,
        catalogManagerSvc;

    mockPrefixes();
    beforeEach(function() {
        module('catalogManager');

        inject(function(catalogManagerService, _$httpBackend_) {
            catalogManagerSvc = catalogManagerService;
            $httpBackend = _$httpBackend_;
        });
    });

    it('should retrieve all resource types in the catalog', function(done) {
        $httpBackend.expectGET('/matontorest/catalog/resource-types').respond(200, ['Resource']);
        catalogManagerSvc.getResourceTypes().then(function(value) {
            expect(value).toEqual(['Resource']);
            done();
        });
        $httpBackend.flush();
    });
    describe('should get the results of a query for resources', function() {
        it('without a type', function(done) {
            var limit = 10;
            var start = 0;
            var type = '';
            var order = 'title';
            var params = createQueryString({
                limit: limit,
                start: start
            });
            $httpBackend.expectGET('/matontorest/catalog/resources' + params).respond(200, {});
            catalogManagerSvc.getResources(limit, start, type, order).then(function(value) {
                expect(value).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
        it('with a type', function(done) {
            var limit = 10;
            var start = 0;
            var type = 'Resource';
            var order = 'title';
            var params = createQueryString({
                limit: limit,
                start: start,
                type: type
            });
            $httpBackend.expectGET('/matontorest/catalog/resources' + params).respond(200, {});
            catalogManagerSvc.getResources(limit, start, type, order).then(function(value) {
                expect(value).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should get a results page from the passed URL', function(done) {
        var url = '/test/';
        $httpBackend.expectGET(url).respond(200, {});
        catalogManagerSvc.getResultsPage(url).then(function(value) {
            expect(value).toEqual({});
            done();
        });
        $httpBackend.flush();
    });
    describe('should retrieve the specified resource', function() {
        it('if it exists', function(done) {
            var resourceId = 'test';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(resourceId)).respond(200, {});
            catalogManagerSvc.getResource(resourceId).then(function(value) {
                expect(value).toEqual({});
                done();
            });
            $httpBackend.flush();
        });
        it('unless it does not exist', function(done) {
            var resourceId = 'test';
            $httpBackend.expectGET('/matontorest/catalog/resources/' + encodeURIComponent(resourceId)).respond(204);
            catalogManagerSvc.getResource(resourceId).catch(function(value) {
                expect(value).toBe('Resource does not exist');
                done();
            });
            $httpBackend.flush();
        });
    });
    it('should get the type from an IRI', function() {
        var result = catalogManagerSvc.getType('test');
        expect(typeof result).toBe('string');
    });
    it('should get a date object from a resource date', function() {
        var testDate = {
            year: 2000,
            month: 1,
            day: 1,
            hour: 1,
            minute: 1,
            second: 1
        };
        var result = catalogManagerSvc.getDate(testDate);
        expect(result instanceof Date).toBe(true);
        expect(result.getFullYear()).toBe(testDate.year);
        expect(result.getMonth()).toBe(testDate.month - 1);
        expect(result.getDate()).toBe(testDate.day);
        expect(result.getHours()).toBe(testDate.hour);
        expect(result.getMinutes()).toBe(testDate.minute);
        expect(result.getSeconds()).toBe(testDate.second);
    });
});