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
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { XACMLDecision } from '../models/XACMLDecision.interface';
import { XACMLRequest } from '../models/XACMLRequest.interface';
import { PolicyEnforcementService } from './policyEnforcement.service';

describe('Policy Enforcement service', function() {
    let service: PolicyEnforcementService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const jsonRequest: XACMLRequest = {
        'resourceId': 'urn:test',
        'actionId': 'urn:test',
        'actionAttrs': {
            'urn:test': 'urn:test'
        },
        'resourceAttrs': {
            'urn:test': 'urn:test'
        },
        'subjectAttrs': {
            'urn:test': 'urn:test'
        }
    };

    const jsonMultiRequest: XACMLRequest = {
        'resourceId': ['urn:test'],
        'actionId': ['urn:test'],
        'actionAttrs': {
            'urn:test': 'urn:test'
        },
        'resourceAttrs': {
            'urn:test': 'urn:test'
        },
        'subjectAttrs': {
            'urn:test': 'urn:test'
        }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                PolicyEnforcementService,
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(PolicyEnforcementService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        progressSpinnerStub.track.and.callFake((ob) => ob);
    });

    afterEach(() => {
        service = null;
        progressSpinnerStub = null;
        httpMock.verify();
    });

    describe('should evaluate a request', function() {
        it('unless an error occurs', function() {
            service.evaluateRequest(jsonRequest)
                .subscribe(() => {
                    fail('Observable should have resolved');
                }, (value) => {
                    expect(value).toEqual('Error Message');
                });
            const request = httpMock.expectOne({url: '/mobirest/pep', method: 'POST'});
            request.flush('flush', { status: 400, statusText: 'Error Message' });
        });
        it('when resolved', function() {
            service.evaluateRequest(jsonRequest)
                .subscribe((value: string) => {
                    expect(value).toEqual('PERMIT');
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: '/mobirest/pep', method: 'POST'});
            request.flush('PERMIT');
        });
        it('with additional fields when resolved', function() {
            const copy = JSON.parse(JSON.stringify(jsonRequest));
            copy.additionalField = 'urn:test';
            service.evaluateRequest(copy)
                .subscribe((value: string) => {
                    expect(value).toEqual('PERMIT');
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: '/mobirest/pep', method: 'POST'});
            request.flush('PERMIT');
        });
    });
    describe('should evaluate a multi request', function() {
        it('unless an error occurs', function() {
            service.evaluateMultiDecisionRequest(jsonMultiRequest)
                .subscribe(() => {
                    fail('Observable should have resolved');
                }, (value) => {
                    expect(value).toEqual('Error Message');
                });
            const request = httpMock.expectOne({url: '/mobirest/pep/multiDecisionRequest', method: 'POST'});
            request.flush('flush', { status: 400, statusText: 'Error Message' });
        });
        it('when resolved', function() {
            service.evaluateMultiDecisionRequest(jsonMultiRequest)
                .subscribe((value: XACMLDecision[]) => {
                    expect(value).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: '/mobirest/pep/multiDecisionRequest', method: 'POST'});
            request.flush([]);
        });
        it('with additional fields when resolved', function() {
            const copy = JSON.parse(JSON.stringify(jsonMultiRequest));
            copy.additionalField = 'urn:test';
            service.evaluateMultiDecisionRequest(copy)
                .subscribe((value: XACMLDecision[]) => {
                    expect(value).toEqual([]);
                }, () => fail('Observable should have resolved'));
            
            const request = httpMock.expectOne({url: '/mobirest/pep/multiDecisionRequest', method: 'POST'});
            request.flush([]);
        });
    });
});
