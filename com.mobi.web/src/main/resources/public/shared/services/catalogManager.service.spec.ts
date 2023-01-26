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
import { HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { find } from 'lodash';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { Observable, of, throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../test/ts/Shared';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { CommitDifference } from '../models/commitDifference.interface';
import { Difference } from '../models/difference.class';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { SortOption } from '../models/sortOption.interface';
import { CATALOG, DCTERMS } from '../../prefixes';
import { CatalogManagerService } from './catalogManager.service';
import { UtilService } from './util.service';

describe('Catalog Manager service', function() {
    let service: CatalogManagerService;
    let utilStub: jasmine.SpyObj<UtilService>;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error Message';
    const entityId = 'test';
    const catalogId = 'http://mobi.com/catalogs/local';
    const recordId = 'http://mobi.com/records/test';
    const distributionId = 'http://mobi.com/distributions/test';
    const versionId = 'http://mobi.com/versions/test';
    const branchId = 'http://mobi.com/branches/test';
    const commitId = 'http://mobi.com/commits/test';
    const emptyObj: JSONLDObject = {'@id': '', '@type': []};
    const sortOption: SortOption = {field: 'http://purl.org/dc/terms/title', asc: false, label: 'title'};
    const difference: Difference = new Difference();
    const commitDifference: CommitDifference = new CommitDifference();
    commitDifference.commit = emptyObj;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                CatalogManagerService,
                MockProvider(UtilService),
                MockProvider(ProgressSpinnerService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(CatalogManagerService);
        utilStub = TestBed.get(UtilService);
        httpMock = TestBed.get(HttpTestingController);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);

        utilStub.paginatedConfigToParams.and.callFake(x => Object.assign({}, x) || {});
        progressSpinnerStub.track.and.callFake((ob) => ob);
        utilStub.trackedRequest.and.callFake((ob, tracked) => tracked ? ob : progressSpinnerStub.track(ob));
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
        utilStub = null;
        httpMock = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should set the correct initial state', function() {
        it('unless an error occurs', fakeAsync(function() {
            spyOn(service, 'getRecordTypes').and.returnValue(throwError(null));
            spyOn(service, 'getSortOptions').and.returnValue(throwError(null));
            service.initialize()
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual('Error in catalogManager initialization');
                    expect(service.recordTypes).toEqual([]);
                    expect(service.localCatalog).toBeUndefined();
                    expect(service.distributedCatalog).toBeUndefined();
                    expect(service.sortOptions).toEqual([]);
                });
            httpMock.expectOne({url: service.prefix, method: 'GET'});
            tick();
        }));
        it('unless an error occurs with the catalogs call', function() {
            spyOn(service, 'getRecordTypes').and.returnValue(of([]));
            spyOn(service, 'getSortOptions').and.returnValue(of([]));
            service.initialize()
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual('Error in catalogManager initialization');
                    expect(service.recordTypes).toEqual([]);
                    expect(service.localCatalog).toBeUndefined();
                    expect(service.distributedCatalog).toBeUndefined();
                    expect(service.sortOptions).toEqual([]);
                });
            const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        describe('successfully', function() {
            beforeEach(function() {
                this.types = ['type1', 'type2'];
                this.sortOptions = ['sort1', 'sort2'];
                spyOn(service, 'getRecordTypes').and.returnValue(of(this.types));
                spyOn(service, 'getSortOptions').and.returnValue(of(this.sortOptions));
            });
            it('unless a catalog cannot be found', function() {
                service.initialize()
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toContain('Could not find');
                    });
                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush([]);
            });
            it('with all important data', function() {
                const localCatalog = {
                    '@id': '',
                    '@type': [],
                    [DCTERMS + 'title']: [{'@value': 'Mobi Catalog (Local)'}]
                };
                const distributedCatalog = {
                    '@id': '',
                    '@type': [],
                    [DCTERMS + 'title']: [{'@value': 'Mobi Catalog (Distributed)'}]
                };
                service.initialize()
                    .subscribe(() => {
                        expect(service.recordTypes).toEqual(this.types);
                        expect(service.localCatalog).toEqual(localCatalog);
                        expect(service.distributedCatalog).toEqual(distributedCatalog);
                        expect(service.sortOptions.length).toEqual(this.sortOptions.length * 2);
                        this.sortOptions.forEach((option) => {
                            expect(find(service.sortOptions, {field: option, asc: true})).not.toBeUndefined();
                            expect(find(service.sortOptions, {field: option, asc: false})).not.toBeUndefined();
                        });
                    }, () => fail('Observable should have resolved'));
                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush([localCatalog, distributedCatalog]);
            });
        });
    });
    it('should get the IRIs for all record types', function() {
        service.getRecordTypes()
            .subscribe(value => {
                expect(value).toEqual([]);
            }, () => fail('Observable should have resolved'));
        const request = httpMock.expectOne({url: service.prefix + '/record-types', method: 'GET'});
        request.flush([]);
    });
    it('should get the IRIs for all sort options', function() {
        service.getSortOptions()
            .subscribe(value => {
                expect(value).toEqual([]);
            }, () => fail('Observable should have resolved'));
        const request = httpMock.expectOne({url: service.prefix + '/sort-options', method: 'GET'});
        request.flush([]);
    });
    describe('should get a page of results based on the passed URL', function() {
        beforeEach(function() {
            this.url = service.prefix + '/local/records';
        });
        it('unless there is an error', function() {
            service.getResultsPage(this.url)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getResultsPage(this.url)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush([]);
        });
    });
    describe('should retrieve a list of Keyword', function() {
        beforeEach(function() {
            this.promiseId = 'id';
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/keywords';
            this.config = {
                limit: 10,
                offset: 0
            };
        });
        it('unless an error occurs', function() {
            service.getKeywords(catalogId, this.config)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        describe('successfully', function() {
            describe('when not tracked', function() {
                it('and all config passed', function() {
                    this.config.searchText = 'test';
                    service.getKeywords(catalogId, this.config)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
                    expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
                    expect(request.request.params.get('searchText')).toEqual(this.config.searchText);
                    request.flush([]);
                });
                it('and no config passed', function() {
                    service.getKeywords(catalogId, undefined)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toBeNull();
                    expect(request.request.params.get('offset')).toBeNull();
                    expect(request.request.params.get('searchText')).toBeNull();
                    request.flush([]);
                });
            });
            describe('when tracked elsewhere', function() {
                it('and all config passed', function() {
                    this.config.searchText = 'test';
                    service.getKeywords(catalogId, this.config, true)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).not.toHaveBeenCalled();
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
                    expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
                    expect(request.request.params.get('searchText')).toEqual(this.config.searchText);
                    request.flush([]);
                });
                it('and no config passed', function() {
                    service.getKeywords(catalogId, undefined, true)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).not.toHaveBeenCalled();
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toBeNull();
                    expect(request.request.params.get('offset')).toBeNull();
                    expect(request.request.params.get('searchText')).toBeNull();
                    request.flush([]);
                });
            });
        });
    });
    describe('should retrieve a list of Records', function() {
        beforeEach(function() {
            this.promiseId = 'id';
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records';
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true,
                type: CATALOG + 'Record',
                searchText: 'Text',
                keywords: ['A', 'B']
            };
            service.sortOptions = [sortOption];
        });
        it('unless an error occurs', function() {
            service.getRecords(catalogId, this.config)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        describe('successfully', function() {
            describe('when not tracked', function() {
                it('and all config passed', function() {
                    service.getRecords(catalogId, this.config)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
                    expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
                    expect(request.request.params.get('searchText')).toEqual(this.config.searchText);
                    expect(request.request.params.getAll('keywords')).toEqual(this.config.keywords);
                    expect(request.request.params.get('type')).toEqual(this.config.type);
                    expect(request.request.params.get('sort')).toEqual(this.config.sort);
                    expect(request.request.params.get('ascending')).toEqual('' + this.config.ascending);
                    request.flush([]);
                });
                it('and no config passed', function() {
                    service.getRecords(catalogId, undefined)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toBeNull();
                    expect(request.request.params.get('offset')).toBeNull();
                    expect(request.request.params.get('searchText')).toBeNull();
                    expect(request.request.params.get('keywords')).toBeNull();
                    expect(request.request.params.get('type')).toBeNull();
                    expect(request.request.params.get('sort')).toEqual(sortOption.field);
                    expect(request.request.params.get('ascending')).toEqual('' + sortOption.asc);
                    request.flush([]);
                });
            });
            describe('when tracked elsewhere', function() {
                it('and all config passed', function() {
                    service.getRecords(catalogId, this.config, true)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).not.toHaveBeenCalled();
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
                    expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
                    expect(request.request.params.get('searchText')).toEqual(this.config.searchText);
                    expect(request.request.params.getAll('keywords')).toEqual(this.config.keywords);
                    expect(request.request.params.get('type')).toEqual(this.config.type);
                    expect(request.request.params.get('sort')).toEqual(this.config.sort);
                    expect(request.request.params.get('ascending')).toEqual('' + this.config.ascending);
                    request.flush([]);
                });
                it('and no config passed', function() {
                    service.getRecords(catalogId, undefined, true)
                        .subscribe(response => {
                            expect(response.body).toEqual([]);
                            expect(progressSpinnerStub.track).not.toHaveBeenCalled();
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('limit')).toBeNull();
                    expect(request.request.params.get('offset')).toBeNull();
                    expect(request.request.params.get('searchText')).toBeNull();
                    expect(request.request.params.get('keywords')).toBeNull();
                    expect(request.request.params.get('type')).toBeNull();
                    expect(request.request.params.get('sort')).toEqual(sortOption.field);
                    expect(request.request.params.get('ascending')).toEqual('' + sortOption.asc);
                    request.flush([]);
                });
            });
        });
    });
    describe('should retrieve a Record', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId);
        });
        it('unless an error occurs', function() {
            service.getRecord(recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecord(recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush([]);
        });
    });
    describe('should create a new Record', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records';
            this.recordConfig = {
                type: CATALOG + 'Record',
                title: 'Title',
                description: 'Description',
                keywords: ['keyword0', 'keyword1']
            };
        });
        it('unless an error occurs', function() {
            service.createRecord(catalogId, this.recordConfig)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a description and keywords', function() {
            service.createRecord(catalogId, this.recordConfig)
                .subscribe(response => {
                    expect(response).toEqual(recordId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.recordConfig.title);
            expect((request.request.body as FormData).get('type').toString()).toEqual(this.recordConfig.type);
            expect((request.request.body as FormData).get('description').toString()).toEqual(this.recordConfig.description);
            expect((request.request.body as FormData).getAll('keywords')).toEqual(this.recordConfig.keywords);
            request.flush(recordId);
        });
        it('without a description or keywords', function() {
            delete this.recordConfig.description;
            delete this.recordConfig.keywords;
            service.createRecord(catalogId, this.recordConfig)
                .subscribe(response => {
                    expect(response).toEqual(recordId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.recordConfig.title);
            expect((request.request.body as FormData).get('type').toString()).toEqual(this.recordConfig.type);
            expect((request.request.body as FormData).get('description')).toBeNull();
            expect((request.request.body as FormData).getAll('keywords')).toEqual([]);
            request.flush(recordId);
        });
    });
    describe('should update a Record', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId);
        });
        it('unless an error occurs', function() {
            service.updateRecord(recordId, catalogId, [emptyObj])
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual([emptyObj]);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateRecord(recordId, catalogId, [emptyObj])
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual([emptyObj]);
            request.flush([emptyObj]);
        });
    });
    describe('should delete a Record', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId);
        });
        it('unless an error occurs', function() {
            service.deleteRecord(recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteRecord(recordId, catalogId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should retrieve a list of Record Distributions', function() {
        beforeEach(function() {
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions';
            service.sortOptions = [sortOption];
        });
        it('unless an error occurs', function() {
            service.getRecordDistributions(recordId, catalogId, this.config)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with all config passed', function() {
            service.getRecordDistributions(recordId, catalogId, this.config)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
            expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
            expect(request.request.params.get('sort')).toEqual(this.config.sort);
            expect(request.request.params.get('ascending')).toEqual('' + this.config.ascending);
            request.flush([]);
        });
        it('without any config passed', function() {
            service.getRecordDistributions(recordId, catalogId, {})
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('sort')).toEqual(sortOption.field);
            expect(request.request.params.get('ascending')).toEqual('' + sortOption.asc);
            request.flush([]);
        });
    });
    describe('should retrieve a Record Distribution', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId);
        });
        it('unless an error occurs', function() {
            service.getRecordDistribution(distributionId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecordDistribution(distributionId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(emptyObj);
        });
    });
    describe('should create a new Record Distribution', function() {
        beforeEach(function() {
            this.distributionConfig = {
                title: 'Title',
                description: 'Description',
                format: 'text/plain',
                accessURL: 'http://example.com/access',
                downloadURL: 'http://example.com/download',
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions';
        });
        it('unless an error occurs', function() {
            service.createRecordDistribution(recordId, catalogId, this.distributionConfig)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a description, format, access URL, and download URL', function() {
            service.createRecordDistribution(recordId, catalogId, this.distributionConfig)
                .subscribe(response => {
                    expect(response).toEqual(distributionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.distributionConfig.title);
            expect((request.request.body as FormData).get('description').toString()).toEqual(this.distributionConfig.description);
            expect((request.request.body as FormData).get('format').toString()).toEqual(this.distributionConfig.format);
            expect((request.request.body as FormData).get('accessURL').toString()).toEqual(this.distributionConfig.accessURL);
            expect((request.request.body as FormData).get('downloadURL').toString()).toEqual(this.distributionConfig.downloadURL);
            request.flush(distributionId);
        });
        it('without a description, format, access URL, or download URL', function() {
            delete this.distributionConfig.description;
            delete this.distributionConfig.format;
            delete this.distributionConfig.accessURL;
            delete this.distributionConfig.downloadURL;
            service.createRecordDistribution(recordId, catalogId, this.distributionConfig)
                .subscribe(response => {
                    expect(response).toEqual(distributionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.distributionConfig.title);
            expect((request.request.body as FormData).get('description')).toBeNull();
            expect((request.request.body as FormData).get('format')).toBeNull();
            expect((request.request.body as FormData).get('accessURL')).toBeNull();
            expect((request.request.body as FormData).get('downloadURL')).toBeNull();
            request.flush(distributionId);
        });
    });
    describe('should update a Record Distribution', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId);
        });
        it('unless an error occurs', function() {
            service.updateRecordDistribution(distributionId, recordId, catalogId, emptyObj)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateRecordDistribution(distributionId, recordId, catalogId, emptyObj)
                .subscribe(response => {
                    expect(response).toEqual(distributionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush(null);
        });
    });
    describe('should delete a Record Distribution', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/distributions/' + encodeURIComponent(distributionId);
        });
        it('unless an error occurs', function() {
            service.deleteRecordDistribution(distributionId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteRecordDistribution(distributionId, recordId, catalogId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should retrieve a list of Record Versions', function() {
        beforeEach(function() {
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions';
            service.sortOptions = [sortOption];
        });
        it('unless an error occurs', function() {
            service.getRecordVersions(recordId, catalogId, this.config)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with all config passed', function() {
            service.getRecordVersions(recordId, catalogId, this.config)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
            expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
            expect(request.request.params.get('sort')).toEqual(this.config.sort);
            expect(request.request.params.get('ascending')).toEqual('' + this.config.ascending);
            request.flush([]);
        });
        it('without any config', function() {
            service.getRecordVersions(recordId, catalogId, {})
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('sort')).toEqual(sortOption.field);
            expect(request.request.params.get('ascending')).toEqual('' + sortOption.asc);
            request.flush([]);
        });
    });
    describe('should retrieve the latest Record Version', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/latest';
        });
        it('unless an error occurs', function() {
            service.getRecordLatestVersion(recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecordLatestVersion(recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(emptyObj);
        });
    });
    describe('should retrieve a Record Version', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId);
        });
        it('unless an error occurs', function() {
            service.getRecordVersion(versionId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecordVersion(versionId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(emptyObj);
        });
    });
    describe('should create a new Version', function() {
        beforeEach(function () {
            this.versionConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions';
        });
        it('unless an error occurs', function() {
            service.createRecordVersion(recordId, catalogId, this.versionConfig)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a description', function() {
            service.createRecordVersion(recordId, catalogId, this.versionConfig)
                .subscribe(response => {
                    expect(response).toEqual(versionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.versionConfig.title);
            expect((request.request.body as FormData).get('description').toString()).toEqual(this.versionConfig.description);
            request.flush(versionId);
        });
        it('without a description', function() {
            delete this.versionConfig.description;
            service.createRecordVersion(recordId, catalogId, this.versionConfig)
                .subscribe(response => {
                    expect(response).toEqual(versionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.versionConfig.title);
            expect((request.request.body as FormData).get('description')).toBeNull();
            request.flush(versionId);
        });
    });
    describe('should create a new Tag', function() {
        beforeEach(function() {
            this.tagConfig = {
                title: 'Title',
                description: 'Description',
                commitId: commitId,
                iri: versionId
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/tags';
        });
        it('unless an error occurs', function() {
            service.createRecordTag(recordId, catalogId, this.tagConfig)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a description', function() {
            service.createRecordTag(recordId, catalogId, this.tagConfig)
                .subscribe(response => {
                    expect(response).toEqual(versionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.tagConfig.title);
            expect((request.request.body as FormData).get('commit').toString()).toEqual(this.tagConfig.commitId);
            expect((request.request.body as FormData).get('iri').toString()).toEqual(this.tagConfig.iri);
            expect((request.request.body as FormData).get('description').toString()).toEqual(this.tagConfig.description);
            request.flush(versionId);
        });
        it('without a description', function() {
            delete this.tagConfig.description;
            service.createRecordTag(recordId, catalogId, this.tagConfig)
                .subscribe(response => {
                    expect(response).toEqual(versionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.tagConfig.title);
            expect((request.request.body as FormData).get('commit').toString()).toEqual(this.tagConfig.commitId);
            expect((request.request.body as FormData).get('iri').toString()).toEqual(this.tagConfig.iri);
            expect((request.request.body as FormData).get('description')).toBeNull();
            request.flush(versionId);
        });
    });
    describe('should update a Record Version', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId);
        });
        it('unless an error occurs', function() {
            service.updateRecordVersion(versionId, recordId, catalogId, emptyObj)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateRecordVersion(versionId, recordId, catalogId, emptyObj)
                .subscribe(response => {
                    expect(response).toEqual(versionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush(null);
        });
    });
    describe('should delete a Record Version', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId);
        });
        it('unless an error occurs', function() {
            service.deleteRecordVersion(versionId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteRecordVersion(versionId, recordId, catalogId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should retrieve the Commit of a Version', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/commit';
        });
        it('unless an error occurs', function() {
            service.getVersionCommit(versionId, recordId, catalogId, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format')).toEqual('jsonld');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getVersionCommit(versionId, recordId, catalogId, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format')).toEqual('turtle');
            request.flush(commitDifference);
        });
        it('without a format', function() {
            service.getVersionCommit(versionId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format')).toEqual('jsonld');
            request.flush(commitDifference);
        });
    });
    describe('should retrieve a list of Version Distributions', function() {
        beforeEach(function() {
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions';
            service.sortOptions = [sortOption];
        });
        it('unless an error occurs', function() {
            service.getVersionDistributions(versionId, recordId, catalogId, this.config)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with all config passed', function() {
            service.getVersionDistributions(versionId, recordId, catalogId, this.config)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
            expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
            expect(request.request.params.get('sort')).toEqual(this.config.sort);
            expect(request.request.params.get('ascending')).toEqual('' + this.config.ascending);
            request.flush([]);
        });
        it('without any config', function() {
            service.getVersionDistributions(versionId, recordId, catalogId, {})
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('sort')).toEqual(sortOption.field);
            expect(request.request.params.get('ascending')).toEqual('' + sortOption.asc);
            request.flush([]);
        });
    });
    describe('should retrieve a Version Distribution', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId);
        });
        it('unless an error occurs', function() {
            service.getVersionDistribution(distributionId, versionId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getVersionDistribution(distributionId, versionId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(emptyObj);
        });
    });
    describe('should create a new Version Distribution', function() {
        beforeEach(function () {
            this.distributionConfig = {
                title: 'Title',
                description: 'Description',
                format: 'text/plain',
                accessURL: 'http://example.com/access',
                downloadURL: 'http://example.com/download',
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions';
        });
        it('unless an error occurs', function() {
            service.createVersionDistribution(versionId, recordId, catalogId, this.distributionConfig)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a description, format, access URL, and download URL', function() {
            service.createVersionDistribution(versionId, recordId, catalogId, this.distributionConfig)
                .subscribe(response => {
                    expect(response).toEqual(distributionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.distributionConfig.title);
            expect((request.request.body as FormData).get('description').toString()).toEqual(this.distributionConfig.description);
            expect((request.request.body as FormData).get('format').toString()).toEqual(this.distributionConfig.format);
            expect((request.request.body as FormData).get('accessURL').toString()).toEqual(this.distributionConfig.accessURL);
            expect((request.request.body as FormData).get('downloadURL').toString()).toEqual(this.distributionConfig.downloadURL);
            request.flush(distributionId);
        });
        it('without a description, format, access URL, or download URL', function() {
            delete this.distributionConfig.description;
            delete this.distributionConfig.format;
            delete this.distributionConfig.accessURL;
            delete this.distributionConfig.downloadURL;
            service.createVersionDistribution(versionId, recordId, catalogId, this.distributionConfig)
                .subscribe(response => {
                    expect(response).toEqual(distributionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.distributionConfig.title);
            expect((request.request.body as FormData).get('description')).toBeNull();
            expect((request.request.body as FormData).get('format')).toBeNull();
            expect((request.request.body as FormData).get('accessURL')).toBeNull();
            expect((request.request.body as FormData).get('downloadURL')).toBeNull();
            request.flush(distributionId);
        });
    });
    describe('should update a Version Distribution', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId);
        });
        it('unless an error occurs', function() {
            service.updateVersionDistribution(distributionId, versionId, recordId, catalogId, emptyObj)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateVersionDistribution(distributionId, versionId, recordId, catalogId, emptyObj)
                .subscribe(response => {
                    expect(response).toEqual(distributionId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush(null);
        });
    });
    describe('should delete a Version Distribution', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/versions/' + encodeURIComponent(versionId) + '/distributions/' + encodeURIComponent(distributionId);
        });
        it('unless an error occurs', function() {
            service.deleteVersionDistribution(distributionId, versionId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteVersionDistribution(distributionId, versionId, recordId, catalogId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should retrieve a list of Record Branches', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches';
            this.config = {
                limit: 10,
                offset: 0,
                sort: 'http://purl.org/dc/terms/issued',
                ascending: true
            };
            service.sortOptions = [sortOption];
        });
        it('unless an error occurs', function() {
            service.getRecordBranches(recordId, catalogId, this.config)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with all config passed', function() {
            this.config.applyUserFilter = true;
            service.getRecordBranches(recordId, catalogId, this.config, true)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toEqual('' + this.config.limit);
            expect(request.request.params.get('offset')).toEqual('' + this.config.offset);
            expect(request.request.params.get('sort')).toEqual(this.config.sort);
            expect(request.request.params.get('ascending')).toEqual('' + this.config.ascending);
            expect(request.request.params.get('applyUserFilter')).toEqual('true');
            request.flush([]);
        });
        it('without any config', function() {
            service.getRecordBranches(recordId, catalogId, {})
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('sort')).toEqual(sortOption.field);
            expect(request.request.params.get('ascending')).toEqual('' + sortOption.asc);
            expect(request.request.params.get('applyUserFilter')).toEqual('false');
            request.flush([]);
        });
    });
    describe('should retrieve the master Branch of a Record', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/master';
        });
        it('unless an error occurs', function() {
            service.getRecordMasterBranch(recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecordMasterBranch(recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(emptyObj);
        });
    });
    describe('should retrieve a Record Branch', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId);
        });
        it('unless an error occurs', function() {
            service.getRecordBranch(branchId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRecordBranch(branchId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(emptyObj);
        });
    });
    describe('should create a new Branch', function() {
        beforeEach(function() {
            this.branchConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches';
        });
        it('unless an error occurs', function() {
            service.createRecordBranch(recordId, catalogId, this.branchConfig, commitId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a description', function() {
            service.createRecordBranch(recordId, catalogId, this.branchConfig, commitId)
                .subscribe(response => {
                    expect(response).toEqual(branchId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.branchConfig.title);
            expect((request.request.body as FormData).get('type').toString()).toEqual(CATALOG + 'Branch');
            expect((request.request.body as FormData).get('commitId').toString()).toEqual(commitId);
            expect((request.request.body as FormData).get('description').toString()).toEqual(this.branchConfig.description);
            request.flush(branchId);
        });
        it('without a description', function() {
            delete this.branchConfig.description;
            service.createRecordBranch(recordId, catalogId, this.branchConfig, commitId)
                .subscribe(response => {
                    expect(response).toEqual(branchId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.branchConfig.title);
            expect((request.request.body as FormData).get('type').toString()).toEqual(CATALOG + 'Branch');
            expect((request.request.body as FormData).get('commitId').toString()).toEqual(commitId);
            expect((request.request.body as FormData).get('description')).toBeNull();
            request.flush(branchId);
        });
    });
    describe('should create a new UserBranch', function() {
        beforeEach(function() {
            this.branchConfig = {
                title: 'Title',
                description: 'Description'
            };
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches';
            spyOn<any>(service, '_getRecordBranch').and.callFake(() => of(emptyObj));
            spyOn(service, 'updateRecordBranch').and.callFake(() => of(branchId));
        });
        describe('unless an error occurs', function() {
            it('with the first create request', function() {
                service.createRecordUserBranch(recordId, catalogId, this.branchConfig, commitId, branchId)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect((service as any)._getRecordBranch).not.toHaveBeenCalled();
                        expect(service.updateRecordBranch).not.toHaveBeenCalled();
                    });
                const request = httpMock.expectOne({url: this.url, method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                request.flush('flush', { status: 400, statusText: error });
            });
            it('with another call in the chain', function() {
                (service as any)._getRecordBranch.and.callFake(() => throwError(error));
                service.createRecordUserBranch(recordId, catalogId, this.branchConfig, commitId, branchId)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect((service as any)._getRecordBranch).toHaveBeenCalledWith(encodeURIComponent(branchId), recordId, catalogId);
                        expect(service.updateRecordBranch).not.toHaveBeenCalled();
                    });
                const request = httpMock.expectOne({url: this.url, method: 'POST'});
                expect(request.request.body instanceof FormData).toBeTrue();
                request.flush(branchId);
            });
        });
        it('with a description', function() {
            const expectedBranch = Object.assign({}, emptyObj);
            expectedBranch[CATALOG + 'head'] = [{'@id': commitId}];
            expectedBranch[CATALOG + 'createdFrom'] = [{'@id': branchId}];
            service.createRecordUserBranch(recordId, catalogId, this.branchConfig, commitId, branchId)
                .subscribe(response => {
                    expect(response).toEqual(branchId);
                    expect((service as any)._getRecordBranch).toHaveBeenCalledWith(encodeURIComponent(branchId), recordId, catalogId);
                    expect(service.updateRecordBranch).toHaveBeenCalledWith(emptyObj['@id'], recordId, catalogId, expectedBranch);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.branchConfig.title);
            expect((request.request.body as FormData).get('type').toString()).toEqual(CATALOG + 'UserBranch');
            expect((request.request.body as FormData).get('commitId')).toEqual(commitId);
            expect((request.request.body as FormData).get('description')).toEqual(this.branchConfig.description);
            request.flush(branchId);
        });
        it('without a description', function() {
            delete this.branchConfig.description;
            const expectedBranch = Object.assign({}, emptyObj);
            expectedBranch[CATALOG + 'head'] = [{'@id': commitId}];
            expectedBranch[CATALOG + 'createdFrom'] = [{'@id': branchId}];
            service.createRecordUserBranch(recordId, catalogId, this.branchConfig, commitId, branchId)
                .subscribe(response => {
                    expect(response).toEqual(branchId);
                    expect((service as any)._getRecordBranch).toHaveBeenCalledWith(encodeURIComponent(branchId), recordId, catalogId);
                    expect(service.updateRecordBranch).toHaveBeenCalledWith(emptyObj['@id'], recordId, catalogId, expectedBranch);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.branchConfig.title);
            expect((request.request.body as FormData).get('type').toString()).toEqual(CATALOG + 'UserBranch');
            expect((request.request.body as FormData).get('commitId')).toEqual(commitId);
            expect((request.request.body as FormData).get('description')).toBeNull();
            request.flush(branchId);
        });
    });
    describe('should update a Record Branch', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId);
        });
        it('unless an error occurs', function() {
            service.updateRecordBranch(branchId, recordId, catalogId, emptyObj)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateRecordBranch(branchId, recordId, catalogId, emptyObj)
                .subscribe(response => {
                    expect(response).toEqual(branchId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush(null);
        });
    });
    describe('should delete a Record Branch', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId);
        });
        it('unless an error occurs', function() {
            service.deleteRecordBranch(branchId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteRecordBranch(branchId, recordId, catalogId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should retrieve Branch Commits', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits';
        });
        it('unless an error occurs', function() {
            service.getBranchCommits(branchId, recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getBranchCommits(branchId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush([]);
        });
        it('successfully with target ID', function() {
            service.getBranchCommits(branchId, recordId, catalogId, branchId)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('targetId').toString()).toEqual(branchId);
            request.flush([]);
        });
    });
    describe('should retrieve Commit history', function() {
        beforeEach(function() {
            this.url = service.commitsPrefix + '/' + encodeURIComponent(commitId) + '/history';
        });
        describe('unless an error occurs', function() {
            it('with no targetId or entityId set', function() {
                service.getCommitHistory(commitId)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                    });
                const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                expect(request.request.params.get('targetId')).toBeNull();
                expect(request.request.params.get('entityId')).toBeNull();
                request.flush('flush', { status: 400, statusText: error });
            });
            it('with a targetId set', function() {
                service.getCommitHistory(commitId, commitId)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                    });
                const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                expect(request.request.params.get('targetId').toString()).toEqual(commitId);
                expect(request.request.params.get('entityId')).toBeNull();
                request.flush('flush', { status: 400, statusText: error });
            });
            it('with a entityId set', function() {
                service.getCommitHistory(commitId, '', commitId)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                    });
                const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                expect(request.request.params.get('targetId')).toBeNull();
                expect(request.request.params.get('entityId').toString()).toEqual(commitId);
                request.flush('flush', { status: 400, statusText: error });
            });
        });
        describe('successfully', function() {
            describe('when not tracked', function() {
                it('with no targetId or entityId set', function() {
                    service.getCommitHistory(commitId)
                        .subscribe(response => {
                            expect(response).toEqual([]);
                            expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('targetId')).toBeNull();
                    expect(request.request.params.get('entityId')).toBeNull();
                    request.flush([]);
                });
                it('with a targetId set', function() {
                    service.getCommitHistory(commitId, commitId)
                        .subscribe(response => {
                            expect(response).toEqual([]);
                            expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('targetId').toString()).toEqual(commitId);
                    expect(request.request.params.get('entityId')).toBeNull();
                    request.flush([]);
                });
                it('with a entityId set', function() {
                    service.getCommitHistory(commitId, '', commitId)
                        .subscribe(response => {
                            expect(response).toEqual([]);
                            expect(progressSpinnerStub.track).toHaveBeenCalledWith(jasmine.any(Observable));
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('targetId')).toBeNull();
                    expect(request.request.params.get('entityId').toString()).toEqual(commitId);
                    request.flush([]);
                });
            });
            describe('when tracked elsewhere', function() {
                it('with no targetId or entityId set', function() {
                    service.getCommitHistory(commitId, '', '', true)
                        .subscribe(response => {
                            expect(response).toEqual([]);
                            expect(progressSpinnerStub.track).not.toHaveBeenCalled();
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('targetId')).toBeNull();
                    expect(request.request.params.get('entityId')).toBeNull();
                    request.flush([]);
                });
                it('with a targetId set', function() {
                    service.getCommitHistory(commitId, commitId, '', true)
                        .subscribe(response => {
                            expect(response).toEqual([]);
                            expect(progressSpinnerStub.track).not.toHaveBeenCalled();
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('targetId').toString()).toEqual(commitId);
                    expect(request.request.params.get('entityId')).toBeNull();
                    request.flush([]);
                });
                it('with a entityId set', function() {
                    service.getCommitHistory(commitId, '', commitId, true)
                        .subscribe(response => {
                            expect(response).toEqual([]);
                            expect(progressSpinnerStub.track).not.toHaveBeenCalled();
                        }, () => fail('Observable should have resolved'));
                    const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
                    expect(request.request.params.get('targetId')).toBeNull();
                    expect(request.request.params.get('entityId').toString()).toEqual(commitId);
                    request.flush([]);
                });
            });
        });
    });
    describe('should create a new commit on a Branch', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits';
        });
        it('unless an error occurs', function() {
            service.createBranchCommit(branchId, recordId, catalogId, 'test')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('message').toString()).toEqual('test');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.createBranchCommit(branchId, recordId, catalogId, 'test')
                .subscribe(response => {
                    expect(response).toEqual(commitId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('message').toString()).toEqual('test');
            request.flush(commitId);
        });
    });
    describe('should retrieve the head Commit of a Branch', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/head';
        });
        it('unless an error occurs', function() {
            service.getBranchHeadCommit(branchId, recordId, catalogId, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getBranchHeadCommit(branchId, recordId, catalogId, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('turtle');
            request.flush(commitDifference);
        });
        it('without a format', function() {
            service.getBranchHeadCommit(branchId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush(commitDifference);
        });
    });
    describe('should retrieve a Commit', function() {
        beforeEach(function () {
            this.url = service.commitsPrefix + '/' + encodeURIComponent(commitId);
        });
        it('unless an error occurs', function() {
            service.getCommit(commitId, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getCommit(commitId, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('turtle');
            request.flush(emptyObj);
        });
        it('without a format', function() {
            service.getCommit(commitId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush(emptyObj);
        });
    });
    describe('should retrieve a Branch Commit', function() {
        beforeEach(function () {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId);
        });
        it('unless an error occurs', function() {
            service.getBranchCommit(commitId, branchId, recordId, catalogId, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getBranchCommit(commitId, branchId, recordId, catalogId, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('turtle');
            request.flush(commitDifference);
        });
        it('without a format', function() {
            service.getBranchCommit(commitId, branchId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush(commitDifference);
        });
    });
    describe('should get the difference between two commits', function() {
        beforeEach(function() {
            this.url = service.commitsPrefix + '/' + encodeURIComponent(commitId) + '/difference';
        });
        it('unless an error occurs', function() {
            service.getDifference(commitId, commitId, null, null, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('format')).toEqual('jsonld');
            expect(request.request.params.get('targetId')).toEqual(commitId);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getDifference(commitId, commitId, null, null, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('format')).toEqual('turtle');
            expect(request.request.params.get('targetId')).toEqual(commitId);
            request.flush(commitDifference);
        });
        it('without a format', function() {
            service.getDifference(commitId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('format')).toEqual('jsonld');
            expect(request.request.params.get('targetId')).toEqual(commitId);
            request.flush(commitDifference);
        });
        it('without a targetId', function() {
            service.getDifference(commitId)
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toBeNull();
            expect(request.request.params.get('offset')).toBeNull();
            expect(request.request.params.get('format')).toEqual('jsonld');
            expect(request.request.params.get('targetId')).toBeNull();
            request.flush(commitDifference);
        });
        it('with a limit and offset', function() {
            service.getDifference(commitId, commitId, 100, 0, 'turtle')
                .subscribe((response: HttpResponse<CommitDifference>) => {
                    expect(response.body).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('limit')).toEqual('100');
            expect(request.request.params.get('offset')).toEqual('0');
            expect(request.request.params.get('format')).toEqual('turtle');
            expect(request.request.params.get('targetId')).toEqual(commitId);
            request.flush(commitDifference);
        });
    });
    describe('should get the difference for a specific entity on a commit', function() {
        beforeEach(function() {
            this.url = service.commitsPrefix + '/' + encodeURIComponent(commitId) + '/difference/' + encodeURI(entityId);
        });
        it('unless an error occurs', function() {
            service.getDifferenceForSubject(entityId, commitId, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getDifferenceForSubject(entityId, commitId, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('turtle');
            request.flush(commitDifference);
        });
        it('without a format', function() {
            service.getDifferenceForSubject(entityId, commitId)
                .subscribe(response => {
                    expect(response).toEqual(commitDifference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush(commitDifference);
        });
    });
    describe('should get the difference between two Branches', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/difference';
        });
        it('unless an error occurs', function() {
            service.getBranchDifference(branchId, branchId, recordId, catalogId, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('targetId').toString()).toEqual(branchId);
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getBranchDifference(branchId, branchId, recordId, catalogId, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual(difference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('targetId').toString()).toEqual(branchId);
            expect(request.request.params.get('format').toString()).toEqual('turtle');
            request.flush(difference);
        });
        it('without a format', function() {
            service.getBranchDifference(branchId, branchId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(difference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('targetId').toString()).toEqual(branchId);
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush(difference);
        });
    });
    describe('should get the conflicts between two Branches', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts';
        });
        it('unless an error occurs', function() {
            service.getBranchConflicts(branchId, branchId, recordId, catalogId, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('targetId').toString()).toEqual(branchId);
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getBranchConflicts(branchId, branchId, recordId, catalogId, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('targetId').toString()).toEqual(branchId);
            expect(request.request.params.get('format').toString()).toEqual('turtle');
            request.flush([]);
        });
        it('without a format', function() {
            service.getBranchConflicts(branchId, branchId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('targetId').toString()).toEqual(branchId);
            expect(request.request.params.get('format').toString()).toEqual('jsonld');
            request.flush([]);
        });
    });
    describe('should merge two Branches', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/conflicts/resolution';
        });
        it('unless an error occurs', function() {
            service.mergeBranches(branchId, branchId, recordId, catalogId, difference)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('targetId')).toEqual(branchId);
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with additions and deletions', function() {
            const fullDifference = Object.assign({}, difference);
            fullDifference.additions = [emptyObj];
            fullDifference.deletions = [emptyObj];
            service.mergeBranches(branchId, branchId, recordId, catalogId, fullDifference)
                .subscribe(response => {
                    expect(response).toEqual(commitId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('targetId')).toEqual(branchId);
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('additions').toString()).toEqual(JSON.stringify(fullDifference.additions));
            expect((request.request.body as FormData).get('deletions').toString()).toEqual(JSON.stringify(fullDifference.deletions));
            request.flush(commitId);
        });
        it('without additions and deletions', function() {
            service.mergeBranches(branchId, branchId, recordId, catalogId, difference)
                .subscribe(response => {
                    expect(response).toEqual(commitId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.params.get('targetId')).toEqual(branchId);
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('additions').toString()).toEqual(JSON.stringify(difference.additions));
            expect((request.request.body as FormData).get('deletions').toString()).toEqual(JSON.stringify(difference.deletions));
            request.flush(commitId);
        });
    });
    describe('should retrieve the compiled resource from a Branch Commit', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource';
        });
        it('unless an error occurs', function() {
            service.getResource(commitId, branchId, recordId, catalogId, true, 'jsonld')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format')).toEqual('jsonld');
            expect(request.request.params.get('applyInProgressCommit')).toEqual('true');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a format', function() {
            service.getResource(commitId, branchId, recordId, catalogId, false, 'turtle')
                .subscribe(response => {
                    expect(response).toEqual('test');
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format')).toEqual('turtle');
            expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
            request.flush('test');
        });
        it('without a format', function() {
            service.getResource(commitId, branchId, recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual([emptyObj]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'GET');
            expect(request.request.params.get('format')).toEqual('jsonld');
            expect(request.request.params.get('applyInProgressCommit')).toEqual('false');
            request.flush([emptyObj]);
        });
    });
    describe('should download the compiled resource from a Branch Commit', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/branches/' + encodeURIComponent(branchId) + '/commits/' + encodeURIComponent(commitId) + '/resource';
            spyOn(window, 'open');
        });
        it('with a optional params', function() {
            const params = new HttpParams({
                fromObject: {
                    applyInProgressCommit: 'true',
                    format: 'turtle',
                    fileName: 'test'
                }
            });
            service.downloadResource(commitId, branchId, recordId, catalogId, true, 'turtle', 'test');
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
        it('without a optional params', function() {
            const params = new HttpParams({
                fromObject: {
                    applyInProgressCommit: 'false',
                    format: 'jsonld',
                    fileName: 'resource'
                }
            });
            service.downloadResource(commitId, branchId, recordId, catalogId);
            expect(window.open).toHaveBeenCalledWith(this.url + '?' + params.toString());
        });
    });
    describe('should create a new InProgressCommit for the logged-in User', function() {
        beforeEach(function () {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            service.createInProgressCommit(recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.createInProgressCommit(recordId, catalogId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            request.flush(200);
        });
    });
    describe('should retrieve an InProgressCommit for the logged-in User', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            service.getInProgressCommit(recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), (response: HttpErrorResponse) => {
                    expect(response.statusText).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getInProgressCommit(recordId, catalogId)
                .subscribe(response => {
                    expect(response).toEqual(difference);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(difference);
        });
    });
    describe('should update an InProgressCommit for the logged-in User', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            service.updateInProgressCommit(recordId, catalogId, difference)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateInProgressCommit(recordId, catalogId, difference)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect((request.request.body as FormData).get('additions').toString()).toEqual('[]');
            expect((request.request.body as FormData).get('deletions').toString()).toEqual('[]');
            request.flush(200);
        });
    });
    describe('should remove an InProgressCommit for the logged-in User', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(catalogId) + '/records/' + encodeURIComponent(recordId) + '/in-progress-commit';
        });
        it('unless an error occurs', function() {
            service.deleteInProgressCommit(recordId, catalogId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteInProgressCommit(recordId, catalogId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should get an entity name', function() {
        it('if it has a title', function() {
            const title = 'Title';
            utilStub.getDctermsValue.and.returnValue(title);
            expect(service.getEntityName(emptyObj)).toEqual(title);
        });
        it('if it does not have a title', function() {
            expect(service.getEntityName(emptyObj)).toEqual('(Anonymous)');
        });
    });
    it('should test whether an entity is a Record', function() {
        expect(service.isRecord(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'Record');
        expect(service.isRecord(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isRecord(emptyObj)).toEqual(true);
    });
    it('should test whether an entity is a VersionedRDFRecord', function() {
        expect(service.isVersionedRDFRecord(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'VersionedRDFRecord');
        expect(service.isVersionedRDFRecord(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isVersionedRDFRecord(emptyObj)).toEqual(true);
    });
    it('should test whether an entity is a Distribution', function() {
        expect(service.isDistribution(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'Distribution');
        expect(service.isDistribution(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isDistribution(emptyObj)).toEqual(true);
    });
    it('should test whether an entity is a Branch', function() {
        expect(service.isBranch(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'Branch');
        expect(service.isBranch(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isBranch(emptyObj)).toEqual(true);
    });
    it('should test whether an entity is a UserBranch', function() {
        expect(service.isUserBranch(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'UserBranch');
        expect(service.isUserBranch(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isUserBranch(emptyObj)).toEqual(true);
    });
    it('should test whether an entity is a Version', function() {
        expect(service.isVersion(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'Version');
        expect(service.isVersion(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isVersion(emptyObj)).toEqual(true);
    });
    it('should test whether an entity is a Tag', function() {
        expect(service.isTag(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'Tag');
        expect(service.isTag(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isTag(emptyObj)).toEqual(true);
    });
    it('should test whether an entity is a Commit', function() {
        expect(service.isCommit(emptyObj)).toEqual(false);
        emptyObj['@type'].push(CATALOG + 'Commit');
        expect(service.isCommit(emptyObj)).toEqual(true);
        emptyObj['@type'].push(CATALOG + 'Test');
        expect(service.isCommit(emptyObj)).toEqual(true);
    });
});
