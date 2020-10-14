/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
import {
    mockMergeRequestManager,
    mockCatalogManager,
    mockUserManager,
    mockUtil,
    mockPrefixes,
    mockOntologyManager
} from '../../../../../test/js/Shared';
import {get} from "lodash";

describe('Merge Requests State service', function() {
    var mergeRequestsStateSvc, mergeRequestManagerSvc, catalogManagerSvc, userManagerSvc, ontologyManagerSvc, utilSvc, prefixes, $q, scope;

    beforeEach(function() {
        angular.mock.module('shared');
        mockMergeRequestManager();
        mockCatalogManager();
        mockUserManager();
        mockOntologyManager();
        mockUtil();
        mockPrefixes();

        inject(function(mergeRequestsStateService, _mergeRequestManagerService_, _catalogManagerService_, _userManagerService_, _ontologyManagerService_, _utilService_, _prefixes_, _$q_, _$rootScope_) {
            mergeRequestsStateSvc = mergeRequestsStateService;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            userManagerSvc = _userManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
            scope = _$rootScope_;
        });

        this.difference = {
            additions: [],
            deletions: []
        };
        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        catalogManagerSvc.differencePageSize = 100;
        catalogManagerSvc.getDifference.and.returnValue($q.when({data: this.difference, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        mergeRequestsStateSvc.initialize();
    });

    afterEach(function() {
        mergeRequestsStateSvc = null;
        mergeRequestManagerSvc = null;
        catalogManagerSvc = null;
        ontologyManagerSvc = null;
        userManagerSvc = null;
        utilSvc = null;
        prefixes = null;
        $q = null;
        scope = null;
    });

    it('should reset important variables', function() {
        mergeRequestsStateSvc.requestConfig = {
            title: 'title',
            description: 'description',
            sourceBranchId: 'id',
            targetBranchId: 'id',
            recordId: 'id',
            assignees: ['user']
        };
        mergeRequestsStateSvc.createRequestStep = 1;
        mergeRequestsStateSvc.createRequest = true;
        mergeRequestsStateSvc.open = {
            active: true,
            selected: {}
        };
        mergeRequestsStateSvc.reset();
        expect(mergeRequestsStateSvc.requestConfig).toEqual({
            title: '',
            description: '',
            sourceBranchId: '',
            targetBranchId: '',
            recordId: '',
            assignees: [],
            entityNames: {},
            startIndex: 0
        });
        expect(mergeRequestsStateSvc.createRequest).toEqual(false);
        expect(mergeRequestsStateSvc.createRequestStep).toEqual(0);
        expect(mergeRequestsStateSvc.selected).toBeUndefined();
    });
    describe('should set the requests list properly if accepted is', function() {
        beforeEach(function() {
            mergeRequestsStateSvc.initialize();
            utilSvc.getDctermsValue.and.callFake((entity, propId) => propId);
            utilSvc.getDctermsId.and.callFake((entity, propId) => propId);
            utilSvc.getPropertyId.and.returnValue('recordId');
            utilSvc.getDate.and.returnValue('date');
            userManagerSvc.users = [{iri: 'creator', username: 'username1'}, {iri: 'assignee', username: 'username2'}];
            this.requestJsonld = {id: 'request1', [prefixes.mergereq + 'assignee']: [{'@id': 'assignee'}]};
        });
        describe('true and getRequests', function() {
            describe('resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerSvc.getRequests.and.returnValue($q.when([angular.copy(this.requestJsonld)]));
                });
                describe('and getRecord ', function() {
                    it('resolves', function() {
                        catalogManagerSvc.getRecord.and.returnValue($q.when([{'@id': 'recordId'}]));
                        mergeRequestsStateSvc.setRequests(true);
                        scope.$apply();
                        expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalledWith({accepted: true});
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'title');
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'issued');
                        expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                        expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.requestJsonld, prefixes.mergereq + 'onRecord');
                        expect(catalogManagerSvc.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith('recordId', 'catalogId');
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'recordId'}, 'title');
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        expect(mergeRequestsStateSvc.requests).toEqual([{
                            jsonld: this.requestJsonld,
                            title: 'title',
                            creator: 'username1',
                            date: 'date',
                            recordIri: 'recordId',
                            recordTitle: 'title',
                            assignees: ['username2']
                        }]);
                    });
                    it('rejects', function() {
                        catalogManagerSvc.getRecord.and.returnValue($q.reject('Error Message'));
                        mergeRequestsStateSvc.setRequests(true);
                        scope.$apply();
                        expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalledWith({accepted: true});
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'title');
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'issued');
                        expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                        expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.requestJsonld, prefixes.mergereq + 'onRecord');
                        expect(catalogManagerSvc.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith('recordId', 'catalogId');
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                        expect(mergeRequestsStateSvc.requests).toEqual([]);
                    });
                });
            });
            it('rejects', function() {
                mergeRequestManagerSvc.getRequests.and.returnValue($q.reject('Error Message'));
                mergeRequestsStateSvc.setRequests(true);
                scope.$apply();
                expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalledWith({accepted: true});
                expect(utilSvc.getDctermsValue).not.toHaveBeenCalled();
                expect(utilSvc.getDctermsId).not.toHaveBeenCalled();
                expect(utilSvc.getPropertyId).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                expect(mergeRequestsStateSvc.requests).toEqual([]);
            });
        });
        describe('false and getRequests', function() {
            describe('resolves', function() {
                beforeEach(function() {
                    mergeRequestManagerSvc.getRequests.and.returnValue($q.when([this.requestJsonld]));
                });
                describe('and getRecord ', function() {
                    it('resolves', function() {
                        catalogManagerSvc.getRecord.and.returnValue($q.when([{'@id': 'recordId'}]));
                        mergeRequestsStateSvc.setRequests();
                        scope.$apply();
                        expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalledWith({accepted: false});
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'title');
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'issued');
                        expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                        expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.requestJsonld, prefixes.mergereq + 'onRecord');
                        expect(catalogManagerSvc.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith('recordId', 'catalogId');
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'recordId'}, 'title');
                        expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        expect(mergeRequestsStateSvc.requests).toEqual([{
                            jsonld: this.requestJsonld,
                            title: 'title',
                            creator: 'username1',
                            date: 'date',
                            recordIri: 'recordId',
                            recordTitle: 'title',
                            assignees: ['username2']
                        }]);
                    });
                    it('rejects', function() {
                        catalogManagerSvc.getRecord.and.returnValue($q.reject('Error Message'));
                        mergeRequestsStateSvc.setRequests();
                        scope.$apply();
                        expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalledWith({accepted: false});
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'title');
                        expect(utilSvc.getDctermsValue).toHaveBeenCalledWith(this.requestJsonld, 'issued');
                        expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                        expect(utilSvc.getPropertyId).toHaveBeenCalledWith(this.requestJsonld, prefixes.mergereq + 'onRecord');
                        expect(catalogManagerSvc.getRecord.calls.count()).toEqual(1);
                        expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith('recordId', 'catalogId');
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                        expect(mergeRequestsStateSvc.requests).toEqual([]);
                    });
                });
            });
            it('rejects', function() {
                mergeRequestManagerSvc.getRequests.and.returnValue($q.reject('Error Message'));
                mergeRequestsStateSvc.setRequests();
                scope.$apply();
                expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalledWith({accepted: false});
                expect(utilSvc.getDctermsValue).not.toHaveBeenCalled();
                expect(utilSvc.getDctermsId).not.toHaveBeenCalled();
                expect(utilSvc.getPropertyId).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                expect(mergeRequestsStateSvc.requests).toEqual([]);
            });
        });
    });
    describe('should set metadata on a merge request if it is', function() {
        beforeEach(function() {
            utilSvc.getPropertyId.and.callFake((obj, prop) => prop);
            utilSvc.getPropertyValue.and.callFake((obj, prop) => prop);
            utilSvc.getDctermsValue.and.callFake((obj, prop) => prop);
            this.request = {
                recordIri: 'recordIri',
                targetTitle: '',
                targetBranch: '',
                targetCommit: '',
                difference: '',
                jsonld: {}
            };
        });
        describe('accepted and getDifference', function() {
            describe('resolves and getOntologyEntityNames', function() {
                it('resolves', function() {
                    this.request.sourceBranch = {'@id': 'sourceBranchId'};
                    this.difference2 = {
                        additions: [{'@id': 'iri1'}],
                        deletions: []
                    };
                    this.expectedDifference = {
                        additions: [{'@id': 'iri1'}],
                        deletions: [],
                        hasMoreResults: false
                    };
                    this.expectedEntityNames = {'iri1':{}};
                    catalogManagerSvc.getDifference.and.returnValue($q.when({data: this.difference2, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
                    ontologyManagerSvc.getOntologyEntityNames.and.returnValue($q.when(this.expectedEntityNames));
                    mergeRequestManagerSvc.isAccepted.and.returnValue(true);
                    mergeRequestsStateSvc.setRequestDetails(this.request);
                    scope.$apply();
                    expect(this.request.sourceTitle).toEqual(prefixes.mergereq + 'sourceBranchTitle');
                    expect(this.request.targetTitle).toEqual(prefixes.mergereq + 'targetBranchTitle');
                    expect(this.request.sourceCommit).toEqual(prefixes.mergereq + 'sourceCommit');
                    expect(this.request.targetCommit).toEqual(prefixes.mergereq + 'targetCommit');
                    expect(this.request.difference).toEqual(this.expectedDifference);
                    expect(this.request.entityNames).toEqual(this.expectedEntityNames);
                    expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.mergereq + 'sourceCommit', prefixes.mergereq + 'targetCommit', 100, 0);
                    expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordIri', undefined, prefixes.mergereq + 'sourceCommit', false, false);
                });
                it('rejects', function() {
                    this.expectedDifference = {
                        additions: [],
                        deletions: [],
                        hasMoreResults: false
                    };
                    mergeRequestManagerSvc.isAccepted.and.returnValue(true);
                    ontologyManagerSvc.getOntologyEntityNames.and.returnValue($q.reject('Error Message'));
                    mergeRequestsStateSvc.setRequestDetails(this.request);
                    scope.$apply();
                    expect(this.request.sourceTitle).toEqual(prefixes.mergereq + 'sourceBranchTitle');
                    expect(this.request.targetTitle).toEqual(prefixes.mergereq + 'targetBranchTitle');
                    expect(this.request.sourceCommit).toEqual(prefixes.mergereq + 'sourceCommit');
                    expect(this.request.targetCommit).toEqual(prefixes.mergereq + 'targetCommit');
                    expect(this.request.difference).toEqual(this.expectedDifference);
                    expect(this.request.entityNames).toEqual({});
                    expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.mergereq + 'sourceCommit', prefixes.mergereq + 'targetCommit', 100, 0);
                    expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordIri', undefined, prefixes.mergereq + 'sourceCommit', false, false);
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                });
            });
            it('rejects', function() {
                mergeRequestManagerSvc.isAccepted.and.returnValue(true);
                catalogManagerSvc.getDifference.and.returnValue($q.reject('Error Message'));
                mergeRequestsStateSvc.setRequestDetails(this.request);
                scope.$apply();
                expect(this.request.sourceTitle).toEqual(prefixes.mergereq + 'sourceBranchTitle');
                expect(this.request.targetTitle).toEqual(prefixes.mergereq + 'targetBranchTitle');
                expect(this.request.sourceCommit).toEqual(prefixes.mergereq + 'sourceCommit');
                expect(this.request.targetCommit).toEqual(prefixes.mergereq + 'targetCommit');
                expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.mergereq + 'sourceCommit', prefixes.mergereq + 'targetCommit', 100, 0);
                expect(ontologyManagerSvc.getOntologyEntityNames).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
        describe('open', function() {
            beforeEach(function() {
                mergeRequestManagerSvc.isAccepted.and.returnValue(false);
                this.expected = angular.copy(this.request);
            });
            describe('and getRecordBranch resolves for source branch', function() {
                beforeEach(function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when({}));
                    this.expected.sourceBranch = {};
                    this.expected.sourceTitle = 'title';
                    this.expected.sourceCommit = prefixes.catalog + 'head';
                    this.expected.targetBranch = {};
                    this.expected.targetTitle = 'title';
                    this.expected.targetCommit = prefixes.catalog + 'head';
                    this.expected.removeSource = false;
                    this.expected.comments = [];
                    this.expected.entityNames = {};
                });
                describe('and getDifference resolves', function() {
                    describe('and getOntologyEntityNames resolves', function() {
                        describe('and getBranchConflicts resolves', function() {
                            it('with no conflicts', function() {
                                this.expected.conflicts = [];
                                this.expected.difference = {
                                    additions: [],
                                    deletions: [],
                                    hasMoreResults: false
                                };
                                this.expected.entityNames = {};
                                mergeRequestsStateSvc.setRequestDetails(this.request);
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                                expect(this.request).toEqual(this.expected);
                                expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head', 100, 0);
                                expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordIri', undefined, prefixes.catalog + 'head', false, false);
                                expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                            });
                            it('with conflicts', function() {
                                var conflicts = [{'@id': 'recordId'}];
                                this.expected.conflicts = conflicts;
                                catalogManagerSvc.getBranchConflicts.and.returnValue($q.when(conflicts));
                                this.expected.difference = {
                                    additions: [],
                                    deletions: [],
                                    hasMoreResults: false
                                };
                                this.expected.entityNames = {};
                                mergeRequestsStateSvc.setRequestDetails(this.request);
                                scope.$apply();
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                                expect(this.request).toEqual(this.expected);
                                expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head', 100, 0);
                                expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordIri', undefined, prefixes.catalog + 'head', false, false);
                                expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                            });
                        });
                        it('and getBranchConflicts rejects', function() {
                            catalogManagerSvc.getBranchConflicts.and.returnValue($q.reject('Error Message'));
                            ontologyManagerSvc.getOntologyEntityNames.and.returnValue($q.when({}));
                            this.expected.difference = {
                                additions: [],
                                deletions: [],
                                hasMoreResults: false
                            };
                            this.expected.entityNames = {};
                            mergeRequestsStateSvc.setRequestDetails(this.request);
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(this.request).toEqual(this.expected);
                            expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head', 100, 0);
                            expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordIri', undefined, prefixes.catalog + 'head', false, false);
                            expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                        });
                    });
                    it('unless getOntologyEntityNames rejects', function() {
                        ontologyManagerSvc.getOntologyEntityNames.and.returnValue($q.reject('Error Message'));
                        this.expected.difference = {
                            additions: [],
                            deletions: [],
                            hasMoreResults: false
                        };
                        mergeRequestsStateSvc.setRequestDetails(this.request);
                        scope.$apply();

                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                        expect(this.request).toEqual(this.expected);
                        expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head', 100, 0);
                        expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith('recordIri', undefined, prefixes.catalog + 'head', false, false);
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                    });
                });
                it('unless target IRI is not set', function() {
                    utilSvc.getPropertyId.and.callFake((obj, prop) => prop === 'mergereq:targetBranch' ? '' : prop);
                    this.expected.targetBranch = '';
                    this.expected.targetTitle = '';
                    this.expected.targetCommit = '';
                    mergeRequestsStateSvc.setRequestDetails(this.request);
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                    expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                    expect(catalogManagerSvc.getRecordBranch.calls.count()).toEqual(1);
                    expect(this.request).toEqual(this.expected);
                    expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
                    expect(catalogManagerSvc.getBranchConflicts).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
                it('unless getDifference rejects', function() {
                    catalogManagerSvc.getDifference.and.returnValue($q.reject('Error Message'));
                    mergeRequestsStateSvc.setRequestDetails(this.request);
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                    expect(this.request).toEqual(this.expected);
                    expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head', 100, 0);
                    expect(catalogManagerSvc.getBranchConflicts).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                });
            });
            it('unless getRecordBranch rejects', function() {
                this.expected.sourceTitle = '';
                this.expected.targetTitle = '';
                this.expected.sourceBranch = '';
                this.expected.targetBranch = '';
                this.expected.sourceCommit = '';
                this.expected.targetCommit = '';
                this.expected.difference = '';
                this.expected.removeSource = '';
                this.expected.comments = [];
                this.expected.entityNames = {};
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('Error Message'));
                mergeRequestsStateSvc.setRequestDetails(this.request);
                scope.$apply();

                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                expect(this.request).toEqual(this.expected);
                expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getBranchConflicts).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
    });
    describe('should resolve the conflicts on a request', function() {
        beforeEach(function() {
            spyOn(mergeRequestsStateSvc, 'setRequestDetails');
            this.request = {
                targetBranch: {'@id': 'target'},
                sourceBranch: {'@id': 'source'},
                recordIri: 'record'
            }
        });
        it('if mergeBranches resolves', function() {
            mergeRequestsStateSvc.resolveRequestConflicts(this.request, {})
                .then(_.noop, () => {
                    fail('Promise should have resolved');
                });
            scope.$apply();
            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith('target', 'source', 'record', 'catalogId', {});
            expect(mergeRequestsStateSvc.setRequestDetails).toHaveBeenCalledWith(this.request);
        });
        it('unless mergeBranches rejects', function() {
            catalogManagerSvc.mergeBranches.and.returnValue($q.reject('Error'));
            mergeRequestsStateSvc.resolveRequestConflicts(this.request, {})
                .then(() => {
                    fail('Promise should have rejected');
                }, response => {
                    expect(response).toEqual('Error');
                });
            scope.$apply();
            expect(catalogManagerSvc.mergeBranches).toHaveBeenCalledWith('target', 'source', 'record', 'catalogId', {});
            expect(mergeRequestsStateSvc.setRequestDetails).not.toHaveBeenCalled();
        });
    });
    describe('should delete a request', function() {
        beforeEach(function() {
            this.request = {jsonld: {'@id': 'request'}};
            mergeRequestsStateSvc.selected = this.request;
            spyOn(mergeRequestsStateSvc, 'setRequests');
        });
        it('unless an error occurs', function() {
            mergeRequestManagerSvc.deleteRequest.and.returnValue($q.reject('Error Message'));
            mergeRequestsStateSvc.deleteRequest(this.request);
            scope.$apply();
            expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
            expect(mergeRequestsStateSvc.selected).toEqual(this.request);
            expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
            expect(mergeRequestsStateSvc.setRequests).not.toHaveBeenCalled();
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
        });
        describe('successfully', function() {
            beforeEach(function() {
                mergeRequestManagerSvc.deleteRequest.and.returnValue($q.when());
            });
            it('with a selected request', function() {
                mergeRequestsStateSvc.deleteRequest(this.request);
                scope.$apply();
                expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                expect(mergeRequestsStateSvc.selected).toBeUndefined();
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(mergeRequestsStateSvc.setRequests).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('without a selected request', function() {
                mergeRequestsStateSvc.selected = undefined;
                mergeRequestsStateSvc.deleteRequest(this.request);
                scope.$apply();
                expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                expect(mergeRequestsStateSvc.selected).toBeUndefined();
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(mergeRequestsStateSvc.setRequests).toHaveBeenCalledWith(mergeRequestsStateSvc.acceptedFilter);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('should get source EntityNames', function() {
        beforeEach(function() {
            this.entityNames = {'iri1':{}, 'iri2':{}, 'iri3':{}};
            this.filtered = {'iri1':{}, 'iri3':{}};
            this.difference = {
                additions: [{'@id': 'iri1'}],
                deletions: [{'@id': 'iri3'}]
            }
            ontologyManagerSvc.getOntologyEntityNames.and.returnValue($q.when(this.entityNames));
        });
        describe('when request object is the requestConfig', function() {
            it('with difference set', function() {
                this.requestConfig = {
                    recordId: 'id',
                    sourceBranch: {'@id': 'source'},
                    difference: this.difference
                };
                mergeRequestsStateSvc.requestConfig = this.requestConfig;
                mergeRequestsStateSvc.getSourceEntityNames();
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith(this.requestConfig.recordId, this.requestConfig.sourceBranch['@id'], undefined, false, false);
                expect(mergeRequestsStateSvc.requestConfig.entityNames).toEqual(this.filtered);
            });
            it('with no difference set', function() {
                this.requestConfig = {
                    recordId: 'id',
                    sourceBranch: {'@id': 'source'}
                };
                mergeRequestsStateSvc.requestConfig = this.requestConfig;
                mergeRequestsStateSvc.getSourceEntityNames();
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith(this.requestConfig.recordId, this.requestConfig.sourceBranch['@id'], undefined, false, false);
                expect(mergeRequestsStateSvc.requestConfig.entityNames).toEqual({});
            });
        });
        describe('when request object is a passed requestConfig', function() {
            it('with difference set', function() {
                this.requestConfig = {
                    recordId: 'id',
                    sourceBranch: {'@id': 'source'},
                    difference: this.difference
                };
                mergeRequestsStateSvc.getSourceEntityNames(this.requestConfig);
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith(this.requestConfig.recordId, this.requestConfig.sourceBranch['@id'], undefined, false, false);
                expect(this.requestConfig.entityNames).toEqual(this.filtered);
            });
            it('with no difference set', function() {
                this.requestConfig = {
                    recordId: 'id',
                    sourceBranch: {'@id': 'source'},
                };
                mergeRequestsStateSvc.getSourceEntityNames(this.requestConfig);
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith(this.requestConfig.recordId, this.requestConfig.sourceBranch['@id'], undefined, false, false);
                expect(this.requestConfig.entityNames).toEqual({});
            });
        });
        describe('when a request is passed', function() {
            it('with difference set', function() {
                this.request = {
                    recordIri: 'recordIri',
                    sourceCommit: 'commit',
                    sourceBranch: {'@id': 'source'},
                    difference: this.difference
                };
                mergeRequestsStateSvc.getSourceEntityNames(this.request);
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyEntityNames).toHaveBeenCalledWith(this.request.recordIri, this.request.sourceBranch['@id'], 'commit', false, false, [ 'iri1', 'iri3' ]);
                expect(this.request.entityNames).toEqual(this.filtered);
            });
            it('with no difference set', function() {
                this.request = {
                    recordIri: 'recordIri',
                    sourceCommit: 'commit',
                    sourceBranch: {'@id': 'source'}
                };
                mergeRequestsStateSvc.getSourceEntityNames(this.request);
                scope.$apply();
                expect(ontologyManagerSvc.getOntologyEntityNames).not.toHaveBeenCalled();
                expect(this.request.entityNames).toEqual({});
            });
        });
    });
    describe('should retrieve the label of an entityName', function() {
        beforeEach(function() {
            this.entityNames = {'iri1':{'label':'label1'}};
            utilSvc.getBeautifulIRI.and.returnValue('beautifulIri');
        });
        describe('when the requestConfig is set and the entity', function() {
           it('exists in entityNames', function() {
               mergeRequestsStateSvc.requestConfig.entityNames = this.entityNames;
               expect(mergeRequestsStateSvc.getEntityNameLabel('iri1')).toEqual('label1');
           }) ;
           it('does not exist in entityNames', function() {
               mergeRequestsStateSvc.requestConfig.entityNames = this.entityNames;
               expect(mergeRequestsStateSvc.getEntityNameLabel('iri2')).toEqual('beautifulIri');
           });
        });
        describe('when selected is set and the entity', function() {
            it('exists in entityNames', function() {
                mergeRequestsStateSvc.selected = {'entityNames': this.entityNames};
                expect(mergeRequestsStateSvc.getEntityNameLabel('iri1')).toEqual('label1');
            }) ;
            it('does not exist in entityNames', function() {
                mergeRequestsStateSvc.selected = {'entityNames': this.entityNames};
                expect(mergeRequestsStateSvc.getEntityNameLabel('iri2')).toEqual('beautifulIri');
            });
        });
    });
    describe('should update the requestConfig difference when getDifference', function() {
        beforeEach(function() {
            this.requestConfig = {};
            this.difference = {
                additions: [],
                deletions: []
            };
            this.expectedDifference = angular.copy(this.difference);
            this.expectedDifference.hasMoreResults = false;
            spyOn(mergeRequestsStateSvc, 'getSourceEntityNames');
            catalogManagerSvc.getDifference.and.returnValue($q.when({data: this.difference, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
            utilSvc.getPropertyId.and.callFake(function(obj, prop) {
                let commit = get(obj, [prefixes.catalog + 'head', 0, '@id']);
                return commit ? commit : 'head';
            });
        });
        it('resolves', function() {
            mergeRequestsStateSvc.updateRequestConfigDifference();
            scope.$apply();
            expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('head', 'head', 100, 0);
            expect(mergeRequestsStateSvc.getSourceEntityNames).toHaveBeenCalled();
            expect(mergeRequestsStateSvc.requestConfig.difference).toEqual(this.expectedDifference);
        });
        it('rejects', function() {
            catalogManagerSvc.getDifference.and.returnValue($q.reject());
            mergeRequestsStateSvc.updateRequestConfigDifference();
            scope.$apply();
            expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith('head', 'head', 100, 0);
            expect(mergeRequestsStateSvc.getSourceEntityNames).not.toHaveBeenCalled();
            expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
            expect(mergeRequestsStateSvc.requestConfig.entityNames).toBeUndefined();
        });
    });
    describe('should update the requestConfig branch information when', function() {
        beforeEach(function () {
            utilSvc.getPropertyId.and.callFake((obj, prop) => {
                return obj[prop][0]['@id'];
            });
            this.sourceBranch = {'@id': 'sourceBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId1'}]};
            this.targetBranch = {'@id': 'targetBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId1'}]};
            this.sourceBranchNewHead = {'@id': 'sourceBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId2'}]};
            this.targetBranchNewHead = {'@id': 'targetBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId2'}]};
            this.branches = [this.sourceBranch, this.targetBranch];
            mergeRequestsStateSvc.requestConfig.sourceBranch = this.sourceBranch;
            mergeRequestsStateSvc.requestConfig.targetBranch = this.targetBranch;
        });
        it('source does not exist', function () {
            mergeRequestsStateSvc.updateRequestConfigBranch('sourceBranch', [this.targetBranch]);
            scope.$apply();
            expect(mergeRequestsStateSvc.requestConfig.sourceBranch).toEqual(undefined);
        });
        it('target does not exist', function () {
            mergeRequestsStateSvc.updateRequestConfigBranch('targetBranch', [this.sourceBranch]);
            scope.$apply();
            expect(mergeRequestsStateSvc.requestConfig.targetBranch).toEqual(undefined);
        });
        it('source has new commits', function () {
            mergeRequestsStateSvc.updateRequestConfigBranch('sourceBranch', [this.sourceBranchNewHead]);
            scope.$apply();
            expect(mergeRequestsStateSvc.requestConfig.sourceBranch).toEqual(this.sourceBranchNewHead);
        });
        it('target has new commits', function () {
            mergeRequestsStateSvc.updateRequestConfigBranch('targetBranch', [this.targetBranchNewHead]);
            scope.$apply();
            expect(mergeRequestsStateSvc.requestConfig.targetBranch).toEqual(this.targetBranchNewHead);
        });
    });
});
