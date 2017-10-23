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
describe('Password Confirm Input directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope;

    beforeEach(function() {
        module('templates');
        module('passwordConfirmInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.password = '';
        scope.confirmedPassword = '';
        scope.label = '';
        var form = $compile('<form></form>')(scope);
        element = angular.element('<password-confirm-input password="password" confirmed-password="confirmedPassword" label="label"></password-confirm-input>');
        form.append(element);
        element = $compile(element)(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
    });

    describe('in isolated scope', function() {
        it('password should be two way bound', function() {
            isolatedScope.password = 'test';
            scope.$digest();
            expect(scope.password).toBe('test');
        });
        it('confirmedPassword should be two way bound', function() {
            isolatedScope.confirmedPassword = 'test';
            scope.$digest();
            expect(scope.confirmedPassword).toBe('test');
        })
        it('label should be one way bound', function() {
            isolatedScope.label = 'test';
            scope.$digest();
            expect(scope.label).toBe('');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('password-confirm-input')).toBe(true);
            expect(element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with the correct classes based on the password field validity', function() {
            var passwordGroup = angular.element(element.querySelectorAll('.password')[0]);
            expect(passwordGroup.hasClass('has-error')).toBe(false);

            isolatedScope.form.password.$setDirty();
            isolatedScope.required = true;
            scope.$digest();
            expect(passwordGroup.hasClass('has-error')).toBe(true);
        });
        it('with the correct classes based on the confirm password field validity', function() {
            var passwordGroup = angular.element(element.querySelectorAll('.password')[0]);
            var confirmGroup = angular.element(element.querySelectorAll('.confirm-password')[0]);
            expect(passwordGroup.hasClass('has-error')).toBe(false);
            expect(confirmGroup.hasClass('has-error')).toBe(false);

            isolatedScope.form.confirmPassword.$setDirty();
            isolatedScope.required = true;
            scope.$digest();
            expect(passwordGroup.hasClass('has-error')).toBe(true);
            expect(confirmGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on the required value', function() {
            var passwordInput = angular.element(element.querySelectorAll('.password input')[0]);
            var confirmInput = angular.element(element.querySelectorAll('.confirm-password input')[0]);
            expect(passwordInput.attr('required')).toBeFalsy();
            expect(confirmInput.attr('required')).toBeFalsy();

            isolatedScope.required = true;
            scope.$digest();
            expect(passwordInput.attr('required')).toBeTruthy();
            expect(confirmInput.attr('required')).toBeTruthy();
        });
        it('depending on if a value has been entered for the password', function() {
            var confirmInput = angular.element(element.querySelectorAll('.confirm-password input')[0]);
            expect(confirmInput.attr('required')).toBeFalsy();

            scope.password = 'test';
            scope.$digest();
            expect(confirmInput.attr('required')).toBeTruthy();
        });
    });
    it('should show an error depending on if passwords match', function() {
        scope.password = 'test';
        scope.confirmedPassword = scope.password;
        scope.$digest();
        expect(isolatedScope.form.$valid).toBe(true);

        scope.confirmedPassword = 'tester';
        scope.$digest();
        expect(isolatedScope.form.$valid).toBe(false);
    });
});