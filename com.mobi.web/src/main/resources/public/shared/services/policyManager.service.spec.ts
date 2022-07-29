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

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';

import { cleanStylesFromDOM, mockUtil } from '../../../../../test/ts/Shared';
import { HelperService } from './helper.service';
import { PolicyManagerService } from './policyManager.service';

describe('Policy Manager service', function() {
    let service: PolicyManagerService;
    let utilStub;
    let httpMock: HttpTestingController;
    let helper: HelperService;
    const error = 'Error Message';

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                PolicyManagerService,
                HelperService,
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(PolicyManagerService);
        utilStub = TestBed.get('utilService');
        httpMock = TestBed.get(HttpTestingController);
        helper = TestBed.get(HelperService);

        spyOn(helper, 'createHttpParams').and.callThrough();
        utilStub.rejectError.and.callFake(() => Promise.reject(error));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        utilStub = null;
        httpMock = null;
        helper = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should retrieve a list of policies', function() {
        it('unless an error occurs', function(done) {
            service.getPolicies()
                .then(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: error}));
                    expect(helper.createHttpParams).toHaveBeenCalled();
                    done();
                });
            const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function(done) {
            service.getPolicies()
                .then(response => {
                    expect(response).toEqual([]);
                    expect(helper.createHttpParams).toHaveBeenCalled();
                    done();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.prefix, method: 'GET'});
            request.flush([]);
        });
        it('with filters', function(done) {
            const config = {
                relatedResource: 'resource',
                relatedSubject: 'subject',
                relatedAction: 'action'
            };
            service.getPolicies(config.relatedResource, config.relatedSubject, config.relatedAction)
                .then(response => {
                    expect(response).toEqual([]);
                    expect(helper.createHttpParams).toHaveBeenCalled();
                    done();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('relatedResource')).toEqual('resource');
            expect(request.request.params.get('relatedSubject')).toEqual('subject');
            expect(request.request.params.get('relatedAction')).toEqual('action');
            request.flush([]);
        });
    });
    describe('should retrieve a policy', function() {
        it('unless an error occurs', function(done) {
            service.getPolicy('id')
                .then(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: error}));
                    done();
                });
            const request = httpMock.expectOne({url: service.prefix + '/id', method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function(done) {
            service.getPolicy('id')
                .then(response => {
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
                .then(() => fail('Promise should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(utilStub.rejectError).toHaveBeenCalledWith(jasmine.objectContaining({status: 400, statusText: error}));
                    done();
                });
            const request = httpMock.expectOne({url: service.prefix + '/' + this.policy.PolicyId, method: 'PUT'});
            expect(request.request.body).toEqual(this.policy);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('when resolved', function(done) {
            service.updatePolicy(this.policy)
                .then(() => {
                    done();
                }, () => fail('Promise should have resolved'));
            const request = httpMock.expectOne({url: service.prefix + '/' + this.policy.PolicyId, method: 'PUT'});
            expect(request.request.body).toEqual(this.policy);
            request.flush(200);
        });
    });
});
