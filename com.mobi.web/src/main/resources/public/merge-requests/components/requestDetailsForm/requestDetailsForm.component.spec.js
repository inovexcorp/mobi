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
    mockMergeRequestsState,
    mockUtil,
    mockPrefixes,
    mockUserManager,
    injectTrustedFilter,
    injectHighlightFilter, mockCatalogManager
} from '../../../../../../test/js/Shared';

describe('Request Details Form component', function() {
    var $compile, scope, $q, mergeRequestsStateSvc, catalogManagerSvc, utilSvc;

    beforeEach(function() {
        angular.mock.module('merge-requests');
        mockMergeRequestsState();
        mockCatalogManager();
        mockUtil();
        mockPrefixes();
        mockUserManager();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_, _catalogManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            catalogManagerSvc = _catalogManagerService_;
            utilSvc = _utilService_;
        });

        utilSvc.getDctermsValue.and.callFake((obj, prop) => prop);
        catalogManagerSvc.getRecordBranches.and.returnValue($q.when({data: [{}, {}]}));
        this.element = $compile(angular.element('<request-details-form></request-details-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('requestDetailsForm');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        catalogManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('should initialize with the correct values', function() {
        describe('and getRecordBranches', function() {
            it('resolves and branches are set', function() {
                mergeRequestsStateSvc.requestConfig.sourceBranch = {};
                mergeRequestsStateSvc.requestConfig.targetBranch = {};
                mergeRequestsStateSvc.createRequestStep = 2;
                this.element = $compile(angular.element('<request-details-form></request-details-form>'))(scope);
                scope.$digest();
                expect(mergeRequestsStateSvc.requestConfig.title).toEqual('title');
                expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', [{}, {}]);
                expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', [{}, {}]);
                expect(mergeRequestsStateSvc.updateRequestConfigDifference).toHaveBeenCalled();
                expect(mergeRequestsStateSvc.createRequestStep).toEqual(2);
            });
            it('resolves and a branch is not set', function() {
                mergeRequestsStateSvc.requestConfig.sourceBranch = {};
                mergeRequestsStateSvc.requestConfig.targetBranch = undefined;
                mergeRequestsStateSvc.createRequestStep = 2;
                this.element = $compile(angular.element('<request-details-form></request-details-form>'))(scope);
                scope.$digest();
                expect(mergeRequestsStateSvc.requestConfig.title).toEqual('title');
                expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('sourceBranch', [{}, {}]);
                expect(mergeRequestsStateSvc.updateRequestConfigBranch).toHaveBeenCalledWith('targetBranch', [{}, {}]);
                expect(mergeRequestsStateSvc.updateRequestConfigDifference).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.createRequestStep).toEqual(1);
                expect(mergeRequestsStateSvc.difference).toBeUndefined();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Branch was deleted');
            });
            it('rejects', function() {
                catalogManagerSvc.getRecordBranches.and.returnValue($q.reject('Error Message'));
                this.element = $compile(angular.element('<request-details-form></request-details-form>'))(scope);
                scope.$digest();
                expect(mergeRequestsStateSvc.requestConfig.title).toEqual('title');
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error Message');
            });
        });

    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('REQUEST-DETAILS-FORM');
            expect(this.element.querySelectorAll('.details-form-container').length).toEqual(1);
            expect(this.element.querySelectorAll('.summary-line').length).toEqual(1);
        });
        it('with a commit-difference-tabset', function() {
            expect(this.element.find('commit-difference-tabset').length).toEqual(1);
        });
        it('with a text-input', function() {
            expect(this.element.find('text-input').length).toEqual(1);
        });
        it('with a text-area', function() {
            expect(this.element.find('text-area').length).toEqual(1);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toEqual(1);
        });
        it('with a checkbox', function() {
            expect(this.element.find('checkbox').length).toEqual(1);
        });
    });
});
