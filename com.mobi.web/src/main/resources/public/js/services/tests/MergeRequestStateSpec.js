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

    describe('should set the requests list properly if getRequests', function() {
        describe('resolves', function() {
            beforeEach(function() {
                mergeRequestsStateSvc.initialize();
                mergeRequestManagerSvc.getRequests.and.returnValue($q.when([{id: 'request1'}]));
                utilSvc.getDctermsValue.and.callFake(function(entity, propId) {
                    return propId;
                });
                utilSvc.getDctermsId.and.callFake(function(entity, propId) {
                    return propId;
                });
                utilSvc.getPropertyId.and.returnValue('recordId');
                utilSvc.getDate.and.returnValue('date');
                userManagerSvc.users = [{iri: 'creator', username: 'username'}];
            });
            describe('and getRecord ', function() {
                it('resolves', function() {
                    catalogManagerSvc.getRecord.and.returnValue($q.when({'@id': 'recordId'}));
                    mergeRequestsStateSvc.setRequests();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalled();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'issued');
                    expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith({id: 'request1'}, prefixes.mergereq + 'onRecord');
                    expect(catalogManagerSvc.getRecord.calls.count()).toEqual(1);
                    expect(catalogManagerSvc.getRecord).toHaveBeenCalledWith('recordId', 'catalogId');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({'@id': 'recordId'}, 'title');
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.requests).toEqual([{
                        request: {id: 'request1'},
                        title: 'title',
                        creator: 'username',
                        date: 'date',
                        recordIri: 'recordId',
                        recordTitle: 'title'
                    }]);
                });
                it('rejects', function() {
                    catalogManagerSvc.getRecord.and.returnValue($q.reject('Error Message'));
                    mergeRequestsStateSvc.setRequests();
                    scope.$apply();
                    expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalled();
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'title');
                    expect(utilSvc.getDctermsValue).toHaveBeenCalledWith({id: 'request1'}, 'issued');
                    expect(utilSvc.getDate).toHaveBeenCalledWith('issued', 'shortDate');
                    expect(utilSvc.getPropertyId).toHaveBeenCalledWith({id: 'request1'}, prefixes.mergereq + 'onRecord');
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
            expect(mergeRequestManagerSvc.getRequests).toHaveBeenCalled();
            expect(utilSvc.getDctermsValue).not.toHaveBeenCalled();
            expect(utilSvc.getDctermsId).not.toHaveBeenCalled();
            expect(utilSvc.getPropertyId).not.toHaveBeenCalled();
            expect(catalogManagerSvc.getRecord).not.toHaveBeenCalled();
            expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            expect(mergeRequestsStateSvc.requests).toEqual([]);
        });
    });
    describe('should select a merge request if it is', function() {
        beforeEach(function() {
            utilSvc.getPropertyId.and.callFake(function(obj, prop) {
                return prop;
            });
            utilSvc.getPropertyValue.and.callFake(function(obj, prop) {
                return prop;
            });
            utilSvc.getDctermsValue.and.callFake(function(obj, prop) {
                return prop;
            });
            this.tabObj = {};
            this.request = {
                recordIri: 'recordIri',
                request: {}
            };
        });
        it('accepted', function() {
            mergeRequestManagerSvc.isAccepted.and.returnValue(true);
            mergeRequestsStateSvc.selectRequest(this.request, this.tabObj);
            expect(this.request.sourceTitle).toEqual(prefixes.mergereq + 'sourceBranchTitle');
            expect(this.request.targetTitle).toEqual(prefixes.mergereq + 'targetBranchTitle');
            expect(this.request.sourceCommit).toEqual(prefixes.mergereq + 'sourceCommit');
            expect(this.request.targetCommit).toEqual(prefixes.mergereq + 'targetCommit');
            expect(this.tabObj.selected).toEqual(this.request);
        });
        describe('open', function() {
            beforeEach(function() {
                mergeRequestManagerSvc.isAccepted.and.returnValue(false);
                this.expected = angular.copy(this.request);
            });
            describe('and getRecordBranch resolves', function() {
                beforeEach(function() {
                    catalogManagerSvc.getRecordBranch.and.returnValue($q.when({}));
                    this.expected.sourceBranch = {};
                    this.expected.sourceTitle = 'title';
                    this.expected.sourceCommit = prefixes.catalog + 'head';
                    this.expected.targetBranch = {};
                    this.expected.targetTitle = 'title';
                    this.expected.targetCommit = prefixes.catalog + 'head';
                });
                describe('and getBranchDifference resolves', function () {
                    describe('and getBranchConflicts resolves', function () {
                        it('with no conflicts', function () {
                            this.expected.hasConflicts = false;
                            catalogManagerSvc.getBranchDifference.and.returnValue($q.when({}));
                            this.expected.difference = {};
                            mergeRequestsStateSvc.selectRequest(this.request, this.tabObj);
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(this.tabObj.selected).toEqual(this.expected);
                            expect(this.request).toEqual(this.expected);
                            expect(catalogManagerSvc.getBranchDifference).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        });
                        it('with conflicts', function () {
                            this.expected.hasConflicts = true;
                            catalogManagerSvc.getBranchDifference.and.returnValue($q.when({}));
                            catalogManagerSvc.getBranchConflicts.and.returnValue($q.when([{'@id': 'recordId'}]));
                            this.expected.difference = {};
                            mergeRequestsStateSvc.selectRequest(this.request, this.tabObj);
                            scope.$apply();
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                            expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(this.tabObj.selected).toEqual(this.expected);
                            expect(this.request).toEqual(this.expected);
                            expect(catalogManagerSvc.getBranchDifference).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                            expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                        });
                    });
                    it('and getBranchConflicts rejects', function () {
                        catalogManagerSvc.getBranchDifference.and.returnValue($q.when({}));
                        catalogManagerSvc.getBranchConflicts.and.returnValue($q.reject('Error Message'));
                        this.expected.difference = {};
                        mergeRequestsStateSvc.selectRequest(this.request, this.tabObj);
                        scope.$apply();
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                        expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                        expect(this.tabObj.selected).toEqual(this.expected);
                        expect(this.request).toEqual(this.expected);
                        expect(catalogManagerSvc.getBranchDifference).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                        expect(catalogManagerSvc.getBranchConflicts).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                        expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                    });
                });
                it('unless getBranchDifference rejects', function () {
                    catalogManagerSvc.getBranchDifference.and.returnValue($q.reject('Error Message'));
                    mergeRequestsStateSvc.selectRequest(this.request, this.tabObj);
                    scope.$apply();
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                    expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                    expect(_.has(this.tabObj, 'selected')).toEqual(false);
                    expect(this.request).toEqual(this.expected);
                    expect(catalogManagerSvc.getBranchDifference).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                    expect(catalogManagerSvc.getBranchConflicts).not.toHaveBeenCalled();
                    expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
                });
            });
            it('unless getRecordBranch rejects', function() {
                this.expected = angular.copy(this.request);
                catalogManagerSvc.getRecordBranch.and.returnValue($q.reject('Error Message'));
                mergeRequestsStateSvc.selectRequest(this.request, this.tabObj);
                scope.$apply();
                expect(catalogManagerSvc.getRecordBranch).toHaveBeenCalledWith(prefixes.mergereq + 'sourceBranch', 'recordIri', 'catalogId');
                expect(catalogManagerSvc.getRecordBranch).not.toHaveBeenCalledWith(prefixes.mergereq + 'targetBranch', 'recordIri', 'catalogId');
                expect(_.has(this.tabObj, 'selected')).toEqual(false);
                expect(this.request).toEqual(this.expected);
                expect(catalogManagerSvc.getBranchDifference).not.toHaveBeenCalled();
                expect(catalogManagerSvc.getBranchConflicts).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
    });
    it('should return the current tab', function() {
        expect(mergeRequestsStateSvc.getCurrentTab()).toEqual(mergeRequestsStateSvc.open);
        mergeRequestsStateSvc.open.active = false;
        expect(mergeRequestsStateSvc.getCurrentTab()).toBeUndefined();
    });
});
