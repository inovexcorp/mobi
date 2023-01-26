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
import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { throwError } from 'rxjs';

import { UtilService } from './util.service';
import { ProvManagerService } from './provManager.service';

 describe('Prov Manager service', function() {
    let service: ProvManagerService;
    let utilStub: jasmine.SpyObj<UtilService>;
    let httpMock: HttpTestingController;

    const error = 'Error Message';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                ProvManagerService,
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(ProvManagerService);
        utilStub = TestBed.get(UtilService);
        httpMock = TestBed.get(HttpTestingController);
      
        utilStub.createHttpParams.and.callThrough();
        utilStub.rejectErrorObject.and.callFake(() => Promise.reject(error));
        utilStub.rejectError.and.callFake(() => Promise.reject(error));
        utilStub.trackedRequest.and.callFake((ob) => ob);
        utilStub.handleError.and.callFake(error => {
            if (error.status === 0) {
                return throwError('');
            } else {
                return throwError(error.statusText || 'Something went wrong. Please try again later.');
            }
        });
        utilStub.paginatedConfigToParams.and.callThrough();
    });

    afterEach(() => {
        service = null;
        utilStub = null;
        httpMock.verify();
    });


    describe('should retrieve a list of Activities', function() {
        let isTracked: boolean;
        let config;
        beforeEach(function() {
            isTracked = true;
            config = { limit: 10, offset: 0 };
        });
        describe('with isTracked is true', function() {
            it('unless an error occurs', function() {
                service.getActivities({}, isTracked)
                    .subscribe(() => {
                        fail('Promise should have rejected');
                    }, (e) => {
                        expect(e).toEqual(error);
                    });

                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush('flush', { status: 400, statusText: error });
            });
            it('with all config passed', function() {
                service.getActivities({offset:2, limit: 5}, isTracked)
                    .subscribe((response: HttpResponse<{activities: any, entities: any}>) => {
                        expect(response.body).toEqual({activities: '', entities: ''});
                    });
                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush({activities: '', entities: ''});
            });
            it('without any config', function() {
                service.getActivities({}, isTracked)
                    .subscribe((response: HttpResponse<{activities: any, entities: any}>) => {
                        expect(response.body).toEqual({activities: '', entities: ''});
                    });
                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush({activities: '', entities: ''});
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

                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush('flush', { status: 400, statusText: error });
            });
            it('with all config passed', function() {
                service.getActivities({offset:2, limit: 5})
                    .subscribe((response: HttpResponse<{activities: any, entities: any}>) => {
                        expect(response.body).toEqual({activities: '', entities: ''});
                    });
                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush({activities: '', entities: ''});
            });
            it('without any config', function() {
                service.getActivities({})
                    .subscribe((response: HttpResponse<{activities: any, entities: any}>) => {
                        expect(response.body).toEqual({activities: '', entities: ''});
                    });
                const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
                request.flush({activities: '', entities: ''});
            });
        });
    });
});
