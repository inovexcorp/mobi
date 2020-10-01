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
    mockCatalogManager,
    mockMergeRequestsState,
    mockMergeRequestManager,
    mockUtil,
    mockPrefixes,
    injectTrustedFilter,
    injectHighlightFilter
} from '../../../../../../test/js/Shared';
import { get } from 'lodash';

describe('Request Branch Select component', function() {
    var $compile, scope, $q, catalogManagerSvc, mergeRequestsStateSvc, utilSvc, prefixes;

    beforeEach(function() {
        angular.mock.module('merge-requests');
        mockCatalogManager();
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockUtil();
        mockPrefixes();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _catalogManagerService_, _mergeRequestsStateService_, _utilService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            catalogManagerSvc = _catalogManagerService_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            utilSvc = _utilService_;
            prefixes = _prefixes_;
        });

        this.difference = {
            additions: [],
            deletions: []
        };
        this.headers = {'has-more-results': 'false'};
        catalogManagerSvc.localCatalog = {'@id': 'catalogId'};
        catalogManagerSvc.differencePageSize = 100;
        catalogManagerSvc.getDifference.and.returnValue($q.when({data: this.difference, headers: jasmine.createSpy('headers').and.returnValue(this.headers)}));
        this.sourceBranch = {'@id': 'sourceBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId1'}]};
        this.targetBranch = {'@id': 'targetBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId1'}]};
        this.sourceBranchNewHead = {'@id': 'sourceBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId2'}]};
        this.targetBranchNewHead = {'@id': 'targetBranchId', [prefixes.catalog + 'head']:[{'@id': 'headCommitId2'}]};
        mergeRequestsStateSvc.requestConfig.recordId = 'recordId';
        this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('requestBranchSelect');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        catalogManagerSvc = null;
        mergeRequestsStateSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('should initialize with the correct values for', function() {
        describe('difference if the source and target branches are', function() {
            describe('selected', function() {
                beforeEach(function () {
                    mergeRequestsStateSvc.requestConfig.sourceBranch = this.sourceBranch;
                    mergeRequestsStateSvc.requestConfig.targetBranch = this.targetBranch;
                    catalogManagerSvc.getRecordBranches.and.returnValue($q.when({data: [this.sourceBranch, this.targetBranch]}));
                });
                it('and both exist', function () {
                    this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
                    scope.$digest();
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigDifference).toHaveBeenCalled();
                });
                it('and neither exist', function () {
                    mergeRequestsStateSvc.updateRequestConfigBranch.and.callFake((branchType, branches) => {
                        mergeRequestsStateSvc.requestConfig[branchType] = undefined;
                    });
                    this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
                    scope.$digest();
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigDifference).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.requestConfig.sourceBranch).toBeUndefined();
                    expect(mergeRequestsStateSvc.requestConfig.targetBranch).toBeUndefined();
                });
                it('and source does not exist', function () {
                    mergeRequestsStateSvc.updateRequestConfigBranch.and.callFake((branchType, branches) => {
                        if (branchType === 'sourceBranch') {
                            mergeRequestsStateSvc.requestConfig[branchType] = undefined;
                        }
                    });
                    this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
                    scope.$digest();
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigDifference).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.requestConfig.sourceBranch).toBeUndefined();
                    expect(mergeRequestsStateSvc.requestConfig.targetBranch).toEqual(this.targetBranch);
                });
                it('and target does not exist', function () {
                    mergeRequestsStateSvc.updateRequestConfigBranch.and.callFake((branchType, branches) => {
                        if (branchType === 'targetBranch') {
                            mergeRequestsStateSvc.requestConfig[branchType] = undefined;
                        }
                    });
                    this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
                    scope.$digest();
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', [this.sourceBranch, this.targetBranch]);
                    expect(mergeRequestsStateSvc.updateRequestConfigDifference).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.requestConfig.sourceBranch).toEqual(this.sourceBranch);
                    expect(mergeRequestsStateSvc.requestConfig.targetBranch).toBeUndefined();
                });
            });
            it('not selected', function() {
                scope.$apply();
                expect(catalogManagerSvc.getDifference).not.toHaveBeenCalled();
            });
        });
        describe('branches', function() {
            it('successfully', function() {
                catalogManagerSvc.getRecordBranches.and.returnValue($q.when({data: [{}]}));
                this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
                scope.$digest();
                this.controller = this.element.controller('requestBranchSelect');
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith('recordId', 'catalogId');
                expect(this.controller.branches).toEqual([{}]);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('unless an error occurs', function() {
                catalogManagerSvc.getRecordBranches.and.returnValue($q.reject('Error Message'));
                this.element = $compile(angular.element('<request-branch-select></request-branch-select>'))(scope);
                scope.$digest();
                this.controller = this.element.controller('requestBranchSelect');
                expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith('recordId', 'catalogId');
                expect(this.controller.branches).toEqual([]);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });
    });
    describe('controller methods', function() {
        describe('should handle changing the target branch', function() {
            beforeEach(function() {
                this.branch = {'@id': 'target'};
                mergeRequestsStateSvc.requestConfig.difference = {};
            });
            describe('if one has been selected and source branch is', function() {
                it('set', function() {
                    mergeRequestsStateSvc.requestConfig.sourceBranch = {'@id': 'source'};
                    this.controller.changeTarget(this.branch);
                    expect(mergeRequestsStateSvc.updateRequestConfigDifference).toHaveBeenCalled();
                });
                it('not set', function() {
                    this.controller.changeTarget(this.branch);
                    expect(mergeRequestsStateSvc.requestConfig.targetBranch).toEqual(this.branch);
                    expect(mergeRequestsStateSvc.requestConfig.targetBranchId).toEqual('target');
                    expect(mergeRequestsStateSvc.updateRequestConfigDifference).not.toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
            });
            it('if one has not been selected', function() {
                this.controller.changeTarget();
                expect(mergeRequestsStateSvc.requestConfig.targetBranch).toBeUndefined();
                expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                expect(mergeRequestsStateSvc.updateRequestConfigDifference).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('should handle changing the source branch', function() {
            beforeEach(function() {
                this.branch = {'@id': 'source'}
                mergeRequestsStateSvc.requestConfig.difference = {};
            });
            describe('if one has been selected and target branch is', function() {
                it('set', function() {
                    mergeRequestsStateSvc.requestConfig.targetBranch = {'@id': 'target'};
                    this.controller.changeSource(this.branch);
                    expect(mergeRequestsStateSvc.updateRequestConfigDifference).toHaveBeenCalled();
                });
                it('not set', function() {
                    this.controller.changeSource(this.branch);
                    expect(mergeRequestsStateSvc.requestConfig.sourceBranch).toEqual(this.branch);
                    expect(mergeRequestsStateSvc.requestConfig.sourceBranchId).toEqual('source');
                    expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                    expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
                });
            });
            it('if one has not been selected', function() {
                this.controller.changeSource();
                expect(mergeRequestsStateSvc.requestConfig.sourceBranch).toBeUndefined();
                expect(mergeRequestsStateSvc.requestConfig.difference).toBeUndefined();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('REQUEST-BRANCH-SELECT');
            expect(this.element.querySelectorAll('.form-container').length).toEqual(1);
        });
        it('depending on whether there is a difference', function() {
            expect(this.element.find('commit-difference-tabset').length).toEqual(0);

            mergeRequestsStateSvc.requestConfig.difference = {};
            scope.$digest();
            expect(this.element.find('commit-difference-tabset').length).toEqual(1);
        });
        it('with .form-groups', function() {
            expect(this.element.querySelectorAll('.form-group').length).toEqual(3);
        });
        it('with branch-selects', function() {
            expect(this.element.find('branch-select').length).toEqual(2);
        });
    });
});
