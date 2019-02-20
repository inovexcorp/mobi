/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
    var delimitedManagerSvc, $httpBackend, $httpParamSerializer, utilSvc, $q;

    beforeEach(function() {
        module('shared');
        mockUtil();
        injectRestPathConstant();

        inject(function(delimitedManagerService, _$httpBackend_, _$httpParamSerializer_, _utilService_, _$q_) {
            delimitedManagerSvc = delimitedManagerService;
            $httpBackend = _$httpBackend_;
            $httpParamSerializer = _$httpParamSerializer_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        this.mappingRecordIRI = 'http://test.org/mapping';
        this.datasetRecordIRI = 'http://test.org/record';
        this.ontologyRecordIRI = 'http://test.org/ontology';
        this.branchIRI = 'http://test.org/branch';
        this.update = false;

        delimitedManagerSvc.fileName = 'test';
        delimitedManagerSvc.separator = ',';
        delimitedManagerSvc.containsHeaders = true;
        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
    });

    afterEach(function() {
        delimitedManagerSvc = null;
        $httpBackend = null;
        $httpParamSerializer = null;
        utilSvc = null;
    });

    describe('should upload a delimited file', function() {
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/delimited-files', data => data instanceof FormData, headers => headers['Content-Type'] === undefined)
                .respond(400, null, null, 'Error Message');
            delimitedManagerSvc.upload({})
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectPOST('/mobirest/delimited-files', data => data instanceof FormData, headers => headers['Content-Type'] === undefined)
                .respond(200, '');
            delimitedManagerSvc.upload({})
                .then(value => expect(value).toEqual(''), response => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve a preview of an uploaded delimited file', function() {
        beforeEach(function () {
            this.rowEnd = 5;
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({
                'rowCount': this.rowEnd,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '?' + params).respond(400, null, null, 'Error Message');
            delimitedManagerSvc.previewFile(this.rowEnd)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('unless there are no rows', function() {
            var params = $httpParamSerializer({
                'rowCount': this.rowEnd,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '?' + params).respond(200, []);
            delimitedManagerSvc.previewFile(this.rowEnd)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('No rows were found'));
            flushAndVerify($httpBackend);
        });
        it('successfully', function() {
            var preview = [[''], [''], [''], [''], ['']];
            var params = $httpParamSerializer({
                'rowCount': this.rowEnd,
                'separator': delimitedManagerSvc.separator
            });
            $httpBackend.expectGET('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '?' + params).respond(200, preview);
            delimitedManagerSvc.previewFile(this.rowEnd);
            flushAndVerify($httpBackend);
            expect(_.isArray(delimitedManagerSvc.dataRows)).toBe(true);
            expect(delimitedManagerSvc.dataRows.length).toBe(preview.length);
        });
    });
    it('should return mapped data from an uploaded delimited file', function() {
        var fileName = 'test';
        var format = 'jsonld';
        var params = $httpParamSerializer({
            format: format,
            mappingRecordIRI: this.mappingRecordIRI,
            containsHeaders: delimitedManagerSvc.containsHeaders,
            separator: delimitedManagerSvc.separator,
            fileName: fileName
        });
        delimitedManagerSvc.mapAndDownload(this.mappingRecordIRI, format, fileName);
        expect(utilSvc.startDownload).toHaveBeenCalledWith('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map?' + params);
    });
    describe('should return a preview of mapped data from an uploaded delimited file', function() {
        beforeEach(function () {
            this.jsonld = '';
            this.format = 'jsonld';
        });
        it('unless an error occurs', function() {
            var params = $httpParamSerializer({
                containsHeaders: delimitedManagerSvc.containsHeaders,
                format: this.format,
                separator: delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview?' + params,
                data => data instanceof FormData, headers => headers['Content-Type'] === undefined && headers['Accept'] === 'application/json')
                .respond(400, null, null, 'Error Message');
            delimitedManagerSvc.previewMap(this.jsonld, this.format)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('as JSON-LD using mapping JSON-LD', function() {
            var params = $httpParamSerializer({
                containsHeaders: delimitedManagerSvc.containsHeaders,
                format: this.format,
                separator: delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview?' + params,
                data => data instanceof FormData, headers => headers['Content-Type'] === undefined && headers['Accept'] === 'application/json')
                .respond(200, []);
            delimitedManagerSvc.previewMap(this.jsonld, this.format)
                .then(response => expect(response).toEqual([]), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
        it('as other formats using mapping JSON-LD', function() {
            this.format = 'turtle';
            var params = $httpParamSerializer({
                containsHeaders: delimitedManagerSvc.containsHeaders,
                format: this.format,
                separator: delimitedManagerSvc.separator
            });
            $httpBackend.expectPOST('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map-preview?' + params,
                data => data instanceof FormData, headers => headers['Content-Type'] === undefined && headers['Accept'] === 'text/plain')
                .respond(200, []);
            delimitedManagerSvc.previewMap(this.jsonld, this.format)
                .then(response => expect(response).toEqual([]), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should upload mapped data from an uploaded delimited file into a dataset', function() {
        beforeEach(function() {
            this.params = $httpParamSerializer({
                datasetRecordIRI: this.datasetRecordIRI,
                mappingRecordIRI: this.mappingRecordIRI,
                containsHeaders: delimitedManagerSvc.containsHeaders,
                separator: delimitedManagerSvc.separator
            });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map?' + this.params).respond(400, null, null, 'Error Message');
            delimitedManagerSvc.mapAndUpload(this.mappingRecordIRI, this.datasetRecordIRI)
                .then(() => fail('Promise should have rejected'), response => expect(response).toBe('Error Message'));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectPOST('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map?' + this.params).respond(200, '');
            delimitedManagerSvc.mapAndUpload(this.mappingRecordIRI, this.datasetRecordIRI)
                .then(response => expect(response).toBe(''), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should upload mapped data from an uploaded delimited file into an ontology', function() {
        beforeEach(function() {
            this.params = $httpParamSerializer({
                ontologyRecordIRI: this.ontologyRecordIRI,
                mappingRecordIRI: this.mappingRecordIRI,
                branchIRI: this.branchIRI,
                update: false,
                containsHeaders: delimitedManagerSvc.containsHeaders,
                separator: delimitedManagerSvc.separator
            });
        });
        it('unless an error occurs', function() {
            $httpBackend.expectPOST('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map-to-ontology?' + this.params).respond(400, null, null, 'Error Message');
            delimitedManagerSvc.mapAndCommit(this.mappingRecordIRI, this.ontologyRecordIRI, this.branchIRI, this.update)
                .then(() => fail('Promise should have rejected', response => expect(response).toBe('Error Message')));
            flushAndVerify($httpBackend);
            expect(utilSvc.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({
                status: 400,
                statusText: 'Error Message'
            }));
        });
        it('successfully', function() {
            $httpBackend.expectPOST('/mobirest/delimited-files/' + delimitedManagerSvc.fileName + '/map-to-ontology?' + this.params).respond(204, '');
            delimitedManagerSvc.mapAndCommit(this.mappingRecordIRI, this.ontologyRecordIRI, this.branchIRI, this.update)
                .then(response => expect(response.status).toBe(204), () => fail('Promise should have resolved'));
            flushAndVerify($httpBackend);
        });
    });
    describe('should retrieve the header name of a column based on the index', function() {
        beforeEach(function () {
            this.index = 0;
        });
        it('if there are no data rows', function() {
            delimitedManagerSvc.dataRows = undefined;
            expect(delimitedManagerSvc.getHeader(this.index)).toContain('' + this.index);
        });
        it('if the data rows contain a header row', function() {
            delimitedManagerSvc.dataRows = [['']];
            delimitedManagerSvc.containsHeaders = true;
            expect(delimitedManagerSvc.getHeader(this.index)).toBe(delimitedManagerSvc.dataRows[0][this.index]);
        });
        it('if the data rows do not contain a header row', function() {
            delimitedManagerSvc.dataRows = [['']];
            delimitedManagerSvc.containsHeaders = false;
            expect(delimitedManagerSvc.getHeader(this.index)).toContain('' + this.index);
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
