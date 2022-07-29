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
import { MockProvider } from 'ng-mocks';

import {
    cleanStylesFromDOM,
    mockUtil,
} from '../../../../../test/ts/Shared';
import { MERGEREQ } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { HelperService } from './helper.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';

describe('Merge Request Manager service', function() {
    let service: MergeRequestManagerService;
    let utilStub;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error Message';
    const requestId = 'requestId';
    const commentId = 'commentId';
    const commentText = 'HELLO WORLD';
    const emptyObj: JSONLDObject = {'@id': '', '@type': []};

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                MergeRequestManagerService,
                HelperService,
                MockProvider(ProgressSpinnerService),
                { provide: 'utilService', useClass: mockUtil },
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(MergeRequestManagerService);
        utilStub = TestBed.get('utilService');
        httpMock = TestBed.get(HttpTestingController);
        progressSpinnerStub = TestBed.get(ProgressSpinnerService);

        utilStub.paginatedConfigToParams.and.callFake(x => Object.assign({}, x) || {});
        progressSpinnerStub.track.and.callFake((ob) => ob);
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

    describe('should get a list of merge requests', function() {
        beforeEach(function() {
            this.config = {
                accepted: true
            };
        });
        it('unless an error occurs', function() {
            service.getRequests(this.config)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('accepted').toString()).toEqual('' + this.config.accepted);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('without parameters', function() {
            service.getRequests(this.config)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('accepted').toString()).toEqual('' + this.config.accepted);
            expect(request.request.params.get('sort')).toBeNull();
            expect(request.request.params.get('ascending')).toBeNull();
            request.flush([]);
        });
        it('with parameters', function() {
            this.config.ascending = false;
            this.config.sort = 'sort';
            service.getRequests(this.config)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('accepted').toString()).toEqual('' + this.config.accepted);
            expect(request.request.params.get('sort').toString()).toEqual(this.config.sort);
            expect(request.request.params.get('ascending').toString()).toEqual('' + this.config.ascending);
            request.flush([]);
        });
    });
    describe('should create a new merge request', function() {
        beforeEach(function() {
            this.requestConfig = {
                title: 'Title',
                description: 'Description',
                recordId: 'recordId',
                sourceBranchId: 'branch1',
                targetBranchId: 'branch2',
                assignees: ['user1', 'user2'],
                removeSource: true
            };
        });
        it('unless an error occurs', function() {
            service.createRequest(this.requestConfig)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a description and assignees', function() {
            service.createRequest(this.requestConfig)
                .subscribe(response => {
                    expect(response).toBe(requestId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.requestConfig.title);
            expect((request.request.body as FormData).get('description').toString()).toEqual(this.requestConfig.description);
            expect((request.request.body as FormData).get('recordId').toString()).toEqual(this.requestConfig.recordId);
            expect((request.request.body as FormData).get('sourceBranchId').toString()).toEqual(this.requestConfig.sourceBranchId);
            expect((request.request.body as FormData).get('targetBranchId').toString()).toEqual(this.requestConfig.targetBranchId);
            expect((request.request.body as FormData).get('removeSource').toString()).toEqual('' + this.requestConfig.removeSource);
            expect((request.request.body as FormData).getAll('assignees')).toEqual(this.requestConfig.assignees);
            request.flush(requestId);
        });
        it('without a description or assignees', function() {
            delete this.requestConfig.description;
            delete this.requestConfig.assignees;
            service.createRequest(this.requestConfig)
            .subscribe(response => {
                expect(response).toBe(requestId);
            }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            expect(request.request.body instanceof FormData).toBeTrue();
            expect((request.request.body as FormData).get('title').toString()).toEqual(this.requestConfig.title);
            expect((request.request.body as FormData).get('description')).toBeNull();
            expect((request.request.body as FormData).get('recordId').toString()).toEqual(this.requestConfig.recordId);
            expect((request.request.body as FormData).get('sourceBranchId').toString()).toEqual(this.requestConfig.sourceBranchId);
            expect((request.request.body as FormData).get('targetBranchId').toString()).toEqual(this.requestConfig.targetBranchId);
            expect((request.request.body as FormData).get('removeSource').toString()).toEqual('' + this.requestConfig.removeSource);
            expect((request.request.body as FormData).getAll('assignees')).toEqual([]);
            request.flush(requestId);
        });
    });
    describe('should get a single merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId);
        });
        it('unless an error occurs', function() {
            service.getRequest(requestId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getRequest(requestId)
                .subscribe(response => {
                    expect(response).toEqual(emptyObj);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush(emptyObj);
        });
    });
    describe('should remove a single merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId);
        });
        it('unless an error occurs', function() {
            service.deleteRequest(requestId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
          service.deleteRequest(requestId)
              .subscribe(() => {
              }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should accept a merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId);
        });
        it('unless an error occurs', function() {
            service.acceptRequest(requestId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.acceptRequest(requestId)
              .subscribe(() => {
              }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            request.flush(200);
        });
    });
    describe('should get the list of comments on a merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId) + '/comments';
        });
        it('unless an error occurs', function() {
            service.getComments(requestId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.getComments(requestId)
                .subscribe(response => {
                    expect(response).toEqual([[emptyObj]]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'GET'});
            request.flush([[emptyObj]]);
        });
    });
    describe('should delete a comment on a merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId) + '/comments/' + encodeURIComponent(commentId);
        });
        it('unless an error occurs', function() {
            service.deleteComment(requestId, commentId)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.deleteComment(requestId, commentId)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should create a comment on a merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId) + '/comments';
        });
        it('unless an error occurs', function() {
            service.createComment(requestId, commentText)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.body).toEqual(commentText);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('with a parent comment id', function() {
            service.createComment(requestId, commentText, commentId)
                .subscribe(response => {
                    expect(response).toEqual(commentId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.body).toEqual(commentText);
            expect(request.request.params.get('commentId').toString()).toEqual(commentId);
            request.flush(commentId);
        });
        it('without a parent comment id', function() {
            service.createComment(requestId, commentText)
                .subscribe(response => {
                    expect(response).toEqual(commentId);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === this.url && req.method === 'POST');
            expect(request.request.body).toEqual(commentText);
            expect(request.request.params.get('commentId')).toBeNull();
            request.flush(commentId);
        });
    });
    describe('should update a comment on a merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId) + '/comments/' + encodeURIComponent(commentId);
        });
        it('unless an error occurs', function() {
            service.updateComment(requestId, commentId, commentText)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(commentText);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateComment(requestId, commentId, commentText)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(commentText);
            request.flush(200);
        });
    });
    describe('should update a merge request', function() {
        beforeEach(function() {
            this.url = service.prefix + '/' + encodeURIComponent(requestId);
        });
        it('unless an error occurs', function() {
            service.updateRequest(requestId, emptyObj)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            service.updateRequest(requestId, emptyObj)
                .subscribe(() => {
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush(200);
        });
    });
    it('should determine whether a request is accepted', function() {
        expect(service.isAccepted(emptyObj)).toEqual(false);
        const mr = Object.assign({}, emptyObj);
        mr['@type'] = [MERGEREQ + 'MergeRequest'];
        expect(service.isAccepted(emptyObj)).toEqual(false);
        mr['@type'].push(MERGEREQ + 'AcceptedMergeRequest');
        expect(service.isAccepted(mr)).toEqual(true);
    });
});
