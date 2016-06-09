describe('CSV Manager service', function() {
    var $httpBackend,
        csvManagerSvc,
        windowSvc;

    beforeEach(function() {
        module('csvManager');
        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
        });

        inject(function(csvManagerService, _$window_, _$httpBackend_) {
            csvManagerSvc = csvManagerService;
            windowSvc = _$window_;
            $httpBackend = _$httpBackend_;
        });
    });

    it('should upload a delimited file', function(done) {
        //Do httpBackend when or expect
        $httpBackend.expectPOST('/matontorest/csv', 
            function(data) {
                return data instanceof FormData;
            }, function(headers) {
                return headers['Content-Type'] === undefined;
            }).respond(200, '');
        //Call method
        csvManagerSvc.upload({}).then(function(value) {
            expect(value).toEqual('');
            done();
        });
        //Call httpBackend.flush()
        $httpBackend.flush();
    });
    describe('should retrieve a preview of an uploaded delimited file', function() {
        it('unless there are no rows', function() {
            csvManagerSvc.fileName = 'test';
            csvManagerSvc.separator = ',';
            csvManagerSvc.containsHeaders = true;
            var rowEnd = 5;
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': csvManagerSvc.separator
            });
            $httpBackend.expectGET('/matontorest/csv/' + csvManagerSvc.fileName + params, undefined)
                .respond(200, []);
            csvManagerSvc.previewFile(rowEnd).then(function() {
                fail('Promise should have rejected');
            }, function(result) {
                expect(typeof result).toBe('string');
            });
            $httpBackend.flush();
        });
        it('with headers', function() {
            csvManagerSvc.fileName = 'test';
            csvManagerSvc.separator = ',';
            csvManagerSvc.containsHeaders = true;
            var rowEnd = 5;
            var preview = [[''], [''], [''], [''], ['']];
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': csvManagerSvc.separator
            });
            $httpBackend.expectGET('/matontorest/csv/' + csvManagerSvc.fileName + params, undefined)
                .respond(200, preview);
            csvManagerSvc.previewFile(rowEnd);
            $httpBackend.flush();
            expect(typeof csvManagerSvc.filePreview).toBe('object');
            expect(csvManagerSvc.filePreview.headers).toEqual(preview[0]);
            expect(csvManagerSvc.filePreview.rows.length).toBe(preview.length - 1);
        });
        it('without headers', function() {
            csvManagerSvc.fileName = 'test';
            csvManagerSvc.separator = '\t';
            csvManagerSvc.containsHeaders = false;
            var rowEnd = 5;
            var preview = [[''], [''], [''], [''], ['']];
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': encodeURIComponent(csvManagerSvc.separator)
            });
            $httpBackend.expectGET('/matontorest/csv/' + csvManagerSvc.fileName + params, undefined)
                .respond(200, preview);
            csvManagerSvc.previewFile(rowEnd);
            $httpBackend.flush();
            expect(typeof csvManagerSvc.filePreview).toBe('object');
            expect(csvManagerSvc.filePreview.headers).not.toEqual(preview[0]);
            expect(csvManagerSvc.filePreview.headers.length).toBe(preview[0].length);
            expect(csvManagerSvc.filePreview.rows.length).toBe(preview.length);
        });
    });
    it('should return mapped data from an uploaded delimited file', function() {
        csvManagerSvc.fileName = 'test';
        csvManagerSvc.separator = ',';
        csvManagerSvc.containsHeaders = true;
        var mappingFileName = 'mapping';
        var format = 'jsonld';
        var params = createQueryString({
            'format': format,
            'mappingName': mappingFileName,
            'containsHeaders': csvManagerSvc.containsHeaders, 
            'separator': csvManagerSvc.separator
        });
        csvManagerSvc.map(mappingFileName, format);
        expect(windowSvc.location).toEqual('/matontorest/csv/test/map' + params);
    });
    describe('should return a preview of mapped data from an uploaded delimited file', function() {
        it('as JSON-LD using mapping JSON-LD', function(done) {
            csvManagerSvc.fileName = 'test';
            csvManagerSvc.separator = ',';
            csvManagerSvc.containsHeaders = true;
            var jsonld = '';
            var format = 'jsonld';
            var params = createQueryString({
                'containsHeaders': csvManagerSvc.containsHeaders, 
                'format': format,
                'separator': csvManagerSvc.separator
            });
            $httpBackend.expectPOST('/matontorest/csv/' + csvManagerSvc.fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'application/json';
                }).respond(200, []);
            csvManagerSvc.previewMap(jsonld, format).then(function(value) {
                expect(Array.isArray(value)).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
        it('as other formats using mapping JSON-LD', function(done) {
            csvManagerSvc.fileName = 'test';
            csvManagerSvc.separator = ',';
            csvManagerSvc.containsHeaders = true;
            var jsonld = '';
            var format = 'turtle';
            var params = createQueryString({
                'containsHeaders': csvManagerSvc.containsHeaders, 
                'format': format,
                'separator': csvManagerSvc.separator
            });
            $httpBackend.expectPOST('/matontorest/csv/' + csvManagerSvc.fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, []);
            csvManagerSvc.previewMap(jsonld, format).then(function(value) {
                expect(Array.isArray(value)).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
});