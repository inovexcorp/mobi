describe('CSV Manager service', function() {
    var $httpBackend,
        csvManagerSvc,
        windowObj = {location: {}};

    beforeEach(function() {
        module(function($provide) {
            $provide.value('window', windowObj);
        });
    });

    beforeEach(function() {
        module('csvManager');

        inject(function(csvManagerService, _$httpBackend_) {
            csvManagerSvc = csvManagerService;
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
    it('should update a delimited file', function(done) {
        var fileName = 'test';
        $httpBackend.expectPUT('/matontorest/csv/' + fileName, 
            function(data) {
                return data instanceof FormData;
            }, function(headers) {
                return headers['Content-Type'] === undefined;
            }).respond(200, fileName);
        csvManagerSvc.update(fileName, {}).then(function(value) {
            expect(value).toEqual(fileName);
            done();
        });
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
            $httpBackend.expectGET('/matontorest/csv/' + fileName + params, undefined)
                .respond(200, preview);
            csvManagerSvc.previewFile(fileName, rowEnd, separator, true).then(function(filePreview) {
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
            $httpBackend.expectGET('/matontorest/csv/' + fileName + params, undefined)
                .respond(200, preview);
            csvManagerSvc.previewFile(fileName, rowEnd, separator, false).then(function(filePreview) {
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
        beforeEach()
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
            csvManagerSvc.map(fileName, mappingFileName, containsHeaders, separator);
            expect(window.location).toEqual('/matontorest/csv/' + fileName + '/map' + params);
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
            $httpBackend.expectPOST('/matontorest/csv/' + fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'application/json';
                }).respond(200, []);
            csvManagerSvc.previewMap(fileName, jsonld, containsHeaders, format, separator).then(function(value) {
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
            $httpBackend.expectPOST('/matontorest/csv/' + fileName + '/map-preview' + params, 
                function(data) {
                    return data instanceof FormData;
                }, function(headers) {
                    return headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain';
                }).respond(200, []);
            csvManagerSvc.previewMap(fileName, jsonld, containsHeaders, format, separator).then(function(value) {
                expect(Array.isArray(value)).toBe(true);
                done();
            });
            $httpBackend.flush();
        });
    });
});