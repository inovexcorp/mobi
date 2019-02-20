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
describe('Branch Select directive', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        injectBranchesToDisplayFilter();
        injectTrustedFilter();
        injectHighlightFilter();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });

        scope.ngModel = undefined;
        scope.branches = [];
        scope.required = true;
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<branch-select ng-model="ngModel" branches="branches" is-disabled-when="isDisabledWhen" required="required" change-event="changeEvent()"></branch-select>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('branchSelect');
    });

    afterEach(function() {
        $compile = null;
        $timeout = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('branches should be one way bound', function() {
            this.isolatedScope.branches = [{}];
            scope.$digest();
            expect(scope.branches).toEqual([]);
        });
        it('required should be one way bound', function() {
            this.isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toEqual(true);
        });
        it('isDisabledWhen should be one way bound', function() {
            this.isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            this.isolatedScope.changeEvent();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            this.controller.bindModel = {};
            scope.$digest();
            expect(scope.ngModel).toEqual({});
        });
    });
    describe('controller methods', function() {
        it('should call changeEvent', function() {
            this.controller.onChange();
            $timeout.flush();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('branch-select')).toBe(true);
            expect(this.element.hasClass('form-group')).toBe(true);
        })
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
});