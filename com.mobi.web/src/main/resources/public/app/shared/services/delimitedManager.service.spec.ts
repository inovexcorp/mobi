/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2024 iNovex Information Systems, Inc.
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
import { HttpParams } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';

import {
    cleanStylesFromDOM
} from '../../../test/ts/Shared';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { PolicyEnforcementService } from './policyEnforcement.service';
import { DelimitedManagerService } from './delimitedManager.service';

describe('Delimited Manager service', function() {
    let service: DelimitedManagerService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let policyEnforcementStub: jasmine.SpyObj<PolicyEnforcementService>;
    
    const error = 'Error Message';
    const mappingRecordIRI = 'http://test.org/mapping';
    const datasetRecordIRI = 'http://test.org/record';
    const ontologyRecordIRI = 'http://test.org/ontology';
    const branchIRI = 'http://test.org/branch';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                DelimitedManagerService,
                MockProvider(ProgressSpinnerService),
                MockProvider(PolicyEnforcementService)
            ]
        });

        service = TestBed.inject(DelimitedManagerService);
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        policyEnforcementStub = TestBed.inject(PolicyEnforcementService) as jasmine.SpyObj<PolicyEnforcementService>;
        policyEnforcementStub.deny = 'Deny';
        policyEnforcementStub.permit = 'Permit';
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.permit));
        service.fileName = 'test';
        service.separator = ',';
        service.containsHeaders = true;
        progressSpinnerStub.track.and.callFake((ob) => ob);
    });
    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        progressSpinnerStub = null;
        policyEnforcementStub = null;
    });

    describe('should upload a delimited file', function() {
        it('unless an error occurs', function() {
            service.upload(new File([''], ''))
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: service.prefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.upload(new File([''], ''))
                .subscribe(() => {}, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: service.prefix, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('file')).toBeDefined();
            request.flush(200);
        });
    });
    describe('should retrieve a preview of an uploaded delimited file', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(service.fileName)}`;
            service.dataRows = [];
        });
        it('unless an error occurs', function() {
            service.previewFile(5)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(service.dataRows).toBeUndefined();
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('unless there are no rows', function() {
            service.previewFile(5)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toBe('No rows were found');
                    expect(service.dataRows).toBeUndefined();
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('rowCount')).toEqual('5');
            expect(request.request.params.get('separator')).toEqual('' + service.separator);
            request.flush([]);
        });
        it('successfully', function() {
            const preview = [[''], [''], [''], [''], ['']];
            service.previewFile(5)
                .subscribe(response => {
                    expect(response).toBeNull();
                    expect(service.dataRows).toEqual(preview);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('rowCount')).toEqual('5');
            expect(request.request.params.get('separator')).toEqual('' + service.separator);
            request.flush(preview);
        });
    });
    it('should return mapped data from an uploaded delimited file', function() {
        spyOn(window, 'open');
        const fileName = 'test';
        const format = 'jsonld';
        const params = new HttpParams({
            fromObject: {
                containsHeaders: '' + service.containsHeaders,
                separator: service.separator,
                format,
                mappingRecordIRI,
                fileName
            }
        });
        service.mapAndDownload(mappingRecordIRI, format, fileName);
        expect(window.open).toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(service.fileName)}/map?${params.toString()}`);
    });
    it('should not return mapped data from an uploaded delimited file when permission denied', function() {
        policyEnforcementStub.evaluateRequest.and.returnValue(of(policyEnforcementStub.deny));
        spyOn(window, 'open');
        const fileName = 'test';
        const format = 'jsonld';
        const params = new HttpParams({
            fromObject: {
                containsHeaders: '' + service.containsHeaders,
                separator: service.separator,
                format,
                mappingRecordIRI,
                fileName
            }
        });
        service.mapAndDownload(mappingRecordIRI, format, fileName);
        expect(window.open).not.toHaveBeenCalledWith(`${service.prefix}/${encodeURIComponent(service.fileName)}/map?${params.toString()}`);
    });
    describe('should return a preview of mapped data from an uploaded delimited file', function() {
        beforeEach(function () {
            this.jsonld = [{'@id': 'test'}];
            this.format = 'jsonld';
            this.url = `${service.prefix}/${encodeURIComponent(service.fileName)}/map-preview`;
        });
        it('unless an error occurs', function() {
            service.previewMap(this.jsonld, this.format)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('as JSON-LD using mapping JSON-LD', function() {
            const result = [{'@id': 'result'}];
            service.previewMap(this.jsonld, this.format)
                .subscribe(response => {
                    expect(response).toEqual(result);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('format')).toEqual(this.format);
            expect(request.request.params.get('containsHeaders')).toEqual('' + service.containsHeaders);
            expect(request.request.params.get('separator')).toEqual('' + service.separator);
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('jsonld').toString()).toEqual(JSON.stringify(this.jsonld));
            expect(request.request.headers.get('Accept')).toEqual('application/json');
            request.flush(result);
        });
        it('as other formats using mapping JSON-LD', function() {
            this.format = 'turtle';
            const result = 'urn:test a urn:Test';
            service.previewMap(this.jsonld, this.format)
                .subscribe(response => {
                    expect(response).toEqual(result);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('format')).toEqual(this.format);
            expect(request.request.params.get('containsHeaders')).toEqual('' + service.containsHeaders);
            expect(request.request.params.get('separator')).toEqual('' + service.separator);
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('jsonld').toString()).toEqual(JSON.stringify(this.jsonld));
            expect(request.request.headers.get('Accept')).toEqual('text/plain');
            request.flush(result);
        });
    });
    describe('should upload mapped data from an uploaded delimited file into a dataset', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(service.fileName)}/map`;
        });
        it('unless an error occurs', function() {
            service.mapAndUpload(mappingRecordIRI, datasetRecordIRI)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.mapAndUpload(mappingRecordIRI, datasetRecordIRI)
                .subscribe(() => {}, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('mappingRecordIRI')).toEqual(mappingRecordIRI);
            expect(request.request.params.get('datasetRecordIRI')).toEqual(datasetRecordIRI);
            expect(request.request.params.get('containsHeaders')).toEqual('' + service.containsHeaders);
            expect(request.request.params.get('separator')).toEqual('' + service.separator);
            request.flush(200);
        });
    });
    describe('should upload mapped data from an uploaded delimited file into an ontology', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(service.fileName)}/map-to-ontology`;
        });
        it('unless an error occurs', function() {
            service.mapAndCommit(mappingRecordIRI, ontologyRecordIRI, branchIRI, true)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toBe(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with update specified', function() {
            service.mapAndCommit(mappingRecordIRI, ontologyRecordIRI, branchIRI, true)
                .subscribe(response => {
                    expect(response.status).toBe(204);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('mappingRecordIRI')).toEqual(mappingRecordIRI);
            expect(request.request.params.get('ontologyRecordIRI')).toEqual(ontologyRecordIRI);
            expect(request.request.params.get('branchIRI')).toEqual(branchIRI);
            expect(request.request.params.get('update')).toEqual('true');
            expect(request.request.params.get('containsHeaders')).toEqual('' + service.containsHeaders);
            expect(request.request.params.get('separator')).toEqual('' + service.separator);
            request.flush('', { status: 204, statusText: 'No Data' });
        });
        it('without update specified', function() {
            service.mapAndCommit(mappingRecordIRI, ontologyRecordIRI, branchIRI)
                .subscribe(response => {
                    expect(response.status).toBe(204);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('mappingRecordIRI')).toEqual(mappingRecordIRI);
            expect(request.request.params.get('ontologyRecordIRI')).toEqual(ontologyRecordIRI);
            expect(request.request.params.get('branchIRI')).toEqual(branchIRI);
            expect(request.request.params.get('update')).toEqual('false');
            expect(request.request.params.get('containsHeaders')).toEqual('' + service.containsHeaders);
            expect(request.request.params.get('separator')).toEqual('' + service.separator);
            request.flush('', { status: 204, statusText: 'No Data' });
        });
    });
    describe('should retrieve the header name of a column based on the index', function() {
        it('if there are no data rows', function() {
            service.dataRows = undefined;
            expect(service.getHeader(0)).toContain('0');
        });
        it('if the data rows contain a header row', function() {
            service.dataRows = [['']];
            service.containsHeaders = true;
            expect(service.getHeader(0)).toBe(service.dataRows[0][0]);
        });
        it('if the data rows do not contain a header row', function() {
            service.dataRows = [['']];
            service.containsHeaders = false;
            expect(service.getHeader(0)).toContain('0');
        });
    });
    it('should reset important variables', function() {
        service.reset();
        expect(service.dataRows).toBeUndefined();
        expect(service.fileName).toBe('');
        expect(service.fileObj).toBeUndefined();
        expect(service.separator).toBe(',');
        expect(service.containsHeaders).toBe(true);
        expect(service.preview).toBe('');
    });
});
