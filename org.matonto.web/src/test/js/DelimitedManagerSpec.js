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
        it('unless there are no rows', function() {
            delimitedManagerSvc.fileName = 'test';
            delimitedManagerSvc.separator = ',';
            delimitedManagerSvc.containsHeaders = true;
            var rowEnd = 5;
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + params, undefined)
                .respond(200, []);
            delimitedManagerSvc.previewFile(rowEnd).then(function() {
                fail('Promise should have rejected');
            }, function(result) {
                expect(typeof result).toBe('string');
            });
            $httpBackend.flush();
        });
        it('with headers', function() {
            delimitedManagerSvc.fileName = 'test';
            delimitedManagerSvc.separator = ',';
            delimitedManagerSvc.containsHeaders = true;
            var rowEnd = 5;
            var preview = [[''], [''], [''], [''], ['']];
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + params, undefined)
                .respond(200, preview);
            delimitedManagerSvc.previewFile(rowEnd);
            $httpBackend.flush();
            expect(typeof delimitedManagerSvc.filePreview).toBe('object');
            expect(delimitedManagerSvc.filePreview.headers).toEqual(preview[0]);
            expect(delimitedManagerSvc.filePreview.rows.length).toBe(preview.length - 1);
        });
        it('without headers', function() {
            delimitedManagerSvc.fileName = 'test';
            delimitedManagerSvc.separator = '\t';
            delimitedManagerSvc.containsHeaders = false;
            var rowEnd = 5;
            var preview = [[''], [''], [''], [''], ['']];
            var params = createQueryString({
                'rowCount': rowEnd, 
                'separator': encodeURIComponent(delimitedManagerSvc.separator)
            });
            $httpBackend.expectGET('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + params, undefined)
                .respond(200, preview);
            delimitedManagerSvc.previewFile(rowEnd);
            $httpBackend.flush();
            expect(typeof delimitedManagerSvc.filePreview).toBe('object');
            expect(delimitedManagerSvc.filePreview.headers).not.toEqual(preview[0]);
            expect(delimitedManagerSvc.filePreview.headers.length).toBe(preview[0].length);
            expect(delimitedManagerSvc.filePreview.rows.length).toBe(preview.length);
        });
    });
    it('should return mapped data from an uploaded delimited file', function() {
        delimitedManagerSvc.fileName = 'test';
        delimitedManagerSvc.separator = ',';
        delimitedManagerSvc.containsHeaders = true;
        var mappingFileName = 'mapping';
        var format = 'jsonld';
        var params = createQueryString({
            'format': format,
            'mappingName': mappingFileName,
            'containsHeaders': delimitedManagerSvc.containsHeaders, 
            'separator': delimitedManagerSvc.separator
        });
        delimitedManagerSvc.map(mappingFileName, format);
        expect(windowSvc.location).toEqual('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map' + params);
    });
    describe('should return a preview of mapped data from an uploaded delimited file', function() {
        it('as JSON-LD using mapping JSON-LD', function(done) {
            delimitedManagerSvc.fileName = 'test';
            delimitedManagerSvc.separator = ',';
            delimitedManagerSvc.containsHeaders = true;
            var jsonld = '';
            var format = 'jsonld';
            var params = createQueryString({
                'containsHeaders': delimitedManagerSvc.containsHeaders, 
                'format': format,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'application/json';
                }).respond(200, []);
            delimitedManagerSvc.previewMap(jsonld, format).then(function(value) {
                expect(Array.isArray(value)).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
        it('as other formats using mapping JSON-LD', function(done) {
            delimitedManagerSvc.fileName = 'test';
            delimitedManagerSvc.separator = ',';
            delimitedManagerSvc.containsHeaders = true;
            var jsonld = '';
            var format = 'turtle';
            var params = createQueryString({
                'containsHeaders': delimitedManagerSvc.containsHeaders, 
                'format': format,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/matontorest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, []);
            delimitedManagerSvc.previewMap(jsonld, format).then(function(value) {
                expect(Array.isArray(value)).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
});