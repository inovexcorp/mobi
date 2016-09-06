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
            scope.isDisabledWhen = false;
            scope.onClick = jasmine.createSpy('onClick');

            this.element = $compile(angular.element('<custom-button is-disabled-when="isDisabledWhen" on-click="onClick()"></custom-button>'))(scope);
            scope.$digest();
        });
        it('isDisabledWhen should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(true);
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

            this.element = $compile(angular.element('<custom-button is-disabled-when="isDisabledWhen" on-click="onClick()"></custom-button>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('btn')).toBe(true);
        });
        it('based on isDisabledWhen', function() {
            scope.isDisabledWhen = true;
            scope.$digest();
            expect(this.element.prop('disabled')).toBe(true);
        });
    });
    it('should call onClick when the button is clicked', function() {
        scope.onClick = jasmine.createSpy('onClick');
        var element = $compile(angular.element('<custom-button type="type" is-disabled-when="isDisabledWhen" pull="pull" on-click="onClick()"></custom-button>'))(scope);
        scope.$digest();
        element.triggerHandler('click');

        expect(scope.onClick).toHaveBeenCalled();
    });
});