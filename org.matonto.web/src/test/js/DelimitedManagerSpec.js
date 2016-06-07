describe('Delimited Manager service', function() {
    var $httpBackend,
        delimitedManagerSvc,
        windowSvc;

    beforeEach(function() {
        module('delimitedManager');
        module(function($provide) {
            $provide.service('$window', function() {
                this.location = '';
            });
        });

        inject(function(delimitedManagerService, _$window_, _$httpBackend_) {
            delimitedManagerSvc = delimitedManagerService;
            windowSvc = _$window_;
            $httpBackend = _$httpBackend_;
        });
    });

    it('should upload a delimited file', function(done) {
        //Do httpBackend when or expect
        $httpBackend.expectPOST('/matontorest/delimited-files', 
            function(data) {
                return data instanceof FormData;
            }, function(headers) {
                return headers['Content-Type'] === undefined;
            }).respond(200, '');
        //Call method
        delimitedManagerSvc.upload({}).then(function(value) {
            expect(value).toEqual('');
            done();
        });
        //Call httpBackend.flush()
        $httpBackend.flush();
    });
    describe('should retrieve a preview of an uploaded delimited file', function() {
        it('with headers', function(done) {
            var fileName = 'test';
            var rowEnd = 5;
            var separator = ',';
            var preview = [[''], [''], [''], [''], ['']];
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': separator
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + fileName + params, undefined)
                .respond(200, preview);
            delimitedManagerSvc.previewFile(fileName, rowEnd, separator, true).then(function(filePreview) {
                expect(typeof filePreview).toBe('object');
                expect(filePreview.headers).toEqual(preview[0]);
                expect(filePreview.rows.length).toBe(preview.length - 1);
                done();
            });
            $httpBackend.flush();
        });
        it('without headers', function(done) {
            var fileName = 'test';
            var rowEnd = 5;
            var separator = '\t';
            var preview = [[''], [''], [''], [''], ['']];
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': encodeURIComponent(separator)
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + fileName + params, undefined)
                .respond(200, preview);
            delimitedManagerSvc.previewFile(fileName, rowEnd, separator, false).then(function(filePreview) {
                expect(typeof filePreview).toBe('object');
                expect(filePreview.headers).not.toEqual(preview[0]);
                expect(filePreview.headers.length).toBe(preview[0].length);
                expect(filePreview.rows.length).toBe(preview.length);
                done();
            });
            $httpBackend.flush();
        });
    });
    describe('should return mapped data from an uploaded delimited file', function() {
        it('using an uploaded mapping', function() {
            var fileName = 'test';
            var mappingFileName = 'mapping';
            var separator = ',';
            var containsHeaders = true;
            var format = 'jsonld';
            var params = createQueryString({
                'format': format,
                'mappingName': mappingFileName,
                'containsHeaders': containsHeaders, 
                'separator': separator
            });
            delimitedManagerSvc.map(fileName, mappingFileName, containsHeaders, separator);
            expect(windowSvc.location).toEqual('/matontorest/delimited-files/' + fileName + '/map' + params);
        });
    });
    describe('should return a preview of mapped data from an uploaded delimited file', function() {
        it('as JSON-LD using mapping JSON-LD', function(done) {
            var fileName = 'test';
            var jsonld = '';
            var separator = ',';
            var containsHeaders = true;
            var format = 'jsonld';
            var params = createQueryString({
                'containsHeaders': containsHeaders, 
                'format': format,
                'separator': separator
            });
            $httpBackend.expectPOST('/matontorest/delimited-files/' + fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'application/json';
                }).respond(200, []);
            delimitedManagerSvc.previewMap(fileName, jsonld, containsHeaders, format, separator).then(function(value) {
                expect(Array.isArray(value)).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
        it('as other formats using mapping JSON-LD', function(done) {
            var fileName = 'test';
            var jsonld = '';
            var separator = ',';
            var containsHeaders = true;
            var format = 'turtle';
            var params = createQueryString({
                'containsHeaders': containsHeaders, 
                'format': format,
                'separator': separator
            });
            $httpBackend.expectPOST('/matontorest/delimited-files/' + fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, []);
            delimitedManagerSvc.previewMap(fileName, jsonld, containsHeaders, format, separator).then(function(value) {
                expect(Array.isArray(value)).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
});