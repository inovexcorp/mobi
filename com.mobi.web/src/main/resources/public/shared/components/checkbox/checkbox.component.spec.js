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
describe('Checkbox component', function() {
    var $compile, $timeout, scope;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            $timeout = _$timeout_;
            scope = _$rootScope_;
        });

        scope.bindModel = false;
        scope.displayText = '';
        scope.isDisabled = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<checkbox bind-model="ngModel" display-text="displayText" is-disabled="isDisabled" change-event="changeEvent(value)"></checkbox>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('checkbox');
    });

    afterEach(function() {
        $compile = null;
        $timeout = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = true;
            scope.$digest();
            expect(scope.bindModel).toEqual(false);
        });
        it('displayText should be one way bound', function() {
            this.controller.displayText = 'abc';
            scope.$digest();
            expect(scope.displayText).toEqual('');
        });
        it('isDisabled should be one way bound', function() {
            this.controller.isDisabled = true;
            scope.$digest();
            expect(scope.isDisabled).toEqual(false);
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: true});
            expect(scope.changeEvent).toHaveBeenCalledWith(true);
        });
    });
    describe('controller methods', function() {
        it('should call changeEvent', function() {
            this.controller.onChange();
            $timeout.flush();
            expect(scope.changeEvent).toHaveBeenCalledWith(this.controller.bindModel);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('CHECKBOX');
            expect(this.element.querySelectorAll('.checkbox').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-check').length).toEqual(1);
        });
        it('with a checkbox input', function() {
            expect(this.element.querySelectorAll('input[type="checkbox"]').length).toEqual(1);
        });
        it('with a .form-check-label', function() {
            expect(this.element.querySelectorAll('.form-check-label').length).toEqual(1);
        });
        it('depending on whether it should be disabled', function() {
            var container = angular.element(this.element.querySelectorAll('.checkbox')[0]);
            var checkbox = angular.element(this.element.querySelectorAll('input[type="checkbox"]')[0]);
            expect(container.hasClass('disabled')).toEqual(false);
            expect(checkbox.attr('disabled')).toBeFalsy();

            scope.isDisabled = true;
            scope.$digest();
            expect(container.hasClass('disabled')).toEqual(true);
            expect(checkbox.attr('disabled')).toBeTruthy();
        });
    });
    it('calls onChange if the value of checkbox is changed', function() {
        spyOn(this.controller, 'onChange');
        var input = this.element.find('input');
        input.prop('checked', !input.prop('checked'));
        input.triggerHandler('click');
        scope.$digest();
        expect(this.controller.onChange).toHaveBeenCalled();
    });
});