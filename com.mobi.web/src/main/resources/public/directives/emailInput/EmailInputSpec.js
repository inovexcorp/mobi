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
describe('Email Input directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('emailInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.bindModel = '';
            scope.mutedText = '';
            scope.changeEvent = jasmine.createSpy('changeEvent');
            scope.required = true;
            scope.inputName = '';

            this.element = $compile(angular.element('<email-input ng-model="bindModel" change-event="changeEvent()" muted-text="mutedText" required="required" input-name="inputName"></email-input>'))(scope);
            scope.$digest();
        });
        it('bindModel should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('Test');
        });
        it('changeEvent should be called in parent scope when invoked', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.changeEvent();

            expect(scope.changeEvent).toHaveBeenCalled();
        });
        it('mutedText should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.mutedText = 'Test';
            scope.$digest();
            expect(scope.mutedText).toBe('');
        });
        it('required should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.required = false;
            scope.$digest();
            expect(scope.required).toBe(true);
        });
        it('inputName should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.inputName = 'Test';
            scope.$digest();
            expect(scope.inputName).toBe('');
        });
    });
    describe('contains the correct html', function() {
        beforeEach(function() {
            scope.bindModel = '';
            scope.changeEvent = jasmine.createSpy('changeEvent');
            scope.mutedText = '';
            scope.required = false;
            scope.inputName = '';

            this.element = $compile(angular.element('<email-input ng-model="bindModel" change-event="changeEvent()" muted-text="mutedText" required="required" input-name="inputName"></email-input>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('form-group')).toBe(true);
        });
        it('with a custom label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a input element for text', function() {
            expect(this.element.querySelectorAll('input[type="text"]').length).toBe(1);
        });
        it('depending on whether it is required or not', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.attr('required')).toBeFalsy();

            scope.required = true;
            scope.$digest();
            expect(input.attr('required')).toBeTruthy();
        });
        it('depending on whether the text input is a valid email', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            var invalidInputs = ['abc', '$', '/', '#', '=', '-', '_', '+', 'example@', '@example.com', 'example@.'];
            _.forEach(invalidInputs, function(value) {
                scope.bindModel = value;
                scope.$digest();
                expect(input.hasClass('ng-invalid-pattern')).toBe(true);
            });

            var validInputs = ['example@example.com', 'example@co', 'example-@example.com', 'example_@example.com', 'example+@example.com'];
            _.forEach(validInputs, function(value) {
                scope.bindModel = value;
                scope.$digest();
                expect(input.hasClass('ng-invalid-pattern')).toBe(false);
            });
        });
    });
    it('should call changeEvent when the text in the input changes', function() {
        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        var element = $compile(angular.element('<email-input ng-model="bindModel" change-event="changeEvent()" muted-text="mutedText" required="required" input-name="inputName"></email-input>'))(scope);
        scope.$digest();

        var input = angular.element(element.querySelectorAll('input[type="text"]')[0]);
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalled();
    });
});