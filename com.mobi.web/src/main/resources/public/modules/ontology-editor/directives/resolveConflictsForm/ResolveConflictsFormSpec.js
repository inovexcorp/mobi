/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 iNovex Information Systems, Inc.
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
describe('Resolve Conflicts Form directive', function() {
    var $compile, scope, util;

    beforeEach(function() {
        module('templates');
        module('resolveConflictsForm');
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            util = _utilService_;
        });

        this.branchId = 'branchId';
        this.branch = {'@id': this.branchId};
        this.targetId = 'targetId';

        scope.branchTitle = '';
        scope.targetTitle = '';
        scope.conflicts = [];
        scope.resolutions = [];
        this.element = $compile(angular.element('<resolve-conflicts-form branch-title="branchTitle" target-title="targetTitle" conflicts="conflicts" resolutions="resolutions"></resolve-conflicts-form>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('resolveConflictsForm');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        util = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('branchTitle is one way bound', function() {
            this.isolatedScope.branchTitle = 'test';
            scope.$digest();
            expect(scope.branchTitle).toEqual('');
        });
        it('targetTitle is one way bound', function() {
            this.isolatedScope.targetTitle = 'test';
            scope.$digest();
            expect(scope.targetTitle).toEqual('');
        });
    });
    describe('controller bound variable', function() {
        it('conflicts is one way bound', function() {
            this.controller.conflicts = [{}];
            scope.$digest();
            expect(scope.conflicts).toEqual([]);
        });
        it('resolutions is two way bound', function() {
            this.controller.resolutions = [{}];
            scope.$digest();
            expect(scope.resolutions).toEqual([{}]);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('resolve-conflicts-form')).toBe(true);
        });
        it('depending on how many conflicts there are', function() {
            scope.conflicts = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.conflict-list-item').length).toEqual(scope.conflicts.length);
        });
        it('depending on whether a conflict is resolved', function() {
            scope.conflicts = [{resolved: false}, {resolved: true}];
            scope.$digest();
            var conflictItems = _.map(_.toArray(this.element.querySelectorAll('.conflict-list-item')), angular.element);
            expect(conflictItems[0].hasClass('text-danger')).toEqual(true);
            expect(conflictItems[0].find('i').hasClass('fa-times')).toEqual(true);
            expect(conflictItems[1].hasClass('text-success')).toEqual(true);
            expect(conflictItems[1].find('i').hasClass('fa-check')).toEqual(true);
        });
        it('depending on whether a conflict is selected', function() {
            expect(this.element.querySelectorAll('.list-info').length).toEqual(1);
            expect(this.element.querySelectorAll('.conflict-container').length).toEqual(0);

            this.controller.index = 0;
            this.controller.selected = {};
            scope.$digest();
            expect(this.element.querySelectorAll('.list-info').length).toEqual(0);
            expect(this.element.querySelectorAll('.conflict-container').length).toEqual(1);
        });
        it('depending on whether the first conflict is selected', function() {
            this.controller.index = 0;
            this.controller.selected = {};
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-navigation-container .prev-button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.index = 1;
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
        it('depending on whether there is a next conflict', function() {
            this.controller.index = 0;
            this.controller.selected = {};
            spyOn(this.controller, 'hasNext').and.returnValue(true);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-navigation-container .next-button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.hasNext.and.returnValue(false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether a conflict is resolved with left or right', function() {
            this.controller.index = 0;
            this.controller.selected = {resolved: 'left'};
            scope.$digest();
            var left = angular.element(this.element.querySelectorAll('.conflict.left')[0]);
            var right = angular.element(this.element.querySelectorAll('.conflict.right')[0]);
            expect(left.hasClass('active')).toEqual(true);
            expect(left.hasClass('not-selected')).toEqual(false);
            expect(right.hasClass('active')).toEqual(false);
            expect(right.hasClass('not-selected')).toEqual(true);

            this.controller.selected = {resolved: 'right'};
            scope.$digest();
            expect(left.hasClass('active')).toEqual(false);
            expect(left.hasClass('not-selected')).toEqual(true);
            expect(right.hasClass('active')).toEqual(true);
            expect(right.hasClass('not-selected')).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should select a conflict', function() {
            this.controller.conflicts = [{}];
            this.controller.select(0);
            expect(this.controller.index).toEqual(0);
            expect(this.controller.selected).toEqual({});
        });
        it('should determine whether there is another conflict after the selected', function() {
            expect(this.controller.hasNext()).toEqual(false);

            this.controller.index = 0;
            this.controller.conflicts = [{}, {}];
            expect(this.controller.hasNext()).toEqual(true);

            this.controller.index = 1;
            expect(this.controller.hasNext()).toEqual(false);
        });
        it('should go back to the list of conflicts', function() {
            this.controller.index = 0;
            this.controller.selected = {};
            this.controller.backToList();
            expect(this.controller.index).toBeUndefined();
            expect(this.controller.selected).toBeUndefined();
        });
    });
    it('should select a conflict to resolve when clicked', function() {
        scope.conflicts = [{}];
        scope.$digest();
        spyOn(this.controller, 'select');
        var span = angular.element(this.element.querySelectorAll('.conflict-list-item span')[0]);
        span.triggerHandler('click');
        expect(this.controller.select).toHaveBeenCalledWith(0);
    });
    it('should navigate back to the list when the link is clicked', function() {
        this.controller.index = 0;
        this.controller.selected = {};
        scope.$digest();
        spyOn(this.controller, 'backToList');
        var button = angular.element(this.element.querySelectorAll('.btn.btn-link')[0]);
        button.triggerHandler('click');
        expect(this.controller.backToList).toHaveBeenCalled();
    });
    it('should go to previous conflict when the button is clicked', function() {
        this.controller.index = 1;
        this.controller.selected = {};
        scope.$digest();
        spyOn(this.controller, 'select');
        var button = angular.element(this.element.querySelectorAll('.btn-navigation-container .prev-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.select).toHaveBeenCalledWith(0);
    });
    it('should go to next conflict when the button is clicked', function() {
        this.controller.index = 0;
        this.controller.selected = {};
        scope.$digest();
        spyOn(this.controller, 'select');
        var button = angular.element(this.element.querySelectorAll('.btn-navigation-container .next-button')[0]);
        button.triggerHandler('click');
        expect(this.controller.select).toHaveBeenCalledWith(1);
    });
    it('should set the resolution when a side is clicked', function() {
        this.controller.index = 0;
        this.controller.selected = {resolved: ''};
        scope.$digest();
        var left = angular.element(this.element.querySelectorAll('.conflict.left')[0]);
        var right = angular.element(this.element.querySelectorAll('.conflict.right')[0]);
        left.triggerHandler('click');
        expect(this.controller.selected.resolved).toEqual('left');
        right.triggerHandler('click');
        expect(this.controller.selected.resolved).toEqual('right');
    });
});