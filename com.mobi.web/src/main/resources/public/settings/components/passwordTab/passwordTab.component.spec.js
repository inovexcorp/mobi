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
describe('Password Tab component', function() {
    var $compile, scope, $q, userManagerSvc, loginManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('settings');
        mockUserManager();
        mockLoginManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _loginManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            utilSvc = _utilService_;
        });

        loginManagerSvc.currentUser = 'user';
        this.element = $compile(angular.element('<password-tab></password-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('passwordTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        describe('should save changes to the user password', function() {
            beforeEach(function() {
                this.controller.currentPassword = 'test';
            });
            it('unless an error occurs', function() {
                userManagerSvc.changePassword.and.returnValue($q.reject('Error message'));
                this.controller.save();
                scope.$apply();
                expect(userManagerSvc.changePassword).toHaveBeenCalledWith(loginManagerSvc.currentUser, this.controller.currentPassword, this.controller.password);
                expect(this.controller.errorMessage).toEqual('Error message');
            });
            it('successfully', function() {
                var currentPassword = this.controller.currentPassword;
                var password = this.controller.password;
                this.controller.save();
                scope.$apply();
                expect(userManagerSvc.changePassword).toHaveBeenCalledWith(loginManagerSvc.currentUser, currentPassword, password);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(this.controller.errorMessage).toEqual('');
                expect(this.controller.currentPassword).toEqual('');
                expect(this.controller.password).toEqual('');
                expect(this.controller.confirmedPassword).toEqual('');
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PASSWORD-TAB');
            expect(this.element.querySelectorAll('.password-tab').length).toEqual(1);
            expect(this.element.querySelectorAll('.row').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-6').length).toEqual(1);
            expect(this.element.querySelectorAll('.offset-3').length).toEqual(1);
        });
        ['block', 'block-content', 'block-footer', 'password-confirm-input'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toEqual(1);
            });
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toEqual(0);

            this.controller.errorMessage = 'Test';
            scope.$digest();
            expect(this.element.find('error-display').length).toEqual(1);
        });
        it('with the correct classes based on the confirm password field validity', function() {
            var currentPassword = angular.element(this.element.querySelectorAll('.current-password input')[0]);
            expect(currentPassword.hasClass('is-invalid')).toEqual(false);

            this.controller.form.currentPassword.$setDirty();
            scope.$digest();
            expect(currentPassword.hasClass('is-invalid')).toEqual(true);
        });
        it('depending on the form validity and dirtiness', function() {
            var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            this.controller.form.$setDirty();
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        spyOn(this.controller, 'save');
        var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(this.controller.save).toHaveBeenCalled();
    });
});