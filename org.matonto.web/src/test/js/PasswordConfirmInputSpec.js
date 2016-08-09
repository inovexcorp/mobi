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
describe('Password Confirm Input directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('templates');
        module('passwordConfirmInput');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.password = '';
            scope.toConfirm = '';
            scope.label = '';
            scope.required = false;
            var form = $compile('<form></form>')(scope);
            this.element = angular.element('<password-confirm-input password="password" required="required" label="label" to-confirm="toConfirm"></password-confirm-input>');
            form.append(this.element);
            this.element = $compile(this.element)(scope);
            scope.$digest();
        });
        it('password should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.password = 'test';
            scope.$digest();
            expect(scope.password).toBe('test');
        });
        it('toConfirm should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.toConfirm = 'test';
            scope.$digest();
            expect(scope.toConfirm).toBe('test');
        });
        it('label should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.label = 'test';
            scope.$digest();
            expect(scope.label).toBe('test');
        });
        it('required should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.required = true;
            scope.$digest();
            expect(scope.required).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.password = '';
            scope.toConfirm = '';
            scope.label = '';
            scope.required = true;
            var form = $compile('<form></form>')(scope);
            this.element = angular.element('<password-confirm-input password="password" required="required" label="label" to-confirm="toConfirm"></password-confirm-input>');
            form.append(this.element);
            this.element = $compile(this.element)(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('password-confirm-input')).toBe(true);
            expect(this.element.querySelectorAll('.form-group').length).toBe(2);
        });
        it('with the correct classes based on the password field validity', function() {
            var passwordGroup = angular.element(this.element.querySelectorAll('.password')[0]);
            expect(passwordGroup.hasClass('has-error')).toBe(false);
            var isolatedScope = this.element.isolateScope();

            isolatedScope.form.password.$touched = true;
            scope.$digest();
            expect(passwordGroup.hasClass('has-error')).toBe(true);
        });
        it('with the correct classes based on the confirm password field validity', function() {
            var passwordGroup = angular.element(this.element.querySelectorAll('.password')[0]);
            var confirmGroup = angular.element(this.element.querySelectorAll('.confirm-password')[0]);
            expect(passwordGroup.hasClass('has-error')).toBe(false);
            expect(confirmGroup.hasClass('has-error')).toBe(false);
            var isolatedScope = this.element.isolateScope();

            isolatedScope.form.confirmPassword.$touched = true;
            scope.$digest();
            expect(passwordGroup.hasClass('has-error')).toBe(true);
            expect(confirmGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on the required value', function() {
            var passwordInput = angular.element(this.element.querySelectorAll('.password input')[0]);
            var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
            expect(passwordInput.attr('required')).toBeTruthy();
            expect(confirmInput.attr('required')).toBeTruthy();

            scope.required = false;
            scope.$digest();
            expect(passwordInput.attr('required')).toBeFalsy();
            expect(confirmInput.attr('required')).toBeFalsy();
        });
        it('depending on if a value has been entered for the password', function() {
            scope.required = false;
            scope.$digest();
            var confirmInput = angular.element(this.element.querySelectorAll('.confirm-password input')[0]);
            expect(confirmInput.attr('required')).toBeFalsy();

            scope.password = 'test';
            scope.$digest();
            expect(confirmInput.attr('required')).toBeTruthy();
        });
    });
    it('should show an error depending on if passwords match', function() {
        scope.password = 'test';
        scope.toConfirm = 'test';
        var form = $compile('<form></form>')(scope);
        var element = angular.element('<password-confirm-input password="password" required="required" label="label" to-confirm="toConfirm"></password-confirm-input>');
        form.append(element);
        element = $compile(element)(scope);
        scope.$digest();

        var isolatedScope = element.isolateScope();
        expect(isolatedScope.form.$valid).toBe(true);

        scope.toConfirm = 'tester';
        scope.$digest();
        expect(isolatedScope.form.$valid).toBe(false);
    });
});