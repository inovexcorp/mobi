/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2026 iNovex Information Systems, Inc.
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
import { Observable } from 'rxjs';

import { cleanStylesFromDOM, } from '../../../test/ts/Shared';
import { DATASET_STORE_TYPE, ONTOLOGY_STORE_TYPE, REPOSITORY_STORE_TYPE } from '../../constants';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { REPOS, XSD } from '../../prefixes';
import { SparqlManagerService } from './sparqlManager.service';
import { SPARQLSelectResults } from '../models/sparqlSelectResults.interface';

describe('SPARQL Manager service', function() {
    let service: SparqlManagerService;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;

    const error = 'error message';
    const query = 'SELECT * WHERE { ?s ?p ?o }';
    const datasetRecordIRI = 'datasetRecordIRI';
    const ontologyRecordIRI = 'ontologyRecordIRI';
    const branchId = 'branchId';
    const commitId = 'commitId';
    const systemRepoIRI = `${REPOS}system`;
    const systemRepoURL = `/mobirest/sparql/repository/${encodeURIComponent(systemRepoIRI)}`;
    const datasetURL = `/mobirest/sparql/dataset-record/${encodeURIComponent(datasetRecordIRI)}`;
    const ontologyURL = `/mobirest/sparql/ontology-record/${encodeURIComponent(ontologyRecordIRI)}`;
    const selectResults: SPARQLSelectResults = {
        head: {
            vars: ['A', 'B']
        },
        results: { bindings: [
            {
                'A': { type: `${XSD}string`, value: 'testA' },
                'B': { type: `${XSD}string`, value: 'testB' },
            }
        ]}
    };
    const constructResults = '<urn:a> a <urn:class>';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                SparqlManagerService,
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(SparqlManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;

        progressSpinnerStub.track.and.callFake((ob) => ob);
        progressSpinnerStub.trackedRequest.and.callFake((ob) => ob);
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
        progressSpinnerStub = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should query the repository with a GET', function() {
        it('unless an error occurs', fakeAsync(function() {
            service.query(query, systemRepoIRI)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url.startsWith(systemRepoURL) && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        }));
        describe('successfully', function() {
            describe('when tracked elsewhere', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.query(query, datasetRecordIRI, DATASET_STORE_TYPE, '', '', false, false, true)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(datasetURL) && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));
                it('with an ontology and results in a string format', fakeAsync(function() {
                    service.query(query, ontologyRecordIRI, ONTOLOGY_STORE_TYPE, branchId, commitId, false, false, true)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(ontologyURL) && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect(request.request.params.get('commitId')).toEqual(commitId);
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));
                it('with a repository and the results are in JSON format', fakeAsync(function() {
                    service.query(query, systemRepoIRI, REPOSITORY_STORE_TYPE, '', '', false, false, true)
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(systemRepoURL) && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(JSON.stringify(selectResults), {
                        headers: new HttpHeaders({'Content-Type': 'application/json'})
                    });
                }));
            });
            describe('when not tracked', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.query(query, datasetRecordIRI, DATASET_STORE_TYPE)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(datasetURL) && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));
                it('with an ontology and results in a string format', fakeAsync(function() {
                    service.query(query, ontologyRecordIRI, ONTOLOGY_STORE_TYPE, branchId, commitId)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(ontologyURL) && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect(request.request.params.get('commitId')).toEqual(commitId);
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));
                it('with a repository and the results are in JSON format', fakeAsync(function() {
                    service.query(query, systemRepoIRI)
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(systemRepoURL) && req.method === 'GET');
                    expect(request.request.params.get('query')).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(JSON.stringify(selectResults), {
                        headers: new HttpHeaders({'Content-Type': 'application/json'})
                    });
                }));
            });
        });
    });
    describe('should query the repository with a POST', function() {
        it('unless an error occurs', fakeAsync(function() {
            service.postQuery(query, datasetRecordIRI, DATASET_STORE_TYPE)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url.startsWith(datasetURL) && req.method === 'POST');
            request.flush('flush', { status: 400, statusText: error });
        }));
        describe('successfully', function() {
            describe('when tracked elsewhere', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.postQuery(query, datasetRecordIRI, DATASET_STORE_TYPE, '', '', false, false, 'application/json', true)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(datasetURL) && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));
                it('with an ontology and results in a string format', fakeAsync(function() {
                    service.postQuery(query, ontologyRecordIRI, ONTOLOGY_STORE_TYPE, branchId, commitId, false, false, 'application/json', true)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(ontologyURL) && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect(request.request.params.get('commitId')).toEqual(commitId);
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));
                it('with a repository and the results are in JSON format', fakeAsync(function() {
                    service.postQuery(query, systemRepoIRI, REPOSITORY_STORE_TYPE, '', '', false, false, 'application/json', true)
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), true);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(systemRepoURL) && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(JSON.stringify(selectResults), {
                        headers: new HttpHeaders({'Content-Type': 'application/json'})
                    });
                }));
            });
            describe('when not tracked', function() {
                it('with a dataset and results in a string format', fakeAsync(function() {
                    service.postQuery(query, datasetRecordIRI, DATASET_STORE_TYPE)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(datasetURL) && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));

                it('with an ontology and results in a string format', fakeAsync(function() {
                    service.postQuery(query, ontologyRecordIRI, ONTOLOGY_STORE_TYPE, branchId, commitId)
                        .subscribe(response => {
                            expect(response).toEqual(constructResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(ontologyURL) && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('branchId')).toEqual(branchId);
                    expect(request.request.params.get('commitId')).toEqual(commitId);
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                    request.flush(constructResults);
                }));
                it('with a repository and the results are in JSON format', fakeAsync(function() {
                    service.postQuery(query, systemRepoIRI, REPOSITORY_STORE_TYPE)
                        .subscribe(response => {
                            expect(response).toEqual(selectResults);
                            expect(progressSpinnerStub.trackedRequest).toHaveBeenCalledWith(jasmine.any(Observable), false);
                        });
                    const request = httpMock.expectOne(req => req.url.startsWith(systemRepoURL) && req.method === 'POST');
                    expect(request.request.body).toEqual(query);
                    expect(request.request.params.get('branchId')).toBeNull();
                    expect(request.request.params.get('commitId')).toBeNull();
                    expect(request.request.params.get('includeImports')).toEqual('false');
                    expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
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
                        includeImports: false,
                        applyInProgressCommit: false
                    }
                });
                service.downloadResults(query, 'csv', '', datasetRecordIRI, DATASET_STORE_TYPE);
                expect(window.open).toHaveBeenCalledWith(`${datasetURL}?${params.toString()}`);
            });
            it('with an ontology', function() {
                const params = new HttpParams({
                    fromObject: {
                        query,
                        fileType: 'csv',
                        branchId,
                        commitId,
                        includeImports: false,
                        applyInProgressCommit: false
                    }
                });
                service.downloadResults(query, 'csv', '', ontologyRecordIRI, ONTOLOGY_STORE_TYPE, branchId, commitId);
                expect(window.open).toHaveBeenCalledWith(`${ontologyURL}?${params.toString()}`);
            });
            it('with a file name', function() {
                const params = new HttpParams({
                    fromObject: {
                        query,
                        fileType: 'csv',
                        includeImports: false,
                        applyInProgressCommit: false,
                        fileName: 'test'
                    }
                });
                service.downloadResults(query, 'csv', 'test');
                expect(window.open).toHaveBeenCalledWith(`${systemRepoURL}?${params.toString()}`);
            });
            it('without a file name', function() {
                const params = new HttpParams({
                    fromObject: {
                        query,
                        fileType: 'csv',
                        includeImports: false,
                        applyInProgressCommit: false
                    }
                });
                service.downloadResults(query, 'csv');
                expect(window.open).toHaveBeenCalledWith(`${systemRepoURL}?${params.toString()}`);
            });
        });
        describe('via POST', function() {
            it('with a dataset', function() {
                const aSpy = jasmine.createSpyObj('a', ['click']);
                spyOn(document, 'createElement').and.returnValue(aSpy);
                const expectedResult: ArrayBuffer = new ArrayBuffer(8);
                service.downloadResultsPost(query, 'csv', '', datasetRecordIRI, DATASET_STORE_TYPE)
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
                const request = httpMock.expectOne(req => req.url.startsWith(datasetURL) && req.method === 'POST');
                expect(request.request.body).toEqual(query);
                expect(request.request.params.get('fileType')).toEqual('csv');
                expect(request.request.params.get('fileName')).toBeNull();
                expect(request.request.params.get('branchId')).toBeNull();
                expect(request.request.params.get('commitId')).toBeNull();
                expect(request.request.params.get('includeImports')).toEqual('false');
                expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                expect(request.request.headers.get('Accept')).toEqual('application/octet-stream');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(expectedResult);
            });
            it('with an ontology', function() {
                const aSpy = jasmine.createSpyObj('a', ['click']);
                spyOn(document, 'createElement').and.returnValue(aSpy);
                const expectedResult: ArrayBuffer = new ArrayBuffer(8);
                service.downloadResultsPost(query, 'csv', '', ontologyRecordIRI, ONTOLOGY_STORE_TYPE, branchId, commitId, true, true)
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
                const request = httpMock.expectOne(req => req.url.startsWith(ontologyURL) && req.method === 'POST');
                expect(request.request.body).toEqual(query);
                expect(request.request.params.get('fileType')).toEqual('csv');
                expect(request.request.params.get('fileName')).toBeNull();
                expect(request.request.params.get('branchId')).toEqual(branchId);
                expect(request.request.params.get('commitId')).toEqual(commitId);
                expect(request.request.params.get('includeImports')).toEqual('true');
                expect(request.request.params.get('applyInProgressCommit')).toEqual('true');
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
                const request = httpMock.expectOne(req => req.url.startsWith(systemRepoURL) && req.method === 'POST');
                expect(request.request.body).toEqual(query);
                expect(request.request.params.get('fileType')).toEqual('csv');
                expect(request.request.params.get('fileName')).toEqual('test');
                expect(request.request.params.get('branchId')).toBeNull();
                expect(request.request.params.get('commitId')).toBeNull();
                expect(request.request.params.get('includeImports')).toEqual('false');
                expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
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
                const request = httpMock.expectOne(req => req.url.startsWith(systemRepoURL) && req.method === 'POST');
                expect(request.request.body).toEqual(query);
                expect(request.request.params.get('fileType')).toEqual('csv');
                expect(request.request.params.get('fileName')).toBeNull();
                expect(request.request.params.get('branchId')).toBeNull();
                expect(request.request.params.get('commitId')).toBeNull();
                expect(request.request.params.get('includeImports')).toEqual('false');
                expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
                expect(request.request.headers.get('Accept')).toEqual('application/octet-stream');
                expect(request.request.headers.get('Content-Type')).toEqual('application/sparql-query');
                request.flush(expectedResult);
            });
        });
    });
});
