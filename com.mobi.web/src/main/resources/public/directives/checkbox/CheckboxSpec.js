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
describe('Checkbox directive', function() {
    var $compile,
        $timeout,
        scope;

    beforeEach(function() {
        module('templates');
        module('checkbox');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.ngModel = false;
            scope.displayText = '';
            scope.isDisabledWhen = false;
            scope.changeEvent = jasmine.createSpy('changeEvent');
            this.element = $compile(angular.element('<checkbox ng-model="ngModel" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()"></checkbox>'))(scope);
            scope.$digest();
        });
        it('bindModel should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.bindModel = true;
            scope.$digest();
            expect(scope.ngModel).toEqual(true);
        });
        it('displayText should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.displayText = 'abc';
            scope.$digest();
            expect(scope.displayText).toEqual('abc');
        });
        it('isDisabledWhen should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(true);
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.changeEvent();

            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        it('should call changeEvent', function() {
            scope.changeEvent = jasmine.createSpy('changeEvent');
            scope.ngModel = false;
            var element = $compile(angular.element('<checkbox ng-model="ngModel" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()"></checkbox>'))(scope);
            scope.$digest();
            var controller = element.controller('checkbox');
            controller.onChange();
            $timeout.flush();
            expect(scope.changeEvent).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.ngModel = false;
            scope.displayText = '';
            scope.isDisabledWhen = false;
            this.element = $compile(angular.element('<checkbox ng-model="ngModel" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()"></checkbox>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('checkbox')).toBe(true);
            expect(this.element.querySelectorAll('.control-label').length).toBe(1);
        })
        it('with a checkbox input', function() {
            expect(this.element.querySelectorAll('input[type="checkbox"]').length).toBe(1);
        });
        it('depending on whether it should be disabled', function() {
            var checkbox = angular.element(this.element.querySelectorAll('input[type="checkbox"]')[0]);
            expect(this.element.hasClass('disabled')).toBe(false);
            expect(checkbox.attr('disabled')).toBeFalsy();

            scope.isDisabledWhen = true;
            scope.$digest();
            expect(this.element.hasClass('disabled')).toBe(true);
            expect(checkbox.attr('disabled')).toBeTruthy();
        });
    });
    it('calls changeEvent if value of checkbox is changed', function() {
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.ngModel = false;
        var element = $compile(angular.element('<checkbox ng-model="ngModel" display-text="displayText" is-disabled-when="isDisabledWhen" change-event="changeEvent()"></checkbox>'))(scope);
        scope.$digest();
        var controller = element.controller('checkbox');
        spyOn(controller, 'onChange');

        element.find('input')[0].click();
        scope.$digest();
        expect(controller.onChange).toHaveBeenCalled();
    });
});