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
describe('Radio Button component', function() {
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
        scope.value = 0;
        scope.displayText = '';
        scope.isDisabled = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.inline = false;
        this.element = $compile(angular.element('<radio-button bind-model="ngModel" value="value" display-text="displayText" is-disabled="isDisabled" change-event="changeEvent(value)" inline="inline"></radio-button>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('radioButton');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = true;
            scope.$digest();
            expect(scope.bindModel).toEqual(false);
        });
        it('value should be one way bound', function() {
            this.controller.value = 1;
            scope.$digest();
            expect(scope.value).toEqual(0);
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
        it('inline should be one way bound', function() {
            this.controller.inline = true;
            scope.$digest();
            expect(scope.inline).toEqual(false);
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('RADIO-BUTTON');
            expect(this.element.querySelectorAll('.radio-button').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-check').length).toEqual(1);
        });
        it('with a radio input', function() {
            expect(this.element.querySelectorAll('input[type="radio"]').length).toEqual(1);
        });
        it('with a .form-check-label', function() {
            expect(this.element.querySelectorAll('.form-check-label').length).toEqual(1);
        });
        it('depending on whether it should be inline', function() {
            expect(this.element.querySelectorAll('.form-check-inline').length).toEqual(0);
            scope.inline = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.form-check-inline').length).toEqual(1);
        });
        it('depending on whether it is disabled', function() {
            var container = angular.element(this.element.querySelectorAll('.radio-button')[0]);
            var radio = this.element.find('input');
            expect(container.hasClass('disabled')).toEqual(false);
            expect(radio.attr('disabled')).toBeFalsy();

            scope.isDisabled = true;
            scope.$digest();
            expect(container.hasClass('disabled')).toEqual(true);
            expect(radio.attr('disabled')).toBeTruthy();
        });
    });
    it('calls changeEvent if value of radio button is changed', function() {
        spyOn(this.controller, 'onChange');
        this.element.find('input')[0].click();
        $timeout.flush();
        expect(this.controller.onChange).toHaveBeenCalled();
    });
});