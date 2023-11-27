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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { cloneDeep } from 'lodash';

import {
    DATE_STR,
    SHORTDATE_DATE_STR,
    cleanStylesFromDOM,
} from '../../../test/ts/Shared';
import { CATALOG, DCTERMS, MERGEREQ, ONTOLOGYEDITOR, OWL } from '../../prefixes';
import { CommitDifference } from '../models/commitDifference.interface';
import { Difference } from '../models/difference.class';
import { Conflict } from '../models/conflict.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { MergeRequest } from '../models/mergeRequest.interface';
import { CatalogManagerService } from './catalogManager.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { UserManagerService } from './userManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { ToastService } from './toast.service';
import { MergeRequestsStateService } from './mergeRequestsState.service';

describe('Merge Requests State service', function() {
    let service: MergeRequestsStateService;
    let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let toastStub: jasmine.SpyObj<ToastService>;
    const acceptedRequest = { requestStatus: 'accepted' };
    const openRequest = { requestStatus: 'open' };

    const error = 'Error Message';
    const catalogId = 'catalogId';
    const requestId = 'requestId';
    const recordId = 'recordId';
    const creatorId = 'creator';
    const assigneeId = 'assignee';
    const request: JSONLDObject = {
      '@id': requestId,
      [`${DCTERMS}creator`]: [{'@id': creatorId}],
      [`${MERGEREQ}assignee`]: [{'@id': assigneeId}]
    };
    const sourceBranch: JSONLDObject = {
      '@id': 'source',
      [`${DCTERMS}title`]: [{ '@value': 'title' }],
      [`${CATALOG}head`]: [{ '@id': 'sourceHead' }]
    };
    const targetBranch: JSONLDObject = {
      '@id': 'target',
      [`${DCTERMS}title`]: [{ '@value': 'title' }],
      [`${CATALOG}head`]: [{ '@id': 'targetHead' }]
    };
    const comment: JSONLDObject = {'@id': 'comment'};
    const record: JSONLDObject = {
        '@id': recordId,
        '@type': [
            `${OWL}Thing`,
            `${CATALOG}Record`,
            `${CATALOG}VersionedRecord`,
            `${CATALOG}VersionedRDFRecord`,
            `${ONTOLOGYEDITOR}OntologyRecord`
        ],
        [`${DCTERMS}title`]: [{ '@value': 'title' }]
    };
    const requestObj: MergeRequest = {
        title: 'title',
        date: 'date',
        creator: creatorId,
        recordIri: recordId,
        assignees: [assigneeId],
        jsonld: request,
        recordType: `${ONTOLOGYEDITOR}OntologyRecord`
    };
    const headers = {'has-more-results': 'false'};
    const totalSize = 10;
    const requestsHeaders = {'x-total-count': `${totalSize}`};

    let difference: CommitDifference;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                MergeRequestsStateService,
                MockProvider(MergeRequestManagerService),
                MockProvider(CatalogManagerService),
                MockProvider(UserManagerService),
                MockProvider(OntologyManagerService),
                MockProvider(ToastService),
            ]
        }).compileComponents();

        service = TestBed.inject(MergeRequestsStateService);
        mergeRequestManagerStub = TestBed.inject(MergeRequestManagerService) as jasmine.SpyObj<MergeRequestManagerService>;
        catalogManagerStub = TestBed.inject(CatalogManagerService) as jasmine.SpyObj<CatalogManagerService>;
        userManagerStub = TestBed.inject(UserManagerService) as jasmine.SpyObj<UserManagerService>;
        ontologyManagerStub = TestBed.inject(OntologyManagerService) as jasmine.SpyObj<OntologyManagerService>;
        toastStub = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;

        difference = new CommitDifference();
        difference.additions = [{'@id': 'iri1'}];
        difference.deletions = [{'@id': 'iri2'}];
        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.differencePageSize = 100;
        catalogManagerStub.getDifference.and.returnValue(of(new HttpResponse<CommitDifference>({body: difference, headers: new HttpHeaders(headers)})));
        service.initialize();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        mergeRequestManagerStub = null;
        catalogManagerStub = null;
        ontologyManagerStub = null;
        userManagerStub = null;
        toastStub = null;
    });

    it('should initialize the service', function() {
        service.initialize();
        expect(service.catalogId).toEqual(catalogId);
    });
    it('should reset important variables', function() {
        service.requestConfig = {
            title: 'title',
            description: 'description',
            sourceBranchId: 'id',
            targetBranchId: 'id',
            recordId: 'id',
            assignees: ['user'],
            removeSource: true
        };
        service.createRequestStep = 1;
        service.createRequest = true;
        spyOn(service, 'clearDifference');
        service.reset();
        expect(service.createRequest).toBeFalse();
        expect(service.createRequestStep).toEqual(0);
        expect(service.selected).toBeUndefined();
        expect(service.requestConfig).toEqual({
            title: '',
            description: '',
            sourceBranchId: '',
            targetBranchId: '',
            recordId: '',
            assignees: [],
            removeSource: false
        });
        expect(service.selectedRecord).toBeUndefined();
        expect(service.clearDifference).toHaveBeenCalledWith();
        expect(service.sameBranch).toBeFalse();
        expect(service.acceptedFilter).toBe('open');
        expect(service.totalRequestSize).toEqual(0);
        expect(service.currentRequestPage).toEqual(0);
        expect(service.requestSortOption).toBeUndefined();
        expect(service.requestSearchText).toEqual('');
        expect(service.creatorSearchText).toEqual('');
        expect(service.creators).toEqual([]);
        expect(service.assigneeSearchText).toEqual('');
        expect(service.assignees).toEqual([]);
    });
    it('should clear all difference related variables', function() {
        service.difference = new Difference();
        service.entityNames = {
            test: {
                label: '',
                names: []
            }
        };
        service.startIndex = 2;
        service.clearDifference();
        expect(service.difference).toBeUndefined();
        expect(service.entityNames).toEqual({});
        expect(service.startIndex).toEqual(0);
    });
    describe('should set the requests list properly if accepted is', function() {
        beforeEach(function() {
            service.catalogId = catalogId;
            this.requestObj = Object.assign({}, requestObj);
            spyOn(service, 'getRequestObj').and.returnValue(this.requestObj);
        });
        describe('provided and getRequests', function() {
            describe('resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.getRequests.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [request], headers: new HttpHeaders(requestsHeaders)})));
                });
                describe('and getRecord ', function() {
                    it('resolves', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(of([record]));
                        service.setRequests(acceptedRequest);
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({requestStatus: 'accepted'});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(service.totalRequestSize).toEqual(totalSize);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                        expect(this.requestObj.recordTitle).toEqual('title');
                        expect(this.requestObj.recordType).toEqual(`${ONTOLOGYEDITOR}OntologyRecord`);
                        expect(service.requests).toEqual([this.requestObj]);
                    }));
                    it('rejects', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(throwError(error));
                        service.setRequests(acceptedRequest);
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({requestStatus: 'accepted'});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(service.totalRequestSize).toEqual(totalSize);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                        expect(service.requests).toEqual([]);
                    }));
                });
            });
            it('rejects', fakeAsync(function() {
                mergeRequestManagerStub.getRequests.and.returnValue(throwError(error));
                service.setRequests(acceptedRequest);
                tick();
                expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({requestStatus: 'accepted'});
                expect(service.getRequestObj).not.toHaveBeenCalled();
                expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                expect(service.requests).toEqual([]);
            }));
        });
        describe('not provided and getRequests', function() {
            describe('resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.getRequests.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [request], headers: new HttpHeaders(requestsHeaders)})));
                });
                describe('and getRecord ', function() {
                    it('resolves', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(of([record]));
                        service.setRequests(openRequest);
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({requestStatus: 'open'});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(service.totalRequestSize).toEqual(totalSize);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                        expect(this.requestObj.recordTitle).toEqual('title');
                        expect(this.requestObj.recordType).toEqual(`${ONTOLOGYEDITOR}OntologyRecord`);
                        expect(service.requests).toEqual([this.requestObj]);
                    }));
                    it('rejects', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(throwError(error));
                        service.setRequests(openRequest);
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({requestStatus: 'open'});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(service.totalRequestSize).toEqual(totalSize);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                        expect(service.requests).toEqual([]);
                    }));
                });
            });
            it('rejects', fakeAsync(function() {
                mergeRequestManagerStub.getRequests.and.returnValue(throwError(error));
                service.setRequests(openRequest);
                tick();
                expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({requestStatus: 'open'});
                expect(service.getRequestObj).not.toHaveBeenCalled();
                expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
                expect(service.requests).toEqual([]);
            }));
        });
    });
    describe('should set metadata on a merge request if it is', function() {
        beforeEach(function() {
            service.catalogId = catalogId;
            this.copyRequest = cloneDeep(requestObj);
        });
        describe('accepted and', function() {
            beforeEach(function() {
                mergeRequestManagerStub.isAccepted.and.returnValue(true);
                this.copyRequest.jsonld[`${MERGEREQ}sourceBranchTitle`] = [{ '@value': 'sourceBranchTitle' }];
                this.copyRequest.jsonld[`${MERGEREQ}targetBranchTitle`] = [{ '@value': 'targetBranchTitle' }];
                this.copyRequest.jsonld[`${MERGEREQ}sourceCommit`] = [{ '@id': 'sourceCommit' }];
                this.copyRequest.jsonld[`${MERGEREQ}targetCommit`] = [{ '@id': 'targetCommit' }];
            });
            describe('getComments resolves and', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.getComments.and.returnValue(of([[comment]]));
                });
                describe('getDifference resolves and', function() {
                    beforeEach(function() {
                        this.httpResponse = new HttpResponse<CommitDifference>({body: difference});
                        catalogManagerStub.getDifference.and.returnValue(of(this.httpResponse));
                    });
                    it('processDifferenceResponse resolves', fakeAsync(function() {
                        spyOn(service, 'processDifferenceResponse').and.returnValue(of(null));
                        service.setRequestDetails(this.copyRequest)
                            .subscribe(() => {
                                expect(this.copyRequest.sourceBranch).toEqual({'@id': ''});
                                expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                                expect(this.copyRequest.removeSource).toBeUndefined();
                                expect(this.copyRequest.comments).toEqual([[comment]]);
                                expect(this.copyRequest.sourceTitle).toEqual('sourceBranchTitle');
                                expect(this.copyRequest.targetTitle).toEqual('targetBranchTitle');
                                expect(this.copyRequest.sourceCommit).toEqual('sourceCommit');
                                expect(this.copyRequest.targetCommit).toEqual('targetCommit');
                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceCommit', 'targetCommit', 100, 0);
                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, '', 'sourceCommit', this.httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`);
                            });
                        tick();
                    }));
                    it('processDifferenceResponse rejects', fakeAsync(function() {
                        spyOn(service, 'processDifferenceResponse').and.returnValue(throwError(error));
                        service.setRequestDetails(this.copyRequest)
                            .subscribe(() => fail('Observable should have rejected'), response => {
                                expect(response).toEqual(error);
                                expect(this.copyRequest.sourceBranch).toEqual({'@id': ''});
                                expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                                expect(this.copyRequest.removeSource).toBeUndefined();
                                expect(this.copyRequest.comments).toEqual([[comment]]);
                                expect(this.copyRequest.sourceTitle).toEqual('sourceBranchTitle');
                                expect(this.copyRequest.targetTitle).toEqual('targetBranchTitle');
                                expect(this.copyRequest.sourceCommit).toEqual('sourceCommit');
                                expect(this.copyRequest.targetCommit).toEqual('targetCommit');
                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceCommit', 'targetCommit', 100, 0);
                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, '', 'sourceCommit', this.httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`);
                            });
                        tick();
                    }));
                });
                it('getDifference rejects', fakeAsync(function() {
                    spyOn(service, 'processDifferenceResponse');
                    catalogManagerStub.getDifference.and.returnValue(throwError(error));
                    service.setRequestDetails(this.copyRequest)
                        .subscribe(() => fail('Observable should have rejected'), response => {
                            expect(response).toEqual(error);
                            expect(this.copyRequest.sourceBranch).toEqual({'@id': ''});
                            expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                            expect(this.copyRequest.removeSource).toBeUndefined();
                            expect(this.copyRequest.comments).toEqual([[comment]]);
                            expect(this.copyRequest.sourceTitle).toEqual('sourceBranchTitle');
                            expect(this.copyRequest.targetTitle).toEqual('targetBranchTitle');
                            expect(this.copyRequest.sourceCommit).toEqual('sourceCommit');
                            expect(this.copyRequest.targetCommit).toEqual('targetCommit');
                            expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceCommit', 'targetCommit', 100, 0);
                            expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                        });
                    tick();
                }));
            });
            it('getComments rejects', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse');
                mergeRequestManagerStub.getComments.and.returnValue(throwError(error));
                service.setRequestDetails(this.copyRequest)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(this.copyRequest.sourceBranch).toEqual({'@id': ''});
                        expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                        expect(this.copyRequest.removeSource).toBeUndefined();
                        expect(this.copyRequest.comments).toEqual([]);
                        expect(this.copyRequest.sourceTitle).toEqual('sourceBranchTitle');
                        expect(this.copyRequest.targetTitle).toEqual('targetBranchTitle');
                        expect(this.copyRequest.sourceCommit).toEqual('sourceCommit');
                        expect(this.copyRequest.targetCommit).toEqual('targetCommit');
                        expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                        expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                        expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                    });
                tick();
            }));
        });
        describe('open', function() {
            beforeEach(function() {
                mergeRequestManagerStub.isAccepted.and.returnValue(false);
                this.copyRequest.jsonld[`${MERGEREQ}sourceBranch`] = [{ '@id': sourceBranch['@id'] }];
                spyOn(service, 'shouldRemoveSource').and.returnValue(false);
            });
            describe('getComments resolves and', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.getComments.and.returnValue(of([[comment]]));
                });
                describe('getRecordBranch resolves and', function() {
                    describe('there is a target branch', function() {
                        beforeEach(function() {
                            this.copyRequest.jsonld[`${MERGEREQ}targetBranch`] = [{ '@id': targetBranch['@id'] }];
                        });
                        describe('getRecordBranch resolves and', function() {
                            beforeEach(function() {
                                catalogManagerStub.getRecordBranch.and.callFake(iri => {
                                    if (iri === targetBranch['@id']) {
                                        return of(targetBranch);
                                    } else {
                                        return of(sourceBranch);
                                    }
                                });
                            });
                            describe('getDifference resolves and', function() {
                                beforeEach(function() {
                                    this.httpResponse = new HttpResponse<CommitDifference>({body: difference});
                                    catalogManagerStub.getDifference.and.returnValue(of(this.httpResponse));
                                });
                                describe('processDifferenceResponse resolves and', function() {
                                    beforeEach(function() {
                                        spyOn(service, 'processDifferenceResponse').and.returnValue(of(null));
                                    });
                                    it('getBranchConflicts resolves', fakeAsync(function() {
                                        const conflict: Conflict = {
                                            iri: '',
                                            left: new Difference(),
                                            right: new Difference(),
                                        };
                                        catalogManagerStub.getBranchConflicts.and.returnValue(of([conflict]));
                                        service.setRequestDetails(this.copyRequest)
                                            .subscribe(() => {
                                                expect(this.copyRequest.sourceBranch).toEqual(sourceBranch);
                                                expect(this.copyRequest.targetBranch).toEqual(targetBranch);
                                                expect(this.copyRequest.removeSource).toBeFalse();
                                                expect(this.copyRequest.comments).toEqual([[comment]]);
                                                expect(this.copyRequest.sourceTitle).toEqual('title');
                                                expect(this.copyRequest.targetTitle).toEqual('title');
                                                expect(this.copyRequest.sourceCommit).toEqual('sourceHead');
                                                expect(this.copyRequest.targetCommit).toEqual('targetHead');
                                                expect(this.copyRequest.conflicts).toEqual([conflict]);
                                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                                expect(service.shouldRemoveSource).toHaveBeenCalledWith(this.copyRequest.jsonld);
                                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', catalogManagerStub.differencePageSize, 0);
                                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', this.httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`);
                                                expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(sourceBranch['@id'], targetBranch['@id'], recordId, catalogId);
                                            }, () => fail('Observable should have resolved'));
                                        tick();
                                    }));
                                    it('getBranchConflicts rejects', fakeAsync(function() {
                                        catalogManagerStub.getBranchConflicts.and.returnValue(throwError(error));
                                        service.setRequestDetails(this.copyRequest)
                                            .subscribe(() => fail('Observable should have rejected'), response => {
                                                expect(response).toEqual(error);
                                                expect(this.copyRequest.sourceBranch).toEqual(sourceBranch);
                                                expect(this.copyRequest.targetBranch).toEqual(targetBranch);
                                                expect(this.copyRequest.removeSource).toBeFalse();
                                                expect(this.copyRequest.comments).toEqual([[comment]]);
                                                expect(this.copyRequest.sourceTitle).toEqual('title');
                                                expect(this.copyRequest.targetTitle).toEqual('title');
                                                expect(this.copyRequest.sourceCommit).toEqual('sourceHead');
                                                expect(this.copyRequest.targetCommit).toEqual('targetHead');
                                                expect(this.copyRequest.conflicts).toBeUndefined();
                                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                                expect(service.shouldRemoveSource).toHaveBeenCalledWith(this.copyRequest.jsonld);
                                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', catalogManagerStub.differencePageSize, 0);
                                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', this.httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`);
                                                expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(sourceBranch['@id'], targetBranch['@id'], recordId, catalogId);
                                            });
                                        tick();
                                    }));
                                });
                                it('processDifferenceResponse rejects', fakeAsync(function() {
                                    spyOn(service, 'processDifferenceResponse').and.returnValue(throwError(error));
                                    service.setRequestDetails(this.copyRequest)
                                        .subscribe(() => fail('Observable should have rejected'), response => {
                                            expect(response).toEqual(error);
                                            expect(this.copyRequest.sourceBranch).toEqual(sourceBranch);
                                            expect(this.copyRequest.targetBranch).toEqual(targetBranch);
                                            expect(this.copyRequest.removeSource).toBeFalse();
                                            expect(this.copyRequest.comments).toEqual([[comment]]);
                                            expect(this.copyRequest.sourceTitle).toEqual('title');
                                            expect(this.copyRequest.targetTitle).toEqual('title');
                                            expect(this.copyRequest.sourceCommit).toEqual('sourceHead');
                                            expect(this.copyRequest.targetCommit).toEqual('targetHead');
                                            expect(this.copyRequest.conflicts).toBeUndefined();
                                            expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                            expect(service.shouldRemoveSource).toHaveBeenCalledWith(this.copyRequest.jsonld);
                                            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', catalogManagerStub.differencePageSize, 0);
                                            expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', this.httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`);
                                            expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                                        });
                                    tick();
                                }));
                            });
                            it('getDifference rejects', fakeAsync(function() {
                                spyOn(service, 'processDifferenceResponse');
                                catalogManagerStub.getDifference.and.returnValue(throwError(error));
                                service.setRequestDetails(this.copyRequest)
                                    .subscribe(() => fail('Observable should have rejected'), response => {
                                        expect(response).toEqual(error);
                                        expect(this.copyRequest.sourceBranch).toEqual(sourceBranch);
                                        expect(this.copyRequest.targetBranch).toEqual(targetBranch);
                                        expect(this.copyRequest.removeSource).toBeFalse();
                                        expect(this.copyRequest.comments).toEqual([[comment]]);
                                        expect(this.copyRequest.sourceTitle).toEqual('title');
                                        expect(this.copyRequest.targetTitle).toEqual('title');
                                        expect(this.copyRequest.sourceCommit).toEqual('sourceHead');
                                        expect(this.copyRequest.targetCommit).toEqual('targetHead');
                                        expect(this.copyRequest.conflicts).toBeUndefined();
                                        expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                        expect(service.shouldRemoveSource).toHaveBeenCalledWith(this.copyRequest.jsonld);
                                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', catalogManagerStub.differencePageSize, 0);
                                        expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                                        expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                                    });
                                tick();
                            }));
                        });
                        it('getRecordBranch rejects', fakeAsync(function() {
                            spyOn(service, 'processDifferenceResponse');
                            catalogManagerStub.getRecordBranch.and.callFake(iri => {
                                if (iri === targetBranch['@id']) {
                                    return throwError(error);
                                } else {
                                    return of(sourceBranch);
                                }
                            });
                            service.setRequestDetails(this.copyRequest)
                                .subscribe(() => fail('Observable should have rejected'), response => {
                                    expect(response).toEqual(error);
                                    expect(this.copyRequest.sourceBranch).toEqual(sourceBranch);
                                    expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                                    expect(this.copyRequest.removeSource).toBeFalse();
                                    expect(this.copyRequest.comments).toEqual([[comment]]);
                                    expect(this.copyRequest.sourceTitle).toEqual('title');
                                    expect(this.copyRequest.targetTitle).toEqual('');
                                    expect(this.copyRequest.sourceCommit).toEqual('sourceHead');
                                    expect(this.copyRequest.targetCommit).toEqual('');
                                    expect(this.copyRequest.conflicts).toBeUndefined();
                                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                    expect(service.shouldRemoveSource).toHaveBeenCalledWith(this.copyRequest.jsonld);
                                    expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                                    expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                                    expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                                });
                            tick();
                        }));
                    });
                    it('there is no targetBranch', fakeAsync(function() {
                        spyOn(service, 'processDifferenceResponse');
                        catalogManagerStub.getRecordBranch.and.returnValue(of(sourceBranch));
                        service.setRequestDetails(this.copyRequest)
                            .subscribe(() => {
                                expect(this.copyRequest.sourceBranch).toEqual(sourceBranch);
                                expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                                expect(this.copyRequest.removeSource).toBeFalse();
                                expect(this.copyRequest.comments).toEqual([[comment]]);
                                expect(this.copyRequest.sourceTitle).toEqual('title');
                                expect(this.copyRequest.targetTitle).toEqual('');
                                expect(this.copyRequest.sourceCommit).toEqual('sourceHead');
                                expect(this.copyRequest.targetCommit).toEqual('');
                                expect(this.copyRequest.conflicts).toBeUndefined();
                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                expect(catalogManagerStub.getRecordBranch.calls.count()).toEqual(1);
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                expect(service.shouldRemoveSource).toHaveBeenCalledWith(this.copyRequest.jsonld);
                                expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                                expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                                expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                            }, () => fail('Observable should have resolved'));
                        tick();
                    }));
                });
                it('getRecordBranch rejects', fakeAsync(function() {
                    spyOn(service, 'processDifferenceResponse');
                    catalogManagerStub.getRecordBranch.and.returnValue(throwError(error));
                    service.setRequestDetails(this.copyRequest)
                        .subscribe(() => fail('Observable should have rejected'), response => {
                            expect(response).toEqual(error);
                            expect(this.copyRequest.sourceBranch).toEqual({'@id': ''});
                            expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                            expect(this.copyRequest.removeSource).toBeUndefined();
                            expect(this.copyRequest.comments).toEqual([[comment]]);
                            expect(this.copyRequest.sourceTitle).toEqual('');
                            expect(this.copyRequest.targetTitle).toEqual('');
                            expect(this.copyRequest.sourceCommit).toEqual('');
                            expect(this.copyRequest.targetCommit).toEqual('');
                            expect(this.copyRequest.conflicts).toBeUndefined();
                            expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                            expect(service.shouldRemoveSource).not.toHaveBeenCalled();
                            expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                            expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                            expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                        });
                    tick();
                }));
            });
            it('getComments rejects', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse');
                mergeRequestManagerStub.getComments.and.returnValue(throwError(error));
                service.setRequestDetails(this.copyRequest)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(this.copyRequest.sourceBranch).toEqual({'@id': ''});
                        expect(this.copyRequest.targetBranch).toEqual({'@id': ''});
                        expect(this.copyRequest.removeSource).toBeUndefined();
                        expect(this.copyRequest.comments).toEqual([]);
                        expect(this.copyRequest.sourceTitle).toEqual('');
                        expect(this.copyRequest.targetTitle).toEqual('');
                        expect(this.copyRequest.sourceCommit).toEqual('');
                        expect(this.copyRequest.targetCommit).toEqual('');
                        expect(this.copyRequest.conflicts).toBeUndefined();
                        expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                        expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                        expect(service.shouldRemoveSource).not.toHaveBeenCalled();
                        expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                        expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                        expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                    });
                tick();
            }));
        });
    });
    describe('should resolve the conflicts on a request', function() {
        beforeEach(function() {
            service.catalogId = catalogId;
            spyOn(service, 'setRequestDetails').and.returnValue(of(null));
            this.requestObj = Object.assign({}, requestObj);
            this.requestObj.targetBranch = targetBranch;
            this.requestObj.sourceBranch = sourceBranch;
        });
        it('if mergeBranches resolves', fakeAsync(function() {
            catalogManagerStub.mergeBranches.and.returnValue(of(null));
            const difference = new Difference();
            service.resolveRequestConflicts(this.requestObj, difference)
                .subscribe(() => {
                    expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith(targetBranch['@id'], sourceBranch['@id'], recordId, catalogId, difference);
                    expect(service.setRequestDetails).toHaveBeenCalledWith(this.requestObj);
                }, () => fail('Observable should have resolved'));
            tick();
        }));
        it('unless mergeBranches rejects', fakeAsync(function() {
            const difference = new Difference();
            catalogManagerStub.mergeBranches.and.returnValue(throwError(error));
            service.resolveRequestConflicts(this.requestObj, difference)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(error);
                    expect(catalogManagerStub.mergeBranches).toHaveBeenCalledWith(targetBranch['@id'], sourceBranch['@id'], recordId, catalogId, difference);
                    expect(service.setRequestDetails).not.toHaveBeenCalled();
                });
            tick();
        }));
    });
    it('should check whether the source should be removed on a Merge Request', function() {
        expect(service.shouldRemoveSource(request)).toBeFalse();
        const copyRequest = Object.assign({}, request);
        copyRequest[`${MERGEREQ}removeSource`] = [{ '@value': 'true' }];
        expect(service.shouldRemoveSource(copyRequest)).toBeTrue();
        copyRequest[`${MERGEREQ}removeSource`] = [{ '@value': 'false' }];
        expect(service.shouldRemoveSource(copyRequest)).toBeFalse();
    });
    describe('should delete a request', function() {
        beforeEach(function() {
            service.selected = requestObj;
            spyOn(service, 'setRequests');
        });
        it('unless an error occurs', fakeAsync(function() {
            mergeRequestManagerStub.deleteRequest.and.returnValue(throwError(error));
            service.deleteRequest(requestObj).subscribe(() => fail('Observable should have failed'), result => {
              expect(result).toEqual(error);
            });
            tick();
            expect(mergeRequestManagerStub.deleteRequest).toHaveBeenCalledWith(requestId);
            expect(service.selected).toEqual(requestObj);
            expect(toastStub.createSuccessToast).not.toHaveBeenCalled();
        }));
        it('successfully', fakeAsync(function() {
            mergeRequestManagerStub.deleteRequest.and.returnValue(of(null));
            service.deleteRequest(requestObj).subscribe(() => {}, () => fail('Observable should have succeeded'));
            tick();
            expect(mergeRequestManagerStub.deleteRequest).toHaveBeenCalledWith(requestId);
            expect(service.selected).toBeUndefined();
            expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        }));
        it('successfully and filters are cleared', fakeAsync(function() {
            mergeRequestManagerStub.deleteRequest.and.returnValue(of(null));
            service.creators = [creatorId, 'other'];
            service.assignees = [assigneeId, 'other'];
            service.deleteRequest(requestObj).subscribe(() => {}, () => fail('Observable should have succeeded'));
            tick();
            expect(mergeRequestManagerStub.deleteRequest).toHaveBeenCalledWith(requestId);
            expect(service.selected).toBeUndefined();
            expect(service.creators).toEqual(['other']);
            expect(service.assignees).toEqual(['other']);
            expect(toastStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
        }));
    });
    it('should get the MergeRequest object from a JSON-LD object', function() {
        userManagerStub.users = [
            {
                username: 'creatorU',
                iri: 'newcreator',
                firstName: '',
                lastName: '',
                external: false,
                roles: [],
                email: ''
            },
            {
                username: 'assigneeU',
                iri: 'newassignee',
                firstName: '',
                lastName: '',
                external: false,
                roles: [],
                email: ''
            }
        ];
        const jsonld = Object.assign({}, request);
        jsonld[`${DCTERMS}title`] = [{ '@value': 'title' }];
        jsonld[`${DCTERMS}description`] = [{ '@value': 'description' }];
        jsonld[`${DCTERMS}issued`] = [{ '@value': DATE_STR }];
        jsonld[`${DCTERMS}creator`] = [{ '@id': 'newcreator' }];
        jsonld[`${MERGEREQ}onRecord`] = [{ '@id': recordId }];
        jsonld[`${MERGEREQ}assignee`] = [{'@id': 'newassignee'}];
        expect(service.getRequestObj(jsonld)).toEqual({
            jsonld,
            title: 'title',
            description: 'description',
            date: SHORTDATE_DATE_STR,
            creator: 'creatorU',
            recordIri: recordId,
            assignees: ['assigneeU']
        });
        expect(service.getRequestObj(request)).toEqual({
            jsonld: request,
            title: '',
            description: 'No description',
            date: '(No Date Specified)',
            creator: undefined,
            recordIri: '',
            assignees: []
        });
    });
    describe('should process a response from getDifference', function() {
        it('unless one is not provided', fakeAsync(function() {
            spyOn(service, 'setDifference');
            service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', undefined, `${ONTOLOGYEDITOR}OntologyRecord`)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(jasmine.stringContaining('Difference is not set'));
                    expect(ontologyManagerStub.getOntologyEntityNames).not.toHaveBeenCalled();
                    expect(service.entityNames).toEqual({});
                    expect(service.setDifference).not.toHaveBeenCalled();
                });
            tick();
        }));
        describe('if there is data in the returned difference', function() {
            beforeEach(function() {
                const difference = new CommitDifference();
                this.addObj = {'@id': 'add'};
                this.delObj = {'@id': 'del'};
                difference.additions = [this.addObj];
                difference.deletions = [this.delObj];
                this.httpResponse = new HttpResponse<CommitDifference>({body: difference});
            });
            it('unless getOntologyEntityNames rejects', fakeAsync(function() {
                spyOn(service, 'setDifference');
                ontologyManagerStub.getOntologyEntityNames.and.returnValue(throwError(error));
                service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', this.httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(ontologyManagerStub.getOntologyEntityNames).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'commitId', false, false, [this.addObj['@id'], this.delObj['@id']]);
                        expect(service.entityNames).toEqual({});
                        expect(service.setDifference).toHaveBeenCalledWith(this.httpResponse);
                    });
                tick();
            }));
            it('and getOntologyEntityNames resolves', fakeAsync(function() {
                spyOn(service, 'setDifference');
                const newNames = {
                    [this.addObj['@id']]: {
                        label: 'add',
                        names: []
                    },
                    [this.delObj['@id']]: {
                        label: 'del',
                        names: []
                    },
                };
                ontologyManagerStub.getOntologyEntityNames.and.returnValue(of(newNames));
                service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', this.httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`)
                    .subscribe(() => {
                        expect(ontologyManagerStub.getOntologyEntityNames).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'commitId', false, false, [this.addObj['@id'], this.delObj['@id']]);
                        expect(service.entityNames).toEqual(newNames);
                        expect(service.setDifference).toHaveBeenCalledWith(this.httpResponse);
                    }, () => fail('Observable should have resolved'));
                tick();
            }));
        });
        it('unless the difference is empty', fakeAsync(function() {
            spyOn(service, 'setDifference');
            const httpResponse = new HttpResponse<CommitDifference>({body: new CommitDifference()});
            service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', httpResponse, `${ONTOLOGYEDITOR}OntologyRecord`)
                .subscribe(() => {
                    expect(ontologyManagerStub.getOntologyEntityNames).not.toHaveBeenCalled();
                    expect(service.entityNames).toEqual({});
                    expect(service.setDifference).not.toHaveBeenCalled();
                }, () => fail('Observable should have resolved'));
            tick();
        }));
    });
    describe('should set the stored difference based on a HTTP Response', function() {
        it('if a difference is already set and there is no more data to fetch', function() {
            service.difference = new CommitDifference();
            service.difference.additions = [{'@id': 'savedAdd'}];
            service.difference.deletions = [{'@id': 'savedDel'}];
            const httpResponse = new HttpResponse<CommitDifference>({body: difference});
            service.setDifference(httpResponse);
            expect(service.difference).toBeDefined();
            expect(service.difference.additions).toEqual([{'@id': 'savedAdd'}].concat(difference.additions as JSONLDObject[]));
            expect(service.difference.deletions).toEqual([{'@id': 'savedDel'}].concat(difference.deletions as JSONLDObject[]));
            expect(service.difference.hasMoreResults).toBeFalse();
        });
        it('if a difference has not been set and there is more data to fetch', function() {
            const httpResponse = new HttpResponse<CommitDifference>({body: difference, headers: new HttpHeaders({'has-more-results': 'true'})});
            service.setDifference(httpResponse);
            expect(service.difference).toBeDefined();
            expect(service.difference.additions).toEqual(difference.additions);
            expect(service.difference.deletions).toEqual(difference.deletions);
            expect(service.difference.hasMoreResults).toBeTrue();
        });
    });
    describe('should retrieve the label of an entityName', function() {
        beforeEach(function() {
            service.entityNames = { 'iri1': { 'label': 'label1', names: [] } };
        });
        it('exists in entityNames', function() {
            expect(service.getEntityNameLabel('iri1')).toEqual('label1');
        }) ;
        it('does not exist in entityNames', function() {
            expect(service.getEntityNameLabel('iri2')).toEqual('Iri 2');
        });
    });
    describe('should update the requestConfig difference', function() {
        beforeEach(function() {
            service.requestConfig = {
                targetBranchId: targetBranch['@id'],
                targetBranch,
                sourceBranchId: sourceBranch['@id'],
                sourceBranch,
                title: 'title',
                recordId,
                removeSource: false
            };
            catalogManagerStub.differencePageSize = 100;
            spyOn(service, 'clearDifference');
        });
        describe('when getDifference resolves', function() {
            it('unless processDifferenceResponse rejects', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse').and.returnValue(throwError(error));
                catalogManagerStub.getType.and.returnValue(`${ONTOLOGYEDITOR}OntologyRecord`);
                service.updateRequestConfigDifference()
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(service.clearDifference).toHaveBeenCalledWith();
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', 100, 0);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse), `${ONTOLOGYEDITOR}OntologyRecord`);
                    });
                tick();
            }));
            it('and processDifferenceResponse resolves', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse').and.returnValue(of(null));
                catalogManagerStub.getType.and.returnValue(`${ONTOLOGYEDITOR}OntologyRecord`);
                service.updateRequestConfigDifference()
                    .subscribe(() => {
                        expect(service.clearDifference).toHaveBeenCalledWith();
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', 100, 0);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse), `${ONTOLOGYEDITOR}OntologyRecord`);
                    }, () => fail('Observable should have resolved'));
                tick();
            }));
        });
        it('unless getDifference rejects', fakeAsync(function() {
            catalogManagerStub.getDifference.and.returnValue(throwError(error));
            spyOn(service, 'processDifferenceResponse').and.returnValue(of(null));
                service.updateRequestConfigDifference()
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(service.clearDifference).toHaveBeenCalledWith();
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', 100, 0);
                        expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                    });
                tick();
        }));
    });
    describe('should update the requestConfig branch information when', function() {
        beforeEach(function () {
            service.requestConfig = {
                title: '',
                targetBranchId: '',
                sourceBranchId: '',
                recordId,
                removeSource: false
            };
        });
        it('unless the branch type is invalid', function() {
            const original = Object.assign({}, service.requestConfig);
            service.updateRequestConfigBranch('test', []);
            expect(service.requestConfig).toEqual(original);
        });
        it('unless the branch is not set', function() {
            const original = Object.assign({}, service.requestConfig);
            service.updateRequestConfigBranch('sourceBranch', []);
            expect(service.requestConfig).toEqual(original);
        });
        it('if the branch does not exist in the provided list', function() {
            service.requestConfig.sourceBranch = sourceBranch;
            service.updateRequestConfigBranch('sourceBranch', []);
            expect(service.requestConfig.sourceBranch).toBeUndefined();
        });
        it('if the branch exists in the provided list', function() {
            service.requestConfig.sourceBranch = {'@id': sourceBranch['@id'], test: [{'@value': 'test'}]};
            service.updateRequestConfigBranch('sourceBranch', [sourceBranch]);
            expect(service.requestConfig.sourceBranch).toEqual(sourceBranch);
        });
    });
    describe('should retrieve more difference results', function() {
        const paginationDetails = { limit: 100, offset: 10 };
        describe('when getDifference resolves', function() {
            it('unless processDifferenceResponse rejects', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse').and.returnValue(throwError(error));
                service.selected = Object.assign({}, requestObj);
                service.selected.sourceBranch = sourceBranch;
                service.retrieveMoreResults(paginationDetails);
                tick();
                expect(service.startIndex).toEqual(paginationDetails.offset);
                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', undefined, paginationDetails.limit, paginationDetails.offset);
                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse), `${ONTOLOGYEDITOR}OntologyRecord`);
                expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
            }));
            describe('and processDifferenceResponse resolves', function() {
                beforeEach(function() {
                    spyOn(service, 'processDifferenceResponse').and.returnValue(of(null));
                });
                describe('and a request is selected', function() {
                    beforeEach(function() {
                        service.selected = Object.assign({}, requestObj);
                    });
                    it('without a source or target branch set', fakeAsync(function() {
                        service.selected.sourceBranch = {'@id': ''};
                        service.selected.targetBranch = {'@id': ''};
                        service.selected.sourceCommit = 'sourceCommit';
                        service.selected.targetCommit = 'targetCommit';
                        service.retrieveMoreResults(paginationDetails);
                        tick();
                        expect(service.startIndex).toEqual(paginationDetails.offset);
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceCommit', 'targetCommit', paginationDetails.limit, paginationDetails.offset);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, '', 'sourceCommit', jasmine.any(HttpResponse), `${ONTOLOGYEDITOR}OntologyRecord`);
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                    it('with a source and target branch set', fakeAsync(function() {
                        service.selected.sourceBranch = sourceBranch;
                        service.selected.targetBranch = targetBranch;
                        service.retrieveMoreResults(paginationDetails);
                        tick();
                        expect(service.startIndex).toEqual(paginationDetails.offset);
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', paginationDetails.limit, paginationDetails.offset);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse), `${ONTOLOGYEDITOR}OntologyRecord`);
                        expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                });
                it('and a request is being created', fakeAsync(function() {
                    catalogManagerStub.getType.and.returnValue(`${ONTOLOGYEDITOR}OntologyRecord`);
                    service.requestConfig = {
                        sourceBranchId: sourceBranch['@id'],
                        sourceBranch,
                        targetBranchId: targetBranch['@id'],
                        targetBranch,
                        title: '',
                        recordId,
                        removeSource: false
                    };
                    service.retrieveMoreResults(paginationDetails);
                    tick();
                    expect(service.startIndex).toEqual(paginationDetails.offset);
                    expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', paginationDetails.limit, paginationDetails.offset);
                    expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse), `${ONTOLOGYEDITOR}OntologyRecord`);
                    expect(toastStub.createErrorToast).not.toHaveBeenCalled();
                }));
            });
        });
        it('unless getDifference rejects', fakeAsync(function() {
            spyOn(service, 'processDifferenceResponse');
            catalogManagerStub.getDifference.and.returnValue(throwError(error));
            service.selected = requestObj;
            service.retrieveMoreResults(paginationDetails);
            tick();
            expect(service.startIndex).toEqual(paginationDetails.offset);
            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(undefined, undefined, paginationDetails.limit, paginationDetails.offset);
            expect(service.processDifferenceResponse).not.toHaveBeenCalled();
            expect(toastStub.createErrorToast).toHaveBeenCalledWith(error);
        }));
        it('unless a request is not selected and one is not being created', function() {
            spyOn(service, 'processDifferenceResponse');
            service.retrieveMoreResults(paginationDetails);
            expect(toastStub.createErrorToast).toHaveBeenCalledWith('Could not load more results.');
            expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
            expect(service.processDifferenceResponse).not.toHaveBeenCalled();
        });
    });
});
