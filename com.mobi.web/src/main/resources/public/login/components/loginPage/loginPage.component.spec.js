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
describe('Login Page component', function() {
    var $compile, scope, $q, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('login');
        mockLoginManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _loginManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            loginManagerSvc = _loginManagerService_;
        });

        this.element = $compile(angular.element('<login-page></login-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('loginPage');
    });

    afterEach(function() {
        $ompile = null;
        scope = null;
        $q = null;
        loginManagerSvc = null;
    });

    describe('component methods', function() {
        describe('correctly validates a login combination', function() {
            beforeEach(function() {
                this.controller.form = {
                    username: 'user',
                    password: ''
                };
            });
            it('unless an error occurs', function() {
                loginManagerSvc.login.and.returnValue($q.reject('Error message'));
                this.controller.login();
                scope.$apply();
                expect(loginManagerSvc.login).toHaveBeenCalledWith(this.controller.form.username, this.controller.form.password);
                expect(this.controller.errorMessage).toEqual('Error message');
            });
            it('successfully', function() {
                this.controller.login();
                scope.$apply();
                expect(loginManagerSvc.login).toHaveBeenCalledWith(this.controller.form.username, this.controller.form.password);
                expect(this.controller.errorMessage).toEqual('');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('LOGIN-PAGE');
            expect(this.element.querySelectorAll('.form-container').length).toEqual(1);
        });
        it('with inputs', function() {
            expect(this.element.find('input').length).toEqual(2);
        });
        it('with labels', function() {
            expect(this.element.find('label').length).toEqual(2);
        });
        it('depending on whether an error occured', function() {
            expect(this.element.find('error-display').length).toEqual(0);

            this.controller.errorMessage = 'test';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('depending on whether the form is invalid', function() {
            var button = this.element.find('button');
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.username = 'test';
            this.controller.form.password = 'test';
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
});