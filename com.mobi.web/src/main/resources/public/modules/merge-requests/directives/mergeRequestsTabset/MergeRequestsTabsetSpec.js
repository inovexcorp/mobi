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
describe('Merge Requests Tabset directive', function() {
    var $compile, scope, $q, mergeRequestsStateSvc, mergeRequestManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestsTabset');
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_, _mergeRequestManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
        });

        mergeRequestsStateSvc.getCurrentTab.and.returnValue(mergeRequestsStateSvc.open);
        this.element = $compile(angular.element('<merge-requests-tabset></merge-requests-tabset>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestsTabset');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        mergeRequestsStateSvc = null;
        mergeRequestManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('cancel a deletion', function() {
            mergeRequestsStateSvc.requestToDelete = {};
            mergeRequestsStateSvc.showDelete = true;
            this.controller.errorMessage = 'test';
            this.controller.cancelDelete();
            expect(mergeRequestsStateSvc.requestToDelete).toBeUndefined();
            expect(mergeRequestsStateSvc.showDelete).toEqual(false);
            expect(this.controller.errorMessage).toEqual('');
        });
        describe('delete a merge request', function() {
            beforeEach(function() {
                mergeRequestsStateSvc.requestToDelete = {request: {'@id': 'request'}};
                mergeRequestsStateSvc.open.selected = mergeRequestsStateSvc.requestToDelete;
                spyOn(this.controller, 'cancelDelete');
            });
            it('unless an error occurs', function() {
                mergeRequestManagerSvc.deleteRequest.and.returnValue($q.reject('Error Message'));
                this.controller.deleteRequest();
                scope.$apply();
                expect(mergeRequestsStateSvc.getCurrentTab).toHaveBeenCalled();
                expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                expect(mergeRequestsStateSvc.open.selected).toEqual({request: {'@id': 'request'}});
                expect(utilSvc.createSuccessToast).not.toHaveBeenCalled();
                expect(this.controller.cancelDelete).not.toHaveBeenCalled();
                expect(mergeRequestsStateSvc.setRequests).not.toHaveBeenCalled();
                expect(this.controller.errorMessage).toEqual('Error Message');
            });
            describe('successfully', function() {
                beforeEach(function() {
                    mergeRequestManagerSvc.deleteRequest.and.returnValue($q.when());
                });
                it('with a selected request', function() {
                    this.controller.deleteRequest();
                    scope.$apply();
                    expect(mergeRequestsStateSvc.getCurrentTab).toHaveBeenCalled();
                    expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                    expect(mergeRequestsStateSvc.open.selected).toBeUndefined();
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(this.controller.cancelDelete).toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.setRequests).not.toHaveBeenCalled();
                    expect(this.controller.errorMessage).toEqual('');
                });
                it('without a selected request', function() {
                    mergeRequestsStateSvc.open.selected = undefined;
                    this.controller.deleteRequest();
                    scope.$apply();
                    expect(mergeRequestsStateSvc.getCurrentTab).toHaveBeenCalled();
                    expect(mergeRequestManagerSvc.deleteRequest).toHaveBeenCalledWith('request');
                    expect(mergeRequestsStateSvc.open.selected).toBeUndefined();
                    expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                    expect(this.controller.cancelDelete).toHaveBeenCalled();
                    expect(mergeRequestsStateSvc.setRequests).toHaveBeenCalledWith(false);
                    expect(this.controller.errorMessage).toEqual('');
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('merge-requests-tabset')).toBe(true);
        });
        it('with a tabset', function() {
            expect(this.element.find('tabset').length).toBe(1);
        });
        it('with a tab', function() {
            expect(this.element.find('tab').length).toBe(1);
        });
        it('with a open-tab', function() {
            expect(this.element.find('open-tab').length).toBe(1);
        });
        it('depending on whether a request is being deleted', function() {
            expect(this.element.find('confirmation-overlay').length).toBe(0);

            mergeRequestsStateSvc.showDelete = true;
            scope.$digest();
            expect(this.element.find('confirmation-overlay').length).toBe(1);
        });
    });
});