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
describe('Merge Request List directive', function() {
    var $compile, scope, mergeRequestsStateSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('mergeRequestList');
        mockMergeRequestsState();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _mergeRequestsStateService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            mergeRequestsStateSvc = _mergeRequestsStateService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<merge-request-list></merge-request-list>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('mergeRequestList');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        mergeRequestsStateSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('should initialize correctly', function() {
        it('calling setRequests', function() {
            expect(mergeRequestsStateSvc.setRequests).toHaveBeenCalledWith(mergeRequestsStateSvc.acceptedFilter);
        });
    });
    describe('controller methods', function() {
        it('should show the delete confirmation overlay', function() {
            var event = scope.$emit('click');
            spyOn(event, 'stopPropagation');
            this.controller.showDeleteOverlay({}, event);
            expect(event.stopPropagation).toHaveBeenCalled();
            expect(modalSvc.openConfirmModal).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('merge-request-list')).toEqual(true);
            expect(this.element.querySelectorAll('.search-container').length).toEqual(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('depending on how many merge requests there are', function() {
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.request').length).toEqual(0);

            mergeRequestsStateSvc.requests = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.request').length).toEqual(mergeRequestsStateSvc.requests.length);
        });
        it('depending on how many assignees are on a request', function() {
            mergeRequestsStateSvc.requests = [{assignees: ['user1', 'user2']}];
            scope.$digest();
            expect(this.element.querySelectorAll('.request .assignees li').length).toEqual(2);
        });
    });
    it('should set the correct state when a request is clicked', function() {
        mergeRequestsStateSvc.requests = [{}];
        scope.$digest();

        var request = angular.element(this.element.querySelectorAll('.request')[0]);
        request.triggerHandler('click');
        expect(mergeRequestsStateSvc.selected).toEqual({});
    });
    it('should call showDeleteOverlay when the delete link is clicked', function() {
        mergeRequestsStateSvc.requests = [{}];
        scope.$digest();
        spyOn(this.controller, 'showDeleteOverlay');

        var link = angular.element(this.element.querySelectorAll('.request a')[0]);
        link.triggerHandler('click');
        expect(this.controller.showDeleteOverlay).toHaveBeenCalled();
    });
    it('should call startCreate when the Create Request button is clicked', function() {
        var button = angular.element(this.element.querySelectorAll('.search-container button')[0]);
        button.triggerHandler('click');
        expect(mergeRequestsStateSvc.startCreate).toHaveBeenCalled();
    });
});
