/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
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
import { HttpHeaders, HttpParams } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { Observable, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../test/ts/Shared';
import { XSD } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';
import { UtilService } from './util.service';
import { SparqlManagerService } from './sparqlManager.service';

describe('SPARQL Manager service', function() {
    let service: SparqlManagerService;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;
    let utilStub: jasmine.SpyObj<UtilService>;
    
    const error = 'error message';
    const query = 'SELECT * WHERE { ?s ?p ?o }';
    const datasetRecordIRI = 'datasetRecordIRI';
    const selectResults: SPARQLSelectResults = {
        head: {
            vars: ['A', 'B']
        },
        results: { bindings: [
            {
                'A': { type: XSD + 'string', value: 'testA' },
                'B': { type: XSD + 'string', value: 'testB' },
            }
        ]}
    };
    const constructResults = '<urn:a> a <urn:class>';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                SparqlManagerService,
                MockProvider(UtilService),
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(SparqlManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
   
        progressSpinnerStub.track.and.callFake((ob) => ob);
        utilStub.trackedRequest.and.callFake((ob) => ob);
        utilStub.handleError.and.callFake(error => {
            if (error.status === 0) {
                return throwError('');
            } else {
                return throwError(error.statusText || 'Something went wrong. Please try again later.');
            }
        });
        utilStub.createHttpParams.and.callFake(params => {
            let httpParams: HttpParams = new HttpParams();
            Object.keys(params).forEach(param => {
                if (params[param] !== undefined && params[param] !== null && params[param] !== '') {
                    if (Array.isArray(params[param])) {
                        params[param].forEach(el => {
                            httpParams = httpParams.append(param, '' + el);
                        });
                    } else {
                        httpParams = httpParams.append(param, '' + params[param]);
                    }
                }
            });
        
            return httpParams;
        });
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        progressSpinnerStub = null;
        utilStub = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should query the repository with a GET', function() {
        it('unless an error occurs', fakeAsync(function() {
            service.query(query, '')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        }));
        describe('successfully', function() {
            describe('when tracked elsewhere', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.query(query, datasetRecordIRI, true)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('dataset')).toEqual(datasetRecordIRI);
                    request.flush(constructResults);
                }));
                it('without a dataset and the results are in JSON format', fakeAsync(function() {
                    service.query(query, '', true)
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('dataset')).toBeNull();
                    request.flush(JSON.stringify(selectResults), {
                        headers: new HttpHeaders({'Content-Type': 'application/json'})
                    });
                }));
            });
            describe('when not tracked', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.query(query, datasetRecordIRI)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('dataset')).toEqual(datasetRecordIRI);
                    request.flush(constructResults);
                }));
                it('without a dataset and the results are in JSON format', fakeAsync(function() {
                    service.query(query, '')
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('dataset')).toBeNull();
                    request.flush(JSON.stringify(selectResults), {
                        headers: new HttpHeaders({'Content-Type': 'application/json'})
                    });
                }));
            });
        });
    });
    describe('should query the repository with a POST', function() {
        it('unless an error occurs', fakeAsync(function() {
            service.postQuery(query, '')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
            request.flush('flush', { status: 400, statusText: error });
        }));
        describe('successfully', function() {
            describe('when tracked elsewhere', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.postQuery(query, datasetRecordIRI, true)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('dataset')).toEqual(datasetRecordIRI);
                    request.flush(constructResults);
                }));
                it('without a dataset and the results are in JSON format', fakeAsync(function() {
                    service.postQuery(query, '', true)
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('dataset')).toBeNull();
                    request.flush(JSON.stringify(selectResults), {
                        headers: new HttpHeaders({'Content-Type': 'application/json'})
                    });
                }));
            });
            describe('when not tracked', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.postQuery(query, datasetRecordIRI)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('dataset')).toEqual(datasetRecordIRI);
                    request.flush(constructResults);
                }));
                it('without a dataset and the results are in JSON format', fakeAsync(function() {
                    service.postQuery(query, '')
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(utilStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('dataset')).toBeNull();
                    request.flush(JSON.stringify(selectResults), {
                        headers: new HttpHeaders({'Content-Type': 'application/json'})
                    });
                }));
            });
        });
    });
    describe('should download query results', function() {
        beforeEach(function() {
            spyOn(window, 'open');
        });
        describe('via GET', function() {
            it('with a dataset', function() {
                const params = new HttpParams({
                    fromObject: {
                        query,
                        fileType: 'csv',
                        dataset: datasetRecordIRI
                    }
                });
                service.downloadResults(query, 'csv', '', datasetRecordIRI);
                expect(window.open).toHaveBeenCalledWith(service.prefix + '?' + params.toString());
            });
            it('with a file name', function() {
                const params = new HttpParams({
                    fromObject: {
                        query,
                        fileType: 'csv',
                        fileName: 'test'
                    }
                });
                service.downloadResults(query, 'csv', 'test');
                expect(window.open).toHaveBeenCalledWith(service.prefix + '?' + params.toString());
            });
            it('without a file name', function() {
                const params = new HttpParams({
                    fromObject: {
                        query,
                        fileType: 'csv',
                    }
                });
                service.downloadResults(query, 'csv');
                expect(window.open).toHaveBeenCalledWith(service.prefix + '?' + params.toString());
            });
        });
        describe('via POST', function() {
            it('with a dataset', function() {
                const aSpy = jasmine.createSpyObj('a', ['click']);
                spyOn(document, 'createElement').and.returnValue(aSpy);
                const expectedResult: ArrayBuffer = new ArrayBuffer(8);
                service.downloadResultsPost(query, 'csv', '', datasetRecordIRI)
                    .subscribe(response => {
                        expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        expect(response).toEqual(expectedResult);
                        expect(document.createElement).toHaveBeenCalledWith('a');
                        expect(aSpy.href).toBeTruthy();
                        expect(aSpy.target).toEqual('_blank');
                        expect(aSpy.download).toEqual('untitled');
                        expect(aSpy.click).toHaveBeenCalledWith();
                    }, () => {
                        fail('Observable should have resolved');
                    });
                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
                expect(request.request.body).toEqual(query);
                expect(request.request.params.get('fileType')).toEqual('csv');
                expect(request.request.params.get('fileName')).toBeNull();
                expect(request.request.params.get('dataset')).toEqual(datasetRecordIRI);
                expect(request.request.headers.get('Accept')).toEqual('application/octet-stream');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(expectedResult);
            });
            it('with a file name', function() {
                const aSpy = jasmine.createSpyObj('a', ['click']);
                spyOn(document, 'createElement').and.returnValue(aSpy);
                const expectedResult: ArrayBuffer = new ArrayBuffer(8);
                service.downloadResultsPost(query, 'csv', 'test')
                    .subscribe(response => {
                        expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        expect(response).toEqual(expectedResult);
                        expect(document.createElement).toHaveBeenCalledWith('a');
                        expect(aSpy.href).toBeTruthy();
                        expect(aSpy.target).toEqual('_blank');
                        expect(aSpy.download).toEqual('test');
                        expect(aSpy.click).toHaveBeenCalledWith();
                    }, () => fail('Observable should have resolved'));
                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
                expect(request.request.body).toEqual(query);
                expect(request.request.params.get('fileType')).toEqual('csv');
                expect(request.request.params.get('fileName')).toEqual('test');
                expect(request.request.params.get('dataset')).toBeNull();
                expect(request.request.headers.get('Accept')).toEqual('application/octet-stream');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(expectedResult);
            });
            it('without a file name', function() {
                const aSpy = jasmine.createSpyObj('a', ['click']);
                spyOn(document, 'createElement').and.returnValue(aSpy);
                const expectedResult: ArrayBuffer = new ArrayBuffer(8);
                service.downloadResultsPost(query, 'csv')
                    .subscribe(response => {
                        expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        expect(response).toEqual(expectedResult);
                        expect(document.createElement).toHaveBeenCalledWith('a');
                        expect(aSpy.href).toBeTruthy();
                        expect(aSpy.target).toEqual('_blank');
                        expect(aSpy.download).toEqual('untitled');
                        expect(aSpy.click).toHaveBeenCalledWith();
                    }, () => fail('Observable should have resolved'));
                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'POST');
                expect(request.request.body).toEqual(query);
                expect(request.request.params.get('fileType')).toEqual('csv');
                expect(request.request.params.get('fileName')).toBeNull();
                expect(request.request.params.get('dataset')).toBeNull();
                expect(request.request.headers.get('Accept')).toEqual('application/octet-stream');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(expectedResult);
            });
        });
    });
});
