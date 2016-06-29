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
describe('Custom Button directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('customButton');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.type = '';
            scope.isDisabledWhen = false;
            scope.pull = '';
            scope.onClick = jasmine.createSpy('onClick');

            this.element = $compile(angular.element('<custom-button type="type" is-disabled-when="isDisabledWhen" pull="pull" on-click="onClick()"></custom-button>'))(scope);
            scope.$digest();
        });
        it('type should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.type = 'secondary';
            scope.$digest();
            expect(scope.type).toEqual('secondary');
        });
        it('isDisabledWhen should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(true);
        });
        it('pull should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.pull = 'left';
            scope.$digest();
            expect(scope.pull).toEqual('left');
        });
        it('onClick should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onClick();

            expect(scope.onClick).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            scope.onClick = jasmine.createSpy('onClick');

            this.element = $compile(angular.element('<custom-button type="type" is-disabled-when="isDisabledWhen" pull="pull" on-click="onClick()"></custom-button>'))(scope);
            scope.$digest();
            this.firstChild = angular.element(this.element.children()[0]);
        });
        it('for wrapping containers', function() {
            expect(this.firstChild.hasClass('btn')).toBe(true);
        });
        it('based on isDisabledWhen', function() {
            scope.isDisabledWhen = true;
            scope.$digest();
            expect(this.firstChild.prop('disabled')).toBe(true);
        });
        it('with the correct defaults for pull and type', function() {
            var isolatedScope = this.element.isolateScope();
            expect(isolatedScope.type).toBe('primary');
            expect(isolatedScope.pull).toBe('right');
        });
        it('with the correct classes based on pull', function() {
            scope.pull = 'right';
            scope.$digest();
            expect(this.firstChild.hasClass('pull-right')).toBe(true);
            expect(this.firstChild.hasClass('pull-left')).toBe(false);

            scope.pull = 'left';
            scope.$digest();
            expect(this.firstChild.hasClass('pull-right')).toBe(false);
            expect(this.firstChild.hasClass('pull-left')).toBe(true);
        });
        it('with the correct classes based on type', function() {
            scope.type = 'primary';
            scope.$digest();
            expect(this.firstChild.hasClass('btn-primary')).toBe(true);
            expect(this.firstChild.hasClass('btn-default')).toBe(false);

            scope.type = 'secondary';
            scope.$digest();
            expect(this.firstChild.hasClass('btn-primary')).toBe(false);
            expect(this.firstChild.hasClass('btn-default')).toBe(true);
        });
    });
    it('should call onClick when the button is clicked', function() {
        scope.onClick = jasmine.createSpy('onClick');
        var element = $compile(angular.element('<custom-button type="type" is-disabled-when="isDisabledWhen" pull="pull" on-click="onClick()"></custom-button>'))(scope);
        scope.$digest();
        var firstChild = angular.element(element.children()[0]);
        firstChild.triggerHandler('click');

        expect(scope.onClick).toHaveBeenCalled();
    });
});