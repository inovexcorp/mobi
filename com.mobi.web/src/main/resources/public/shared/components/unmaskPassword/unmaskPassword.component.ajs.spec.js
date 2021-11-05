/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2021 iNovex Information Systems, Inc.
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
import {mockComponent} from "../../../../../../test/js/Shared";

describe('Unmask Password component', function() {
    var $compile, scope;

    beforeEach(function() {
        angular.mock.module('shared');
        mockComponent('shared', 'customLabel');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.password = '';
        scope.inputName = 'test';
        scope.required = '';
        scope.label = '';
        scope.isDisabledWhen = false;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        var form = $compile('<form></form>')(scope);
        this.element = angular.element('<unmask-password-ajs password="password" change-event="changeEvent(value)" label="label" input-name="inputName" required="required" is-disabled-when="isDisabledWhen"></unmask-password-ajs>');
        form.append(this.element);
        this.element = $compile(this.element)(scope);
        scope.$digest();
        this.controller = this.element.controller('unmaskPasswordAjs');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('password should be one way bound', function() {
            this.controller.password = 'test';
            scope.$digest();
            expect(scope.password).toEqual('');
        });
        it('label should be one way bound', function() {
            this.controller.label = 'test';
            scope.$digest();
            expect(scope.label).toEqual('');
        });
        it('inputName should be one way bound', function() {
            this.controller.inputName = 'WOW';
            scope.$digest();
            expect(scope.inputName).toEqual('test');
        });
        it('required should be one way bound', function() {
            this.controller.required = undefined;
            scope.$digest();
            expect(scope.required).toEqual('');
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
        it('isDisabledWhen should be one way bound', function() {
            this.controller.isDisabledWhen = true;
            scope.$digest();
            expect(scope.isDisabledWhen).toEqual(false);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('UNMASK-PASSWORD-AJS');
            expect(this.element.querySelectorAll('.unmask-password').length).toEqual(1);
            expect(this.element.querySelectorAll('.form-group').length).toEqual(1);
        });
        // it('with the correct classes based on the password field validity', function() {
        //     var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
        //     expect(passwordInput.hasClass('is-invalid')).toEqual(false);

        //     this.controller.form.password.$setDirty();
        //     this.controller.isRequired = true;
        //     scope.$digest();
        //     expect(passwordInput.hasClass('is-invalid')).toEqual(true);
        // });
        // it('with the correct classes based on the confirm password field validity', function() {
        //     var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
        //     var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
        //     expect(passwordInput.hasClass('is-invalid')).toEqual(false);
        //     expect(confirmInput.hasClass('is-invalid')).toEqual(false);

        //     this.controller.form.confirmPassword.$setDirty();
        //     this.controller.isRequired = true;
        //     scope.$digest();
        //     expect(passwordInput.hasClass('is-invalid')).toEqual(true);
        //     expect(confirmInput.hasClass('is-invalid')).toEqual(true);
        // });
        // it('depending on the required value', function() {
        //     var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
        //     var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
        //     expect(passwordInput.attr('required')).toBeTruthy();
        //     expect(confirmInput.attr('required')).toBeTruthy();
            
        //     this.controller.isRequired = false;
        //     scope.$digest();
        //     expect(passwordInput.attr('required')).toBeFalsy();
        //     expect(confirmInput.attr('required')).toBeFalsy();
        // });
        // it('depending on if a value has been entered for the password', function() {
        //     this.controller.isRequired = false;
        //     scope.$digest();
        //     var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
        //     expect(confirmInput.attr('required')).toBeFalsy();
            
        //     this.controller.password = 'test';
        //     scope.$digest();
        //     expect(confirmInput.attr('required')).toBeTruthy();
        // });
        // it('depending on whether the inputs should be disabled', function() {
        //     var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
        //     var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
        //     expect(passwordInput.attr('disabled')).toBeFalsy();
        //     expect(confirmInput.attr('disabled')).toBeFalsy();

        //     scope.isDisabledWhen = true;
        //     scope.$digest();
        //     expect(passwordInput.attr('disabled')).toBeTruthy();
        //     expect(confirmInput.attr('disabled')).toBeTruthy();
        // });
    });
    it('should call changeEvent when the password text in the input changes', function() {
        var input = angular.element(this.element.querySelectorAll('input')[0]);
        input.val('Test').triggerHandler('input');
        expect(scope.changeEvent).toHaveBeenCalledWith('Test');
    });
});