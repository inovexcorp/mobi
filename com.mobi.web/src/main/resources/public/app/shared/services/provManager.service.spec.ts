/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2025 iNovex Information Systems, Inc.
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
import { MockProvider } from 'ng-mocks';

import { JSONLDObject } from '../models/JSONLDObject.interface';
import { ActivityAction } from '../models/activityAction.interface';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { ProvManagerService } from './provManager.service';

describe('Prov Manager service', function() {
    let service: ProvManagerService;
    let spinnerSvcStub: jasmine.SpyObj<ProgressSpinnerService>;
    let httpMock: HttpTestingController;

    const error = 'Error Message';

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                ProvManagerService,
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(ProvManagerService);
        spinnerSvcStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
      
        spinnerSvcStub.trackedRequest.and.callFake((ob) => ob);
    });

    afterEach(function() {
        service = null;
        spinnerSvcStub = null;
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
     describe('should retrieve a list of action words and activities', function() {
         let isTracked: boolean;
         beforeEach(function() {
             isTracked = true;
         });
         describe('with isTracked is true', function() {
             it('unless an error occurs', function() {
                 service.getActionWords(isTracked)
                     .subscribe(() => {
                         fail('Promise should have rejected');
                     }, (e) => {
                         expect(e).toEqual(error);
                     });

                 const request = httpMock.expectOne({url: `${service.prefix}/actions`, method: 'GET'});
                 request.flush('flush', { status: 400, statusText: error });
             });
             it('successfully', function() {
                 service.getActionWords(isTracked)
                     .subscribe((response: ActivityAction[]) => {
                         expect(response).toEqual([]);
                     });
                 const request = httpMock.expectOne({url: `${service.prefix}/actions`, method: 'GET'});
                 request.flush([]);
             });
         });
         describe('without isTracked', function() {
             it('unless an error occurs', function() {
                 service.getActionWords()
                     .subscribe(() => {
                         fail('Promise should have rejected');
                     }, (e) => {
                         expect(e).toEqual(error);
                     });

                 const request = httpMock.expectOne({url: `${service.prefix}/actions`, method: 'GET'});
                 request.flush('flush', { status: 400, statusText: error });
             });
             it('successfully', function() {
                 service.getActionWords()
                     .subscribe((response: ActivityAction[]) => {
                         expect(response).toEqual([]);
                     });
                 const request = httpMock.expectOne({url: `${service.prefix}/actions`, method: 'GET'});
                 request.flush([]);
             });
         });
     });
});
