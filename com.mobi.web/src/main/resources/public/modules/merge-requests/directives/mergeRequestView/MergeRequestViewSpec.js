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
describe('Merge Request View directive', function() {
    var $compile, scope, $q, mergeRequestsStateSvc, mergeRequestManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestView');
        mockMergeRequestsState();
        mockMergeRequestManager();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _mergeRequestsStateService_, _mergeRequestManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            mergeRequestManagerSvc = _mergeRequestManagerService_;
            utilSvc = _utilService_;
        });

        this.getDefer = $q.defer();
        mergeRequestManagerSvc.getRequest.and.returnValue(this.getDefer.promise);
        mergeRequestsStateSvc.open.selected = {request: {}};
        this.element = $compile(angular.element('<merge-request-view></merge-request-view>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestView');
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

    describe('should initialize correctly if getRequest', function() {
        it('resolves', function() {
            this.getDefer.resolve();
            scope.$apply();
            expect(utilSvc.createWarningToast).not.toHaveBeenCalled();
            expect(mergeRequestsStateSvc.open.selected).toBeDefined();
        });
        it('rejects', function() {
            this.getDefer.reject();
            scope.$apply();
            expect(utilSvc.createWarningToast).toHaveBeenCalled();
            expect(mergeRequestsStateSvc.open.selected).toBeUndefined();
        });
    });
    describe('controller methods', function() {
        it('should go back', function() {
            this.controller.back();
            expect(mergeRequestsStateSvc.open.selected).toBeUndefined();
        });
        it('show the delete overlay', function() {
            this.controller.showDelete();
            expect(mergeRequestsStateSvc.requestToDelete).toEqual(mergeRequestsStateSvc.open.selected);
            expect(mergeRequestsStateSvc.showDelete).toEqual(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('merge-request-view')).toEqual(true);
            expect(this.element.querySelectorAll('.main-details').length).toEqual(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toEqual(1);
        });
        it('with buttons to Delete and go Back', function() {
            var buttons = this.element.querySelectorAll('block-footer button');
            expect(buttons.length).toEqual(2);
            expect(['Delete', 'Back']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Delete', 'Back']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('depending on whether the merge request is accepted', function() {
            var indicator = angular.element(this.element.querySelectorAll('.open-indicator')[0]);
            expect(indicator.hasClass('label-primary')).toEqual(true);
            expect(indicator.hasClass('label-success')).toEqual(false);
            expect(indicator.text().trim()).toEqual('Open');
            expect(this.element.find('commit-difference-tabset').length).toEqual(1);

            mergeRequestManagerSvc.isAccepted.and.returnValue(true);
            scope.$digest();
            expect(indicator.hasClass('label-primary')).toEqual(false);
            expect(indicator.hasClass('label-success')).toEqual(true);
            expect(indicator.text().trim()).toEqual('Accepted');
            expect(this.element.find('commit-difference-tabset').length).toEqual(0);
        });
    });
    it('should call showDelete when the delete button is clicked', function() {
        spyOn(this.controller, 'showDelete');
        var button = angular.element(this.element.querySelectorAll('block-footer button.btn-danger')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDelete).toHaveBeenCalled();
    });
    it('should call back when the button is clicked', function() {
        spyOn(this.controller, 'back');
        var button = angular.element(this.element.querySelectorAll('block-footer button.btn-default')[0]);
        button.triggerHandler('click');
        expect(this.controller.back).toHaveBeenCalled();
    });
});
