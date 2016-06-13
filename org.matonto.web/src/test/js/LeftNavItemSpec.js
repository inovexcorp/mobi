/*-
 * #%L
 * org.matonto.web
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
describe('Left Nav Item directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('leftNavItem');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('directives/leftNavItem/leftNavItem.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.onClick = jasmine.createSpy('onClick');
            scope.isActiveWhen = false;
            scope.isDisabledWhen = false;
            scope.navTitle = 'scope title';

            this.element = $compile(angular.element('<left-nav-item is-active-when="isActiveWhen" is-disabled-when="isDisabledWhen" nav-title="navTitle" on-click="onClick()"></left-nav-item>'))(scope);
            scope.$digest();
        });

        it('isActiveWhen and isDisabledWhen should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isActiveWhen = true;
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isActiveWhen).toEqual(true);
            expect(scope.isDisabledWhen).toEqual(true);
        });
        it('navTitle should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.navTitle = 'isolated title';
            scope.$digest();
            expect(scope.navTitle).toEqual('scope title');
        });
        it('onClick should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClick();

            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a <li>', function() {
            var element = $compile(angular.element('<left-nav-item is-active-when="isActiveWhen" is-disabled-when="isDisabledWhen" nav-title="navTitle" on-click="onClick()"></left-nav-item>'))(scope);
            scope.$digest();

            expect(element.prop('tagName')).toBe('LI');
        });
        it('based on button', function() {
            var element = $compile(angular.element('<left-nav-item is-active-when="isActiveWhen" is-disabled-when="isDisabledWhen" nav-title="navTitle" on-click="onClick()"></left-nav-item>'))(scope);
            scope.$digest();

            var buttonList = element.querySelectorAll('button');
            expect(buttonList.length).toBe(1);
        });
        it('based on span', function() {
            var element = $compile(angular.element('<left-nav-item is-active-when="isActiveWhen" is-disabled-when="isDisabledWhen" nav-title="navTitle" on-click="onClick()"></left-nav-item>'))(scope);
            scope.$digest();

            var spanList = element.querySelectorAll('span');
            expect(spanList.length).toBe(1);
        });
    });
    it('sets active class if isActiveWhen is true', function() {
        scope.isActiveWhen = false;
        var element = $compile(angular.element('<left-nav-item is-active-when="isActiveWhen" is-disabled-when="isDisabledWhen" nav-title="navTitle" on-click="onClick()"></left-nav-item>'))(scope);
        scope.$digest();

        var activeList = element.querySelectorAll('.active');
        expect(activeList.length).toBe(0);

        scope.isActiveWhen = true;
        scope.$digest();

        activeList = element.querySelectorAll('.active');
        expect(activeList.length).toBe(1);
    });
    it('calls onClick if button is clicked', function() {
        scope.onClick = jasmine.createSpy('onClick');
        var element = $compile(angular.element('<left-nav-item is-active-when="isActiveWhen" is-disabled-when="isDisabledWhen" nav-title="navTitle" on-click="onClick()"></left-nav-item>'))(scope);
        scope.$digest();

        angular.element(element.querySelectorAll('button')[0]).triggerHandler('click');
        scope.$digest();
        expect(scope.onClick).toHaveBeenCalled();
    });
});