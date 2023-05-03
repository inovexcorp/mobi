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
import { HttpParams, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { throwError } from 'rxjs';

import { UtilService } from './util.service';
import { ProvManagerService } from './provManager.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';

describe('Prov Manager service', function() {
    let service: ProvManagerService;
    let utilStub: jasmine.SpyObj<UtilService>;
    let httpMock: HttpTestingController;

    const error = 'Error Message';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                ProvManagerService,
                MockProvider(UtilService),
            ]
        });

        service = TestBed.inject(ProvManagerService);
        utilStub = TestBed.inject(UtilService) as jasmine.SpyObj<UtilService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
      
        utilStub.paginatedConfigToParams.and.callFake(x => Object.assign({}, x) || {});
        utilStub.rejectErrorObject.and.callFake(() => Promise.reject(error));
        utilStub.rejectError.and.callFake(() => Promise.reject(error));
        utilStub.trackedRequest.and.callFake((ob) => ob);
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
        utilStub.handleError.and.callFake(error => {
            if (error.status === 0) {
                return throwError('');
            } else {
                return throwError(error.statusText || 'Something went wrong. Please try again later.');
            }
        });
    });

    afterEach(function() {
        service = null;
        utilStub = null;
        httpMock.verify();
    });

    describe('should retrieve a list of Activities', function() {
        let isTracked: boolean;
        beforeEach(function() {
            isTracked = true;
        });
        describe('with isTracked is true', function() {
            it('unless an error occurs', function() {
                service.getActivities({}, isTracked)
                    .subscribe(() => {
                        fail('Promise should have rejected');
                    }, (e) => {
                        expect(e).toEqual(error);
                    });

                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                request.flush('flush', { status: 400, statusText: error });
            });
            it('with all config passed', function() {
                service.getActivities({offset: 2, limit: 5, entity: 'urn:test', agent: 'urn:user'}, isTracked)
                    .subscribe((response: HttpResponse<{activities: JSONLDObject[], entities: JSONLDObject[]}>) => {
                        expect(response.body).toEqual({activities: [], entities: []});
                    });
                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                expect(request.request.params.get('limit')).toEqual('5');
                expect(request.request.params.get('offset')).toEqual('2');
                expect(request.request.params.get('entity')).toEqual('urn:test');
                expect(request.request.params.get('agent')).toEqual('urn:user');
                request.flush({activities: [], entities: []});
            });
            it('without any config', function() {
                service.getActivities({}, isTracked)
                    .subscribe((response: HttpResponse<{activities: JSONLDObject[], entities: JSONLDObject[]}>) => {
                        expect(response.body).toEqual({activities: [], entities: []});
                    });
                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                expect(request.request.params.get('limit')).toBeNull();
                expect(request.request.params.get('offset')).toBeNull();
                expect(request.request.params.get('entity')).toBeNull();
                expect(request.request.params.get('agent')).toBeNull();
                request.flush({activities: [], entities: []});
            });
        });
        describe('without isTracked', function() {
            it('unless an error occurs', function() {
                service.getActivities({})
                    .subscribe(() => {
                        fail('Promise should have rejected');
                    }, (e) => {
                        expect(e).toEqual(error);
                    });

                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                request.flush('flush', { status: 400, statusText: error });
            });
            it('with all config passed', function() {
                service.getActivities({offset: 2, limit: 5, entity: 'urn:test', agent: 'urn:user'})
                    .subscribe((response: HttpResponse<{activities: JSONLDObject[], entities: JSONLDObject[]}>) => {
                        expect(response.body).toEqual({activities: [], entities: []});
                    });
                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                expect(request.request.params.get('limit')).toEqual('5');
                expect(request.request.params.get('offset')).toEqual('2');
                expect(request.request.params.get('entity')).toEqual('urn:test');
                expect(request.request.params.get('agent')).toEqual('urn:user');
                request.flush({activities: [], entities: []});
            });
            it('without any config', function() {
                service.getActivities({})
                    .subscribe((response: HttpResponse<{activities: JSONLDObject[], entities: JSONLDObject[]}>) => {
                        expect(response.body).toEqual({activities: [], entities: []});
                    });
                const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
                expect(request.request.params.get('limit')).toBeNull();
                expect(request.request.params.get('offset')).toBeNull();
                expect(request.request.params.get('entity')).toBeNull();
                expect(request.request.params.get('agent')).toBeNull();
                request.flush({activities: [], entities: []});
            });
        });
    });
});
