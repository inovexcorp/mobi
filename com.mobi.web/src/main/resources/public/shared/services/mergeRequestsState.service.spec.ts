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
import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { configureTestSuite } from 'ng-bullet';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';

import {
    cleanStylesFromDOM,
} from '../../../../../test/ts/Shared';
import { CATALOG, MERGEREQ, ONTOLOGYEDITOR, OWL } from '../../prefixes';
import { CommitDifference } from '../models/commitDifference.interface';
import { Difference } from '../models/difference.class';
import { Conflict } from '../models/conflict.interface';
import { JSONLDObject } from '../models/JSONLDObject.interface';
import { MergeRequest } from '../models/mergeRequest.interface';
import { CatalogManagerService } from './catalogManager.service';
import { MergeRequestManagerService } from './mergeRequestManager.service';
import { UserManagerService } from './userManager.service';
import { OntologyManagerService } from './ontologyManager.service';
import { UtilService } from './util.service';
import { MergeRequestsStateService } from './mergeRequestsState.service';

describe('Merge Requests State service', function() {
    let service: MergeRequestsStateService;
    let mergeRequestManagerStub: jasmine.SpyObj<MergeRequestManagerService>;
    let catalogManagerStub: jasmine.SpyObj<CatalogManagerService>;
    let userManagerStub: jasmine.SpyObj<UserManagerService>;
    let ontologyManagerStub: jasmine.SpyObj<OntologyManagerService>;
    let utilStub: jasmine.SpyObj<UtilService>;

    const error = 'Error Message';
    const catalogId = 'catalogId';
    const requestId = 'requestId';
    const recordId = 'recordId';
    const request: JSONLDObject = { '@id': requestId };
    const sourceBranch: JSONLDObject = {'@id': 'source'};
    const targetBranch: JSONLDObject = {'@id': 'target'};
    const comment: JSONLDObject = {'@id': 'comment'};
    const record: JSONLDObject = {
        '@id': recordId,
        '@type': [
            OWL + 'Thing',
            CATALOG + 'Record',
            CATALOG + 'VersionedRecord',
            CATALOG + 'VersionedRDFRecord',
            ONTOLOGYEDITOR + 'OntologyRecord'
        ]
    };
    const requestObj: MergeRequest = {
        title: 'title',
        date: 'date',
        creator: 'creator',
        recordIri: recordId,
        assignees: [],
        jsonld: request
    };

    let difference: CommitDifference;

    configureTestSuite(function() {
        TestBed.configureTestingModule({
            providers: [
                MergeRequestsStateService,
                MockProvider(MergeRequestManagerService),
                MockProvider(CatalogManagerService),
                MockProvider(UserManagerService),
                MockProvider(OntologyManagerService),
                MockProvider(UtilService),
            ]
        });
    });

    beforeEach(function() {
        service = TestBed.get(MergeRequestsStateService);
        mergeRequestManagerStub = TestBed.get(MergeRequestManagerService);
        catalogManagerStub = TestBed.get(CatalogManagerService);
        userManagerStub = TestBed.get(UserManagerService);
        ontologyManagerStub = TestBed.get(OntologyManagerService);
        utilStub = TestBed.get(UtilService);

        difference = new CommitDifference();
        difference.additions = [{'@id': 'iri1'}];
        difference.deletions = [{'@id': 'iri2'}];
        catalogManagerStub.localCatalog = {'@id': catalogId};
        catalogManagerStub.differencePageSize = 100;
        this.headers = {'has-more-results': 'false'};
        catalogManagerStub.getDifference.and.returnValue(of(new HttpResponse<CommitDifference>({body: difference, headers: new HttpHeaders(this.headers)})));
        service.initialize();
    });

    afterEach(function() {
        cleanStylesFromDOM();
        service = null;
        mergeRequestManagerStub = null;
        catalogManagerStub = null;
        ontologyManagerStub = null;
        userManagerStub = null;
        utilStub = null;
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
        expect(service.sameBranch).toBeFalse();
        expect(service.clearDifference).toHaveBeenCalledWith();
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
            utilStub.getDctermsValue.and.callFake((entity, propId) => propId);
        });
        describe('provided and getRequests', function() {
            describe('resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.getRequests.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [request]})));
                });
                describe('and getRecord ', function() {
                    it('resolves', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(of([record]));
                        service.setRequests(true);
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({accepted: true});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(record, 'title');
                        expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                        expect(this.requestObj.recordTitle).toEqual('title');
                        expect(this.requestObj.recordType).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
                        expect(service.requests).toEqual([this.requestObj]);
                    }));
                    it('rejects', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(throwError(error));
                        service.setRequests(true);
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({accepted: true});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                        expect(service.requests).toEqual([]);
                    }));
                });
            });
            it('rejects', fakeAsync(function() {
                mergeRequestManagerStub.getRequests.and.returnValue(throwError(error));
                service.setRequests(true);
                tick();
                expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({accepted: true});
                expect(service.getRequestObj).not.toHaveBeenCalled();
                expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
                expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                expect(service.requests).toEqual([]);
            }));
        });
        describe('not provided and getRequests', function() {
            describe('resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.getRequests.and.returnValue(of(new HttpResponse<JSONLDObject[]>({body: [request]})));
                });
                describe('and getRecord ', function() {
                    it('resolves', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(of([record]));
                        service.setRequests();
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({accepted: false});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(record, 'title');
                        expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                        expect(this.requestObj.recordTitle).toEqual('title');
                        expect(this.requestObj.recordType).toEqual(ONTOLOGYEDITOR + 'OntologyRecord');
                        expect(service.requests).toEqual([this.requestObj]);
                    }));
                    it('rejects', fakeAsync(function() {
                        catalogManagerStub.getRecord.and.returnValue(throwError(error));
                        service.setRequests();
                        tick();
                        expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({accepted: false});
                        expect(service.getRequestObj).toHaveBeenCalledWith(request);
                        expect(catalogManagerStub.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerStub.getRecord).toHaveBeenCalledWith(recordId, catalogId);
                        expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
                        expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                        expect(service.requests).toEqual([]);
                    }));
                });
            });
            it('rejects', fakeAsync(function() {
                mergeRequestManagerStub.getRequests.and.returnValue(throwError(error));
                service.setRequests();
                tick();
                expect(mergeRequestManagerStub.getRequests).toHaveBeenCalledWith({accepted: false});
                expect(service.getRequestObj).not.toHaveBeenCalled();
                expect(catalogManagerStub.getRecord).not.toHaveBeenCalled();
                expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
                expect(service.requests).toEqual([]);
            }));
        });
    });
    describe('should set metadata on a merge request if it is', function() {
        beforeEach(function() {
            service.catalogId = catalogId;
            utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
            utilStub.getPropertyId.and.callFake((obj, prop) => prop);
            utilStub.getPropertyValue.and.callFake((obj, prop) => prop);
        });
        describe('accepted and', function() {
            beforeEach(function() {
                mergeRequestManagerStub.isAccepted.and.returnValue(true);
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
                        const copyRequest = Object.assign({}, requestObj);
                        service.setRequestDetails(copyRequest)
                            .subscribe(() => {
                                expect(copyRequest.sourceBranch).toEqual({'@id': ''});
                                expect(copyRequest.targetBranch).toEqual({'@id': ''});
                                expect(copyRequest.removeSource).toBeUndefined();
                                expect(copyRequest.comments).toEqual([[comment]]);
                                expect(copyRequest.sourceTitle).toEqual(MERGEREQ + 'sourceBranchTitle');
                                expect(copyRequest.targetTitle).toEqual(MERGEREQ + 'targetBranchTitle');
                                expect(copyRequest.sourceCommit).toEqual(MERGEREQ + 'sourceCommit');
                                expect(copyRequest.targetCommit).toEqual(MERGEREQ + 'targetCommit');
                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(MERGEREQ + 'sourceCommit', MERGEREQ + 'targetCommit', 100, 0);
                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, '', MERGEREQ + 'sourceCommit', this.httpResponse);
                            });
                        tick();
                    }));
                    it('processDifferenceResponse rejects', fakeAsync(function() {
                        spyOn(service, 'processDifferenceResponse').and.returnValue(throwError(error));
                        const copyRequest = Object.assign({}, requestObj);
                        service.setRequestDetails(copyRequest)
                            .subscribe(() => fail('Observable should have rejected'), response => {
                                expect(response).toEqual(error);
                                expect(copyRequest.sourceBranch).toEqual({'@id': ''});
                                expect(copyRequest.targetBranch).toEqual({'@id': ''});
                                expect(copyRequest.removeSource).toBeUndefined();
                                expect(copyRequest.comments).toEqual([[comment]]);
                                expect(copyRequest.sourceTitle).toEqual(MERGEREQ + 'sourceBranchTitle');
                                expect(copyRequest.targetTitle).toEqual(MERGEREQ + 'targetBranchTitle');
                                expect(copyRequest.sourceCommit).toEqual(MERGEREQ + 'sourceCommit');
                                expect(copyRequest.targetCommit).toEqual(MERGEREQ + 'targetCommit');
                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(MERGEREQ + 'sourceCommit', MERGEREQ + 'targetCommit', 100, 0);
                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, '', MERGEREQ + 'sourceCommit', this.httpResponse);
                            });
                        tick();
                    }));
                });
                it('getDifference rejects', fakeAsync(function() {
                    spyOn(service, 'processDifferenceResponse');
                    catalogManagerStub.getDifference.and.returnValue(throwError(error));
                    const copyRequest = Object.assign({}, requestObj);
                    service.setRequestDetails(copyRequest)
                        .subscribe(() => fail('Observable should have rejected'), response => {
                            expect(response).toEqual(error);
                            expect(copyRequest.sourceBranch).toEqual({'@id': ''});
                            expect(copyRequest.targetBranch).toEqual({'@id': ''});
                            expect(copyRequest.removeSource).toBeUndefined();
                            expect(copyRequest.comments).toEqual([[comment]]);
                            expect(copyRequest.sourceTitle).toEqual(MERGEREQ + 'sourceBranchTitle');
                            expect(copyRequest.targetTitle).toEqual(MERGEREQ + 'targetBranchTitle');
                            expect(copyRequest.sourceCommit).toEqual(MERGEREQ + 'sourceCommit');
                            expect(copyRequest.targetCommit).toEqual(MERGEREQ + 'targetCommit');
                            expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(MERGEREQ + 'sourceCommit', MERGEREQ + 'targetCommit', 100, 0);
                            expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                        });
                    tick();
                }));
            });
            it('getComments rejects', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse');
                mergeRequestManagerStub.getComments.and.returnValue(throwError(error));
                const copyRequest = Object.assign({}, requestObj);
                service.setRequestDetails(copyRequest)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(copyRequest.sourceBranch).toEqual({'@id': ''});
                        expect(copyRequest.targetBranch).toEqual({'@id': ''});
                        expect(copyRequest.removeSource).toBeUndefined();
                        expect(copyRequest.comments).toEqual([]);
                        expect(copyRequest.sourceTitle).toEqual(MERGEREQ + 'sourceBranchTitle');
                        expect(copyRequest.targetTitle).toEqual(MERGEREQ + 'targetBranchTitle');
                        expect(copyRequest.sourceCommit).toEqual(MERGEREQ + 'sourceCommit');
                        expect(copyRequest.targetCommit).toEqual(MERGEREQ + 'targetCommit');
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
                utilStub.getPropertyId.and.callFake((obj, prop) => {
                    if (prop === MERGEREQ + 'sourceBranch') {
                        return sourceBranch['@id'];
                    } else {
                        return prop;
                    }
                });
                spyOn(service, 'shouldRemoveSource').and.returnValue(false);
            });
            describe('getComments resolves and', function() {
                beforeEach(function() {
                    mergeRequestManagerStub.getComments.and.returnValue(of([[comment]]));
                });
                describe('getRecordBranch resolves and', function() {
                    describe('there is a target branch', function() {
                        beforeEach(function() {
                            utilStub.getPropertyId.and.callFake((obj, prop) => {
                                if (prop === MERGEREQ + 'targetBranch') {
                                    return targetBranch['@id'];
                                } else if (prop === MERGEREQ + 'sourceBranch') {
                                    return sourceBranch['@id'];
                                } else {
                                    return prop;
                                }
                            });
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
                                        const copyRequest = Object.assign({}, requestObj);
                                        service.setRequestDetails(copyRequest)
                                            .subscribe(() => {
                                                expect(copyRequest.sourceBranch).toEqual(sourceBranch);
                                                expect(copyRequest.targetBranch).toEqual(targetBranch);
                                                expect(copyRequest.removeSource).toBeFalse();
                                                expect(copyRequest.comments).toEqual([[comment]]);
                                                expect(copyRequest.sourceTitle).toEqual('title');
                                                expect(copyRequest.targetTitle).toEqual('title');
                                                expect(copyRequest.sourceCommit).toEqual(CATALOG + 'head');
                                                expect(copyRequest.targetCommit).toEqual(CATALOG + 'head');
                                                expect(copyRequest.conflicts).toEqual([conflict]);
                                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'sourceBranch');
                                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'targetBranch');
                                                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(sourceBranch, 'title');
                                                expect(service.shouldRemoveSource).toHaveBeenCalledWith(request);
                                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(CATALOG + 'head', CATALOG + 'head', catalogManagerStub.differencePageSize, 0);
                                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], CATALOG + 'head', this.httpResponse);
                                                expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(sourceBranch['@id'], targetBranch['@id'], recordId, catalogId);
                                            }, () => fail('Observable should have resolved'));
                                        tick();
                                    }));
                                    it('getBranchConflicts rejects', fakeAsync(function() {
                                        catalogManagerStub.getBranchConflicts.and.returnValue(throwError(error));
                                        const copyRequest = Object.assign({}, requestObj);
                                        service.setRequestDetails(copyRequest)
                                            .subscribe(() => fail('Observable should have rejected'), response => {
                                                expect(response).toEqual(error);
                                                expect(copyRequest.sourceBranch).toEqual(sourceBranch);
                                                expect(copyRequest.targetBranch).toEqual(targetBranch);
                                                expect(copyRequest.removeSource).toBeFalse();
                                                expect(copyRequest.comments).toEqual([[comment]]);
                                                expect(copyRequest.sourceTitle).toEqual('title');
                                                expect(copyRequest.targetTitle).toEqual('title');
                                                expect(copyRequest.sourceCommit).toEqual(CATALOG + 'head');
                                                expect(copyRequest.targetCommit).toEqual(CATALOG + 'head');
                                                expect(copyRequest.conflicts).toBeUndefined();
                                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'sourceBranch');
                                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'targetBranch');
                                                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(sourceBranch, 'title');
                                                expect(service.shouldRemoveSource).toHaveBeenCalledWith(request);
                                                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(CATALOG + 'head', CATALOG + 'head', catalogManagerStub.differencePageSize, 0);
                                                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], CATALOG + 'head', this.httpResponse);
                                                expect(catalogManagerStub.getBranchConflicts).toHaveBeenCalledWith(sourceBranch['@id'], targetBranch['@id'], recordId, catalogId);
                                            });
                                        tick();
                                    }));
                                });
                                it('processDifferenceResponse rejects', fakeAsync(function() {
                                    spyOn(service, 'processDifferenceResponse').and.returnValue(throwError(error));
                                    const copyRequest = Object.assign({}, requestObj);
                                    service.setRequestDetails(copyRequest)
                                        .subscribe(() => fail('Observable should have rejected'), response => {
                                            expect(response).toEqual(error);
                                            expect(copyRequest.sourceBranch).toEqual(sourceBranch);
                                            expect(copyRequest.targetBranch).toEqual(targetBranch);
                                            expect(copyRequest.removeSource).toBeFalse();
                                            expect(copyRequest.comments).toEqual([[comment]]);
                                            expect(copyRequest.sourceTitle).toEqual('title');
                                            expect(copyRequest.targetTitle).toEqual('title');
                                            expect(copyRequest.sourceCommit).toEqual(CATALOG + 'head');
                                            expect(copyRequest.targetCommit).toEqual(CATALOG + 'head');
                                            expect(copyRequest.conflicts).toBeUndefined();
                                            expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                            expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'sourceBranch');
                                            expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                                            expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'targetBranch');
                                            expect(utilStub.getDctermsValue).toHaveBeenCalledWith(sourceBranch, 'title');
                                            expect(service.shouldRemoveSource).toHaveBeenCalledWith(request);
                                            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(CATALOG + 'head', CATALOG + 'head', catalogManagerStub.differencePageSize, 0);
                                            expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], CATALOG + 'head', this.httpResponse);
                                            expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                                        });
                                    tick();
                                }));
                            });
                            it('getDifference rejects', fakeAsync(function() {
                                spyOn(service, 'processDifferenceResponse');
                                catalogManagerStub.getDifference.and.returnValue(throwError(error));
                                const copyRequest = Object.assign({}, requestObj);
                                service.setRequestDetails(copyRequest)
                                    .subscribe(() => fail('Observable should have rejected'), response => {
                                        expect(response).toEqual(error);
                                        expect(copyRequest.sourceBranch).toEqual(sourceBranch);
                                        expect(copyRequest.targetBranch).toEqual(targetBranch);
                                        expect(copyRequest.removeSource).toBeFalse();
                                        expect(copyRequest.comments).toEqual([[comment]]);
                                        expect(copyRequest.sourceTitle).toEqual('title');
                                        expect(copyRequest.targetTitle).toEqual('title');
                                        expect(copyRequest.sourceCommit).toEqual(CATALOG + 'head');
                                        expect(copyRequest.targetCommit).toEqual(CATALOG + 'head');
                                            expect(copyRequest.conflicts).toBeUndefined();
                                            expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                        expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                        expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'sourceBranch');
                                        expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                                        expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'targetBranch');
                                        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(sourceBranch, 'title');
                                        expect(service.shouldRemoveSource).toHaveBeenCalledWith(request);
                                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(CATALOG + 'head', CATALOG + 'head', catalogManagerStub.differencePageSize, 0);
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
                            const copyRequest = Object.assign({}, requestObj);
                            service.setRequestDetails(copyRequest)
                                .subscribe(() => fail('Observable should have rejected'), response => {
                                    expect(response).toEqual(error);
                                    expect(copyRequest.sourceBranch).toEqual(sourceBranch);
                                    expect(copyRequest.targetBranch).toEqual({'@id': ''});
                                    expect(copyRequest.removeSource).toBeFalse();
                                    expect(copyRequest.comments).toEqual([[comment]]);
                                    expect(copyRequest.sourceTitle).toEqual('title');
                                    expect(copyRequest.targetTitle).toEqual('');
                                    expect(copyRequest.sourceCommit).toEqual(CATALOG + 'head');
                                    expect(copyRequest.targetCommit).toEqual('');
                                    expect(copyRequest.conflicts).toBeUndefined();
                                    expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                    expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(targetBranch['@id'], recordId, catalogId);
                                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'sourceBranch');
                                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'targetBranch');
                                    expect(utilStub.getDctermsValue).toHaveBeenCalledWith(sourceBranch, 'title');
                                    expect(service.shouldRemoveSource).toHaveBeenCalledWith(request);
                                    expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
                                    expect(service.processDifferenceResponse).not.toHaveBeenCalled();
                                    expect(catalogManagerStub.getBranchConflicts).not.toHaveBeenCalled();
                                });
                            tick();
                        }));
                    });
                    it('there is no targetBranch', fakeAsync(function() {
                        spyOn(service, 'processDifferenceResponse');
                        utilStub.getPropertyId.and.callFake((obj, prop) => {
                            if (prop === MERGEREQ + 'targetBranch') {
                                return '';
                            } else if (prop === MERGEREQ + 'sourceBranch') {
                                return sourceBranch['@id'];
                            } else {
                                return prop;
                            }
                        });
                        catalogManagerStub.getRecordBranch.and.returnValue(of(sourceBranch));
                        const copyRequest = Object.assign({}, requestObj);
                        service.setRequestDetails(copyRequest)
                            .subscribe(() => {
                                expect(copyRequest.sourceBranch).toEqual(sourceBranch);
                                expect(copyRequest.targetBranch).toEqual({'@id': ''});
                                expect(copyRequest.removeSource).toBeFalse();
                                expect(copyRequest.comments).toEqual([[comment]]);
                                expect(copyRequest.sourceTitle).toEqual('title');
                                expect(copyRequest.targetTitle).toEqual('');
                                expect(copyRequest.sourceCommit).toEqual(CATALOG + 'head');
                                expect(copyRequest.targetCommit).toEqual('');
                                expect(copyRequest.conflicts).toBeUndefined();
                                expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                                expect(catalogManagerStub.getRecordBranch.calls.count()).toEqual(1);
                                expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'sourceBranch');
                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                                expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'targetBranch');
                                expect(utilStub.getDctermsValue).toHaveBeenCalledWith(sourceBranch, 'title');
                                expect(service.shouldRemoveSource).toHaveBeenCalledWith(request);
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
                    const copyRequest = Object.assign({}, requestObj);
                    service.setRequestDetails(copyRequest)
                        .subscribe(() => fail('Observable should have rejected'), response => {
                            expect(response).toEqual(error);
                            expect(copyRequest.sourceBranch).toEqual({'@id': ''});
                            expect(copyRequest.targetBranch).toEqual({'@id': ''});
                            expect(copyRequest.removeSource).toBeUndefined();
                            expect(copyRequest.comments).toEqual([[comment]]);
                            expect(copyRequest.sourceTitle).toEqual('');
                            expect(copyRequest.targetTitle).toEqual('');
                            expect(copyRequest.sourceCommit).toEqual('');
                            expect(copyRequest.targetCommit).toEqual('');
                            expect(copyRequest.conflicts).toBeUndefined();
                            expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                            expect(catalogManagerStub.getRecordBranch).toHaveBeenCalledWith(sourceBranch['@id'], recordId, catalogId);
                            expect(utilStub.getPropertyId).toHaveBeenCalledWith(request, MERGEREQ + 'sourceBranch');
                            expect(utilStub.getPropertyId).not.toHaveBeenCalledWith(jasmine.any(Object), CATALOG + 'head');
                            expect(utilStub.getPropertyId).not.toHaveBeenCalledWith(request, MERGEREQ + 'targetBranch');
                            expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
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
                const copyRequest = Object.assign({}, requestObj);
                service.setRequestDetails(copyRequest)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(copyRequest.sourceBranch).toEqual({'@id': ''});
                        expect(copyRequest.targetBranch).toEqual({'@id': ''});
                        expect(copyRequest.removeSource).toBeUndefined();
                        expect(copyRequest.comments).toEqual([]);
                        expect(copyRequest.sourceTitle).toEqual('');
                        expect(copyRequest.targetTitle).toEqual('');
                        expect(copyRequest.sourceCommit).toEqual('');
                        expect(copyRequest.targetCommit).toEqual('');
                        expect(copyRequest.conflicts).toBeUndefined();
                        expect(mergeRequestManagerStub.getComments).toHaveBeenCalledWith(requestId);
                        expect(catalogManagerStub.getRecordBranch).not.toHaveBeenCalled();
                        expect(utilStub.getPropertyId).not.toHaveBeenCalled();
                        expect(utilStub.getDctermsValue).not.toHaveBeenCalled();
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
        utilStub.getPropertyValue.and.returnValue('true');
        expect(service.shouldRemoveSource(request)).toBeTrue();
        utilStub.getPropertyValue.and.returnValue('false');
        expect(service.shouldRemoveSource(request)).toBeFalse();
        utilStub.getPropertyValue.and.returnValue('');
        expect(service.shouldRemoveSource(request)).toBeFalse();
    });
    describe('should delete a request', function() {
        beforeEach(function() {
            service.selected = requestObj;
            spyOn(service, 'setRequests');
        });
        it('unless an error occurs', fakeAsync(function() {
            mergeRequestManagerStub.deleteRequest.and.returnValue(throwError(error));
            service.deleteRequest(requestObj);
            tick();
            expect(mergeRequestManagerStub.deleteRequest).toHaveBeenCalledWith(requestId);
            expect(service.selected).toEqual(requestObj);
            expect(utilStub.createSuccessToast).not.toHaveBeenCalled();
            expect(service.setRequests).not.toHaveBeenCalled();
            expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
        }));
        describe('successfully', function() {
            beforeEach(function() {
                mergeRequestManagerStub.deleteRequest.and.returnValue(of(null));
            });
            it('with a selected request', fakeAsync(function() {
                service.deleteRequest(requestObj);
                tick();
                expect(mergeRequestManagerStub.deleteRequest).toHaveBeenCalledWith(requestId);
                expect(service.selected).toBeUndefined();
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(service.setRequests).not.toHaveBeenCalled();
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
            it('without a selected request', fakeAsync(function() {
                service.selected = undefined;
                service.deleteRequest(requestObj);
                tick();
                expect(mergeRequestManagerStub.deleteRequest).toHaveBeenCalledWith(requestId);
                expect(service.selected).toBeUndefined();
                expect(utilStub.createSuccessToast).toHaveBeenCalledWith(jasmine.any(String));
                expect(service.setRequests).toHaveBeenCalledWith(service.acceptedFilter);
                expect(utilStub.createErrorToast).not.toHaveBeenCalled();
            }));
        });
    });
    it('should get the MergeRequest object from a JSON-LD object', function() {
        utilStub.getDctermsValue.and.callFake((obj, prop) => prop);
        utilStub.getDctermsId.and.callFake((obj, prop) => prop);
        utilStub.getPropertyId.and.returnValue(recordId);
        utilStub.getDate.and.returnValue('date');
        userManagerStub.users = [
            {
                username: 'creator',
                iri: 'creator',
                firstName: '',
                lastName: '',
                external: false,
                roles: [],
                email: ''
            },
            {
                username: 'assignee',
                iri: 'assignee',
                firstName: '',
                lastName: '',
                external: false,
                roles: [],
                email: ''
            }
        ];
        const jsonld = Object.assign({}, request);
        jsonld[MERGEREQ + 'assignee'] = [{'@id': 'assignee'}];
        expect(service.getRequestObj(jsonld)).toEqual({
            jsonld,
            title: 'title',
            description: 'description',
            date: 'date',
            creator: 'creator',
            recordIri: recordId,
            assignees: ['assignee']
        });
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(jsonld, 'title');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(jsonld, 'issued');
        expect(utilStub.getDate).toHaveBeenCalledWith('issued', 'shortDate');
        expect(utilStub.getDctermsValue).toHaveBeenCalledWith(jsonld, 'description');
        expect(utilStub.getDctermsId).toHaveBeenCalledWith(jsonld, 'creator');
        expect(utilStub.getPropertyId).toHaveBeenCalledWith(jsonld, MERGEREQ + 'onRecord');
    });
    describe('should process a response from getDifference', function() {
        it('unless one is not provided', fakeAsync(function() {
            spyOn(service, 'setDifference');
            service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', undefined)
                .subscribe(() => fail('Observable should have rejected'), response => {
                    expect(response).toEqual(jasmine.stringContaining('Difference is not set'));
                    expect(utilStub.getObjIrisFromDifference).not.toHaveBeenCalled();
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
                service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', this.httpResponse)
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(utilStub.getObjIrisFromDifference).toHaveBeenCalledWith([this.addObj]);
                        expect(utilStub.getObjIrisFromDifference).toHaveBeenCalledWith([this.delObj]);
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
                service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', this.httpResponse)
                    .subscribe(() => {
                        expect(utilStub.getObjIrisFromDifference).toHaveBeenCalledWith([this.addObj]);
                        expect(utilStub.getObjIrisFromDifference).toHaveBeenCalledWith([this.delObj]);
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
            service.processDifferenceResponse(recordId, sourceBranch['@id'], 'commitId', httpResponse)
                .subscribe(() => {
                    expect(utilStub.getObjIrisFromDifference).toHaveBeenCalledWith([]);
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
            utilStub.getBeautifulIRI.and.returnValue('beautifulIri');
        });
        it('exists in entityNames', function() {
            expect(service.getEntityNameLabel('iri1')).toEqual('label1');
        }) ;
        it('does not exist in entityNames', function() {
            expect(service.getEntityNameLabel('iri2')).toEqual('beautifulIri');
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
            utilStub.getPropertyId.and.callFake(obj => {
                if (obj === sourceBranch) {
                    return 'sourceHead';
                } else {
                    return 'targetHead';
                }
            });
        });
        describe('when getDifference resolves', function() {
            it('unless processDifferenceResponse rejects', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse').and.returnValue(throwError(error));
                service.updateRequestConfigDifference()
                    .subscribe(() => fail('Observable should have rejected'), response => {
                        expect(response).toEqual(error);
                        expect(service.clearDifference).toHaveBeenCalledWith();
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', 100, 0);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse));
                    });
                tick();
            }));
            it('and processDifferenceResponse resolves', fakeAsync(function() {
                spyOn(service, 'processDifferenceResponse').and.returnValue(of(null));
                service.updateRequestConfigDifference()
                    .subscribe(() => {
                        expect(service.clearDifference).toHaveBeenCalledWith();
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', 100, 0);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse));
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
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                expect(utilStub.getPropertyId).toHaveBeenCalledWith(undefined, CATALOG + 'head');
                expect(service.startIndex).toEqual(paginationDetails.offset);
                expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(undefined, undefined, paginationDetails.limit, paginationDetails.offset);
                expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], undefined, jasmine.any(HttpResponse));
                expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
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
                        expect(utilStub.getPropertyId).toHaveBeenCalledWith({'@id': ''}, CATALOG + 'head');
                        expect(service.startIndex).toEqual(paginationDetails.offset);
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceCommit', 'targetCommit', paginationDetails.limit, paginationDetails.offset);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, '', 'sourceCommit', jasmine.any(HttpResponse));
                        expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                    it('with a source and target branch set', fakeAsync(function() {
                        service.selected.sourceBranch = sourceBranch;
                        service.selected.targetBranch = targetBranch;
                        utilStub.getPropertyId.and.callFake(obj => {
                            if (obj === sourceBranch) {
                                return 'sourceHead';
                            } else {
                                return 'targetHead';
                            }
                        });
                        service.retrieveMoreResults(paginationDetails);
                        tick();
                        expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                        expect(utilStub.getPropertyId).toHaveBeenCalledWith(targetBranch, CATALOG + 'head');
                        expect(service.startIndex).toEqual(paginationDetails.offset);
                        expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', paginationDetails.limit, paginationDetails.offset);
                        expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse));
                        expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                    }));
                });
                it('and a request is being created', fakeAsync(function() {
                    service.requestConfig = {
                        sourceBranchId: sourceBranch['@id'],
                        sourceBranch,
                        targetBranchId: targetBranch['@id'],
                        targetBranch,
                        title: '',
                        recordId,
                        removeSource: false
                    };
                    utilStub.getPropertyId.and.callFake(obj => {
                        if (obj === sourceBranch) {
                            return 'sourceHead';
                        } else {
                            return 'targetHead';
                        }
                    });
                    service.retrieveMoreResults(paginationDetails);
                    tick();
                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(sourceBranch, CATALOG + 'head');
                    expect(utilStub.getPropertyId).toHaveBeenCalledWith(targetBranch, CATALOG + 'head');
                    expect(service.startIndex).toEqual(paginationDetails.offset);
                    expect(catalogManagerStub.getDifference).toHaveBeenCalledWith('sourceHead', 'targetHead', paginationDetails.limit, paginationDetails.offset);
                    expect(service.processDifferenceResponse).toHaveBeenCalledWith(recordId, sourceBranch['@id'], 'sourceHead', jasmine.any(HttpResponse));
                    expect(utilStub.createErrorToast).not.toHaveBeenCalled();
                }));
            });
        });
        it('unless getDifference rejects', fakeAsync(function() {
            spyOn(service, 'processDifferenceResponse');
            catalogManagerStub.getDifference.and.returnValue(throwError(error));
            service.selected = requestObj;
            service.retrieveMoreResults(paginationDetails);
            tick();
            expect(utilStub.getPropertyId).toHaveBeenCalledWith(undefined, CATALOG + 'head');
            expect(service.startIndex).toEqual(paginationDetails.offset);
            expect(catalogManagerStub.getDifference).toHaveBeenCalledWith(undefined, undefined, paginationDetails.limit, paginationDetails.offset);
            expect(service.processDifferenceResponse).not.toHaveBeenCalled();
            expect(utilStub.createErrorToast).toHaveBeenCalledWith(error);
        }));
        it('unless a request is not selected and one is not being created', function() {
            spyOn(service, 'processDifferenceResponse');
            service.retrieveMoreResults(paginationDetails);
            expect(utilStub.createErrorToast).toHaveBeenCalledWith('Could not load more results.');
            expect(catalogManagerStub.getDifference).not.toHaveBeenCalled();
            expect(service.processDifferenceResponse).not.toHaveBeenCalled();
            expect(utilStub.getPropertyId).not.toHaveBeenCalled();
        });
    });
});
