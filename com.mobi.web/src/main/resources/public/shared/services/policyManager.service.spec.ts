/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2022 iNovex Information Systems, Inc.
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
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { throwError } from 'rxjs';

import { cleanStylesFromDOM } from '../../../../../test/ts/Shared';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { UtilService } from './util.service';
import { PolicyManagerService } from './policyManager.service';

describe('Policy Manager service', function() {
    let service: PolicyManagerService;
    let httpMock: HttpTestingController;
    let utilStub: jasmine.SpyObj<UtilService>;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error Message';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                PolicyManagerService,
                MockProvider(UtilService),
                MockProvider(ProgressSpinnerService)
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(PolicyManagerService);
        utilStub = TestBed.get(UtilService);
        httpMock = TestBed.get(HttpTestingController);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);

        progressSpinnerStub.track.and.callFake(ob => ob);
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
        utilStub.trackedRequest.and.callFake((ob) => ob);
        utilStub.handleError.and.callFake(() => throwError(error));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        utilStub = null;
        progressSpinnerStub = null;
        httpMock.verify();
        httpMock = null;
    });

    describe('should retrieve a list of policies', function() {
        it('unless an error occurs', function(done) {
            service.getPolicies()
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({
                        relatedResource: undefined,
                        relatedSubject: undefined,
                        relatedAction: undefined,
                        systemOnly: false,
                    });
                    done();
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function(done) {
            service.getPolicies()
                .subscribe(response => {
                    expect(response).toEqual([]);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith({
                        relatedResource: undefined,
                        relatedSubject: undefined,
                        relatedAction: undefined,
                        systemOnly: false,
                    });
                    done();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            request.flush([]);
        });
        it('with filters', function(done) {
            const config = {
                relatedResource: 'resource',
                relatedSubject: 'subject',
                relatedAction: 'action',
                systemOnly: true
            };
            service.getPolicies(config.relatedResource, config.relatedSubject, config.relatedAction, config.systemOnly)
                .subscribe(response => {
                    expect(response).toEqual([]);
                    expect(utilStub.createHttpParams).toHaveBeenCalledWith(config);
                    done();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('relatedResource')).toEqual('resource');
            expect(request.request.params.get('relatedSubject')).toEqual('subject');
            expect(request.request.params.get('relatedAction')).toEqual('action');
            expect(request.request.params.get('systemOnly')).toEqual('true');
            request.flush([]);
        });
    });
    describe('should retrieve a policy', function() {
        it('unless an error occurs', function(done) {
            service.getPolicy('id')
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    done();
                });
            const request = httpMock.expectOne({url: service.prefix + '/id', method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function(done) {
            service.getPolicy('id')
                .subscribe(response => {
                    expect(response).toEqual({});
                    done();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.prefix + '/id', method: 'GET'});
            request.flush({});
        });
    });
    describe('should update a policy', function() {
        beforeEach(function() {
            this.policy = { PolicyId: 'id' };
        });
        it('unless an error occurs', function(done) {
            service.updatePolicy(this.policy)
                .subscribe(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    done();
                });
            const request = httpMock.expectOne({url: service.prefix + '/' + this.policy.PolicyId, method: 'PUT'});
            expect(request.request.body).toEqual(this.policy);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('when resolved', function(done) {
            service.updatePolicy(this.policy)
                .subscribe(() => {
                    done();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.prefix + '/' + this.policy.PolicyId, method: 'PUT'});
            expect(request.request.body).toEqual(this.policy);
            request.flush(200);
        });
    });
});
