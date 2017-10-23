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
describe('Password Tab directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        userManagerSvc,
        loginManagerSvc,
        utilSvc;

    beforeEach(function() {
        module('templates');
        module('passwordTab');
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
        element = $compile(angular.element('<password-tab></password-tab>'))(scope);
        scope.$digest();
        controller = element.controller('passwordTab');
    });

    describe('controller methods', function() {
        describe('should save changes to the user password', function() {
            beforeEach(function() {
                controller.currentPassword = 'test';
            });
            it('unless an error occurs', function() {
                userManagerSvc.changePassword.and.returnValue($q.reject('Error message'));
                controller.save();
                scope.$apply();
                expect(userManagerSvc.changePassword).toHaveBeenCalledWith(loginManagerSvc.currentUser, controller.currentPassword, controller.password);
                expect(controller.errorMessage).toBe('Error message');
            });
            it('successfully', function() {
                var currentPassword = controller.currentPassword;
                var password = controller.password;
                controller.save();
                scope.$apply();
                expect(userManagerSvc.changePassword).toHaveBeenCalledWith(loginManagerSvc.currentUser, currentPassword, password);
                expect(utilSvc.createSuccessToast).toHaveBeenCalled();
                expect(controller.errorMessage).toBe('');
                expect(controller.currentPassword).toBe('');
                expect(controller.password).toBe('');
                expect(controller.confirmedPassword).toBe('');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('password-tab')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
            expect(element.querySelectorAll('.col-xs-6').length).toBe(1);
            expect(element.querySelectorAll('.col-xs-offset-3').length).toBe(1);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a block footer', function() {
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a password confirm input', function() {
            expect(element.find('password-confirm-input').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(element.find('error-display').length).toBe(0);

            controller.errorMessage = 'Test';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('with the correct classes based on the confirm password field validity', function() {
            var currentPassword = angular.element(element.querySelectorAll('.current-password')[0]);
            expect(currentPassword.hasClass('has-error')).toBe(false);

            controller.form.currentPassword.$setDirty();
            scope.$digest();
            expect(currentPassword.hasClass('has-error')).toBe(true);
        });
        it('depending on the form validity and dirtiness', function() {
            var button = angular.element(element.querySelectorAll('block-footer button')[0]);
            expect(button.attr('disabled')).toBeTruthy();

            controller.form.$invalid = false;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();

            controller.form.$setDirty();
            scope.$digest();
            expect(button.attr('disabled')).toBeFalsy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        spyOn(controller, 'save');
        var button = angular.element(element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(controller.save).toHaveBeenCalled();
    });
});