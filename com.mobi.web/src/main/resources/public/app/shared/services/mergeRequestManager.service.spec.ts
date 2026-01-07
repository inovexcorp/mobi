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
import { Observable } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../test/ts/Shared';
import { MERGEREQ, USER } from '../../prefixes';
import { ProgressSpinnerService } from '../components/progress-spinner/services/progressSpinner.service';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { MergeRequestPaginatedConfig } from '../models/mergeRequestPaginatedConfig.interface';
import { MergeRequest } from '../models/mergeRequest.interface';
import { EventWithPayload } from '../models/eventWithPayload.interface';
import { User } from '../models/user.class';
import { MergeRequestManagerService } from './mergeRequestManager.service';

describe('Merge Request Manager service', function() {
    let service: MergeRequestManagerService;
    let httpMock: HttpTestingController;
    let progressSpinnerStub: jasmine.SpyObj<ProgressSpinnerService>;

    const error = 'Error Message';
    const requestId = 'requestId';
    const commentId = 'commentId';
    const commentText = 'HELLO WORLD';
    const emptyObj: JSONLDObject = {'@id': '', '@type': []};
    const creatorUserId = 'urn://test/user/creator-user-1';
    const creatorUsername = 'creator';
    const creator: User = new User({
        '@id': creatorUserId,
        '@type': [`${USER}User`],
        [`${USER}username`]: [{ '@value': creatorUsername }],
        [`${USER}hasUserRole`]: [],
    });
    const mergeRequest01: MergeRequest = {
        title: 'title',
        date: '01/01/2020',
        creator: creator,
        recordIri: 'RECORDIRI',
        assignees: [],
        jsonld: {
            '@id': requestId
        },
        targetBranch: {
            '@id': 'targetBranchId'
        }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ HttpClientTestingModule ],
            providers: [
                MergeRequestManagerService,
                MockProvider(ProgressSpinnerService),
            ]
        });

        service = TestBed.inject(MergeRequestManagerService);
        httpMock = TestBed.inject(HttpTestingController) as jasmine.SpyObj<HttpTestingController>;
        progressSpinnerStub = TestBed.inject(ProgressSpinnerService) as jasmine.SpyObj<ProgressSpinnerService>;
        progressSpinnerStub.track.and.callFake((ob) => ob);
        progressSpinnerStub.trackedRequest.and.callFake((ob, tracked) => tracked ? ob : progressSpinnerStub.track(ob));
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        httpMock = null;
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('should get a list of merge requests', function() {
        it('unless an error occurs', function() {
            service.getRequests({ requestStatus: 'accepted' })
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('requestStatus')).toEqual('accepted');
            request.flush('flush', { status: 400, statusText: error });
        });
        it('without parameters', function() {
            service.getRequests({ requestStatus: 'accepted' })
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('requestStatus')).toEqual('accepted');
            expect(request.request.params.get('sort')).toBeNull();
            expect(request.request.params.get('ascending')).toBeNull();
            expect(request.request.params.get('searchText')).toBeNull();
            expect(request.request.params.get('creators')).toBeNull();
            expect(request.request.params.get('assignees')).toBeNull();
            expect(request.request.params.get('records')).toBeNull();
            request.flush([]);
        });
        it('with parameters', function() {
            const config: MergeRequestPaginatedConfig = {
                requestStatus: 'accepted',
                sortOption: {
                    label: '',
                    field: 'sort',
                    asc: false
                },
                searchText: 'test',
                creators: ['A', 'B'],
                assignees: ['Y', 'Z'],
                records: ['C', 'D']
            };
            service.getRequests(config)
                .subscribe(response => {
                    expect(response.body).toEqual([]);
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne(req => req.url === service.prefix && req.method === 'GET');
            expect(request.request.params.get('requestStatus')).toEqual(config.requestStatus);
            expect(request.request.params.get('sort').toString()).toEqual(config.sortOption.field);
            expect(request.request.params.get('ascending').toString()).toEqual('' + config.sortOption.asc);
            expect(request.request.params.get('searchText').toString()).toEqual(config.searchText);
            expect(request.request.params.getAll('creators')).toEqual(config.creators);
            expect(request.request.params.getAll('assignees')).toEqual(config.assignees);
            expect(request.request.params.getAll('records')).toEqual(config.records);
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
                assignees: [
                    new User({
                        '@id': 'userA',
                        '@type': [`${USER}User`],
                        [`${USER}username`]: [{ '@value': 'userA' }]
                    }),
                    new User({
                        '@id': 'userB',
                        '@type': [`${USER}User`],
                        [`${USER}username`]: [{ '@value': 'userB' }]
                    })
                ],
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
            expect((request.request.body as FormData).getAll('assignees')).toEqual(this.requestConfig.assignees.map(user => user.username));
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
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}`;
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
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}`;
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
                expect(true).toBeTrue();
            }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should accept a merge request', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}/status?action=accept`;
        });
        it('unless an error occurs', function() {
            service.updateRequestStatus(mergeRequest01, 'accept')
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                });
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            request.flush('flush', { status: 400, statusText: error });
        });
        it('successfully', function() {
            const event: EventWithPayload = {
                'eventType': 'EVENT_MERGE_REQUEST_ACCEPTED',
                'payload': {
                    'recordId': 'RECORDIRI',
                    'targetBranchId': 'targetBranchId',
                    'requestToAccept': {
                        'title': 'title',
                        'date': '01/01/2020',
                        'creator': creator,
                        'recordIri': 'RECORDIRI',
                        'assignees': [],
                        'jsonld': {
                            '@id': 'requestId'
                        },
                        'targetBranch': {
                            '@id': 'targetBranchId'
                        }
                    }
                }
            };
            const sub = service.mergeRequestAction$.subscribe((e: EventWithPayload) => {
                expect(e).toEqual(event);
            }, (e) => fail(`Observable should have resolved: ${e}`));
            service.updateRequestStatus(mergeRequest01, 'accept')
              .subscribe(() => {
                expect(true).toBeTrue();
            }, (e) => fail(`Observable should have resolved: ${e}`));
            const request = httpMock.expectOne({url: this.url, method: 'POST'});
            request.flush(200);
            sub.unsubscribe();
        });
    });
    describe('should get the list of comments on a merge request', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}/comments`;
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
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}/comments/${encodeURIComponent(commentId)}`;
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
                    expect(true).toBeTrue();
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'DELETE'});
            request.flush(200);
        });
    });
    describe('should create a comment on a merge request', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}/comments`;
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
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}/comments/${encodeURIComponent(commentId)}`;
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
                    expect(true).toBeTrue();
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(commentText);
            request.flush(200);
        });
    });
    describe('should update a merge request', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/${encodeURIComponent(requestId)}`;
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
                    expect(true).toBeTrue();
                }, () => fail('Observable should have resolved'));
            const request = httpMock.expectOne({url: this.url, method: 'PUT'});
            expect(request.request.body).toEqual(emptyObj);
            request.flush(200);
        });
    });
    it('should determine whether a request is accepted', function() {
        expect(service.requestStatus(emptyObj)).toEqual('open');
        const mr = Object.assign({}, emptyObj);
        mr['@type'] = [`${MERGEREQ}MergeRequest`];
        expect(service.requestStatus(emptyObj)).toEqual('open');
        mr['@type'].push(`${MERGEREQ}AcceptedMergeRequest`);
        expect(service.requestStatus(mr)).toEqual('accepted');
    });
    describe('should retrieve the creators of merge requests', function() {
      beforeEach(function() {
          this.url = `${service.prefix}/creators`;
          this.config = {
              limit: 10,
              offset: 0
          };
      });
      it('unless an error occurs', function() {
          service.getCreators(this.config)
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
                  service.getCreators(this.config)
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
                  service.getCreators(undefined)
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
                  service.getCreators(this.config, true)
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
                  service.getCreators(undefined, true)
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
    describe('should retrieve the assignees of merge requests', function() {
      beforeEach(function() {
          this.url = `${service.prefix}/assignees`;
          this.config = {
              limit: 10,
              offset: 0
          };
      });
      it('unless an error occurs', function() {
          service.getAssignees(this.config)
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
                  service.getAssignees(this.config)
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
                  service.getAssignees(undefined)
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
                  service.getAssignees(this.config, true)
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
                  service.getAssignees(undefined, true)
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
    describe('should retrieve the records of merge requests', function() {
        beforeEach(function() {
            this.url = `${service.prefix}/records`;
            this.config = {
                limit: 10,
                offset: 0
            };
        });
        it('unless an error occurs', function() {
            service.getRecords(this.config)
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
                    service.getRecords(this.config)
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
                    service.getRecords(undefined)
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
                    service.getRecords(this.config, true)
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
                    service.getRecords(undefined, true)
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
});
function spy(service: MergeRequestManagerService, arg1: string) {
    throw new Error('Function not implemented.');
}
