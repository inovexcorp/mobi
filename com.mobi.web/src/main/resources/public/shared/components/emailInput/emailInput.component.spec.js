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
describe('Email Input component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('shared');
        mockComponent('shared', 'customLabel');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.mutedText = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.required = true;
        scope.inputName = '';
        scope.isInvalid = false;
        scope.isValid = false;
        this.element = $compile(angular.element('<email-input ng-model="bindModel" change-event="changeEvent(value)" muted-text="mutedText" required="required" input-name="inputName" is-invalid="isInvalid" is-valid="isValid"></email-input>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('emailInput');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
        it('mutedText should be one way bound', function() {
            this.controller.mutedText = 'Test';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
        it('required should be one way bound', function() {
            this.controller.required = false;
            scope.$digest();
            expect(scope.required).toEqual(true);
        });
        it('inputName should be one way bound', function() {
            this.controller.inputName = 'Test';
            scope.$digest();
            expect(scope.inputName).toEqual('');
        });
        it('isInvalid should be one way bound', function() {
            this.controller.isInvalid = true;
            scope.$digest();
            expect(scope.isInvalid).toEqual(false);
        });
        it('isValid should be one way bound', function() {
            this.controller.isValid = true;
            scope.$digest();
            expect(scope.isValid).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('EMAIL-INPUT');
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toEqual(1);
        });
        it('with a input element for text', function() {
            expect(this.element.querySelectorAll('input[type="text"]').length).toEqual(1);
        });
        it('depending on whether it is required or not', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.attr('required')).toBeTruthy();

            scope.required = false;
            scope.$digest();
            expect(input.attr('required')).toBeFalsy();
        });
        it('depending on whether the text input is a valid email', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            var invalidInputs = ['abc', '$', '/', '#', '=', '-', '_', '+', 'example@', '@example.com', 'example@.'];
            _.forEach(invalidInputs, value => {
                this.controller.bindModel = value;
                scope.$digest();
                expect(input.hasClass('ng-invalid-pattern')).toEqual(true);
            });

            var validInputs = ['example@example.com', 'example@co', 'example-@example.com', 'example_@example.com', 'example+@example.com'];
            _.forEach(validInputs, value => {
                this.controller.bindModel = value;
                scope.$digest();
                expect(input.hasClass('ng-invalid-pattern')).toEqual(false);
            });
        });
        it('depending on whether it is invalid', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.hasClass('is-invalid')).toEqual(false);

            scope.isInvalid = true;
            scope.$digest();
            expect(input.hasClass('is-invalid')).toEqual(true);
        });
        it('depending on whether it is valid', function() {
            var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
            expect(input.hasClass('is-valid')).toEqual(false);

            scope.isValid = true;
            scope.$digest();
            expect(input.hasClass('is-valid')).toEqual(true);
        });
    });
    it('should call changeEvent when the text in the input changes', function() {
        var input = angular.element(this.element.querySelectorAll('input[type="text"]')[0]);
        input.val('test@test.com').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalledWith('mailto:test@test.com');
    });
});