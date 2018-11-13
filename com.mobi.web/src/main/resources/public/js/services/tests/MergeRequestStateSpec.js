/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
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
describe('Merge Requests State service', function() {
    var mergeRequestsStateSvc, mergeRequestManagerSvc, catalogManagerSvc, userManagerSvc, utilSvc, prefixes, $q, scope;

    beforeEach(function() {
        module('mergeRequestsState');
        mockMergeRequestManager();
        mockCatalogManager();
        mockUserManager();
        mockUtil();
        mockPrefixes();

        inject(function(mergeRequestsStateService, _mergeRequestManagerService_, _catalogManagerService_, _userManagerService_, _utilService_, _prefixes_, _$q_, _$rootScope_) {
            mergeRequestsStateSvc = mergeRequestsStateService;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            catalogManagerSvc = _catalogManagerService_;
            userManagerSvc = _userManagerService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
            $q = _$q_;
            scope = _$rootScope_;
        });

        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        utilSvc.rejectError.and.returnValue($q.reject('Error Message'));
        mergeRequestsStateSvc.initialize();
    });

    afterEach(function() {
        mergeRequestsStateSvc = null;
        mergeRequestManagerSvc = null;
        catalogManagerSvc = null;
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
            assignees: []
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
                        catalogManagerSvc.getRecord.and.returnValue($q.when({'@id': 'recordId'}));
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
                        catalogManagerSvc.getRecord.and.returnValue($q.when({'@id': 'recordId'}));
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
        it('accepted', function() {
            mergeRequestManagerSvc.isAccepted.and.returnValue(true);
            mergeRequestsStateSvc.setRequestDetails(this.request);
            expect(this.request.sourceTitle).toEqual(prefixes.mergereq + 'sourceBranchTitle');
            expect(this.request.targetTitle).toEqual(prefixes.mergereq + 'targetBranchTitle');
            expect(this.request.sourceCommit).toEqual(prefixes.mergereq + 'sourceCommit');
            expect(this.request.targetCommit).toEqual(prefixes.mergereq + 'targetCommit');
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
                });
                describe('and getDifference resolves', function() {
                    describe('and getBranchConflicts resolves', function() {
                        it('with no conflicts', function () {
                            this.expected.conflicts = [];
                            catalogManagerSvc.getDifference.and.returnValue($q.when({}));
                            this.expected.difference = {};
                            mergeRequestsStateSvc.setRequestDetails(this.request);
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(this.request).toEqual(this.expected);
                            expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head');
                            expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        });
                        it('with conflicts', function() {
                            var conflicts = [{'@id': 'recordId'}];
                            this.expected.conflicts = conflicts;
                            catalogManagerSvc.getDifference.and.returnValue($q.when({}));
                            catalogManagerSvc.getBranchConflicts.and.returnValue($q.when(conflicts));
                            this.expected.difference = {};
                            mergeRequestsStateSvc.setRequestDetails(this.request);
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(this.request).toEqual(this.expected);
                            expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head');
                            expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        });
                    });
                    it('and getBranchConflicts rejects', function() {
                        catalogManagerSvc.getDifference.and.returnValue($q.when({}));
                        catalogManagerSvc.getBranchConflicts.and.returnValue($q.reject('Error Message'));
                        this.expected.difference = {};
                        mergeRequestsStateSvc.setRequestDetails(this.request);
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                        expect(this.request).toEqual(this.expected);
                        expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head');
                        expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
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
                    expect(catalogManagerSvc.getDifference).toHaveBeenCalledWith(prefixes.catalog + 'head', prefixes.catalog + 'head');
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
});
