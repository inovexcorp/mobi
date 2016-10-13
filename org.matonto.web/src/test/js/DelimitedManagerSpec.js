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
        $httpBackend.expectPOST('/matontorest/delimited-files', 
            function(data) {
                return data instanceof FormData;
            }, function(headers) {
                return headers['Content-Type'] === undefined;
            }).respond(200, '');
        delimitedManagerSvc.upload({}).then(function(value) {
            expect(value).toEqual('');
            done();
        });
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
        it('successfully', function() {
            delimitedManagerSvc.fileName = 'test';
            delimitedManagerSvc.separator = ',';
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
            expect(_.isArray(delimitedManagerSvc.dataRows)).toBe(true);
            expect(delimitedManagerSvc.dataRows.length).toBe(preview.length);
        });
    });
    it('should return mapped data from an uploaded delimited file', function() {
        var fileName = 'test';
        delimitedManagerSvc.fileName = 'test';
        delimitedManagerSvc.separator = ',';
        delimitedManagerSvc.containsHeaders = true;
        var mappingId = 'mapping';
        var format = 'jsonld';
        var params = createQueryString({
            'format': format,
            'mappingIRI': mappingId,
            'containsHeaders': delimitedManagerSvc.containsHeaders, 
            'separator': delimitedManagerSvc.separator,
            'fileName': fileName
        });
        delimitedManagerSvc.map(mappingId, format, fileName);
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
    describe('should retrieve the header name of a column based on the index', function() {
        beforeEach(function() {
            this.index = 0;
        })
        it('if there are no data rows', function() {
            delimitedManagerSvc.dataRows = undefined;
            var result = delimitedManagerSvc.getHeader(this.index);
            expect(result).toContain(`${this.index}`);
        });
        it('if the data rows contain a header row', function() {
            delimitedManagerSvc.dataRows = [['']];
            delimitedManagerSvc.containsHeaders = true;
            var result = delimitedManagerSvc.getHeader(this.index);
            expect(result).toBe(delimitedManagerSvc.dataRows[0][this.index]);
        });
        it('if the data rows do not contain a header row', function() {
            delimitedManagerSvc.dataRows = [['']];
            delimitedManagerSvc.containsHeaders = false;
            var result = delimitedManagerSvc.getHeader(this.index);
            expect(result).toContain(`${this.index}`);
        });
    });
    it('should reset important variables', function() {
        delimitedManagerSvc.reset();
        expect(delimitedManagerSvc.dataRows).toBe(undefined);
        expect(delimitedManagerSvc.fileName).toBe('');
        expect(delimitedManagerSvc.separator).toBe(',');
        expect(delimitedManagerSvc.containsHeaders).toBe(true);
        expect(delimitedManagerSvc.preview).toBe('');
    });
});