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
    var $compile, scope;

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
        this.element = angular.element('<password-confirm-input password="password" confirmed-password="confirmedPassword" label="label"></password-confirm-input>');
        form.append(this.element);
        this.element = $compile(this.element)(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('password should be two way bound', function() {
            this.isolatedScope.password = 'test';
            scope.$digest();
            expect(scope.password).toBe('test');
        });
        it('confirmedPassword should be two way bound', function() {
            this.isolatedScope.confirmedPassword = 'test';
            scope.$digest();
            expect(scope.confirmedPassword).toBe('test');
        })
        it('label should be one way bound', function() {
            this.isolatedScope.label = 'test';
            scope.$digest();
            expect(scope.label).toBe('');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('password-confirm-input')).toBe(true);
            expect(this.element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with the correct classes based on the password field validity', function() {
            var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
            expect(passwordInput.hasClass('is-invalid')).toBe(false);

            this.isolatedScope.form.password.$setDirty();
            this.isolatedScope.required = true;
            scope.$digest();
            expect(passwordInput.hasClass('is-invalid')).toBe(true);
        });
        it('with the correct classes based on the confirm password field validity', function() {
            var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
            var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
            expect(passwordInput.hasClass('is-invalid')).toBe(false);
            expect(confirmInput.hasClass('is-invalid')).toBe(false);

            this.isolatedScope.form.confirmPassword.$setDirty();
            this.isolatedScope.required = true;
            scope.$digest();
            expect(passwordInput.hasClass('is-invalid')).toBe(true);
            expect(confirmInput.hasClass('is-invalid')).toBe(true);
        });
        it('depending on the required value', function() {
            var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
            var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
            expect(passwordInput.attr('required')).toBeFalsy();
            expect(confirmInput.attr('required')).toBeFalsy();

            this.isolatedScope.required = true;
            scope.$digest();
            expect(passwordInput.attr('required')).toBeTruthy();
            expect(confirmInput.attr('required')).toBeTruthy();
        });
        it('depending on if a value has been entered for the password', function() {
            var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
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
        expect(this.isolatedScope.form.$valid).toBe(true);

        scope.confirmedPassword = 'tester';
        scope.$digest();
        expect(this.isolatedScope.form.$valid).toBe(false);
    });
});