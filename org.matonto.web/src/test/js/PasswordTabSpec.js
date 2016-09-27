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
describe('Change Password Page directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        loginManagerSvc,
        $q, 
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('passwordTab');
        mockUserManager();
        mockLoginManager();

        inject(function(_userManagerService_, _loginManagerService_, _$q_, _$timeout_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            $q = _$q_;
            $timeout = _$timeout_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    it('should initialize with the current user', function() {
        loginManagerSvc.currentUser = 'user';
        userManagerSvc.users = [{username: 'user'}];
        var element = $compile(angular.element('<password-tab></password-tab>'))(scope);
        scope.$digest();
        controller = element.controller('passwordTab');
        expect(controller.currentUser).toEqual(userManagerSvc.users[0]);
    });
    describe('controller methods', function() {
        beforeEach(function() {
            loginManagerSvc.currentUser = 'user';
            userManagerSvc.users = [{username: 'user'}];
            this.element = $compile(angular.element('<password-tab></password-tab>'))(scope);
            scope.$digest();
            controller = this.element.controller('passwordTab');
        });
        describe('should save changes to the user password', function() {
            beforeEach(function() {
                controller.currentPassword = 'test';
            });
            it('unless an error occurs', function() {
                userManagerSvc.updateUser.and.returnValue($q.reject('Error message'));
                controller.save();
                $timeout.flush();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(loginManagerSvc.currentUser, {}, controller.currentPassword, controller.password);
                expect(controller.success).toBe(false);
                expect(controller.errorMessage).toBe('Error message');
            });
            it('successfully', function() {
                controller.save();
                $timeout.flush();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(loginManagerSvc.currentUser, {}, controller.currentPassword, controller.password);
                expect(controller.success).toBe(true);
                expect(controller.errorMessage).toBe('');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            loginManagerSvc.currentUser = 'user';
            userManagerSvc.users = [{username: 'user'}];
            this.element = $compile(angular.element('<password-tab></password-tab>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('password-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-6').length).toBe(1);
            expect(this.element.querySelectorAll('.col-xs-offset-3').length).toBe(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a block footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a password confirm input', function() {
            expect(this.element.find('password-confirm-input').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            controller = this.element.controller('passwordTab');
            controller.errorMessage = 'Test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether the password was saved successfully', function() {
            expect(this.element.querySelectorAll('.text-success').length).toBe(0);

            controller = this.element.controller('passwordTab');
            controller.success = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.text-success').length).toBe(1);
        });
        it('with the correct classes based on the confirm password field validity', function() {
            var currentPassword = angular.element(this.element.querySelectorAll('.current-password')[0]);
            expect(currentPassword.hasClass('has-error')).toBe(false);

            controller = this.element.controller('passwordTab');
            controller.form.currentPassword.$touched = true;
            scope.$digest();
            expect(currentPassword.hasClass('has-error')).toBe(true);
        });
        it('depending on the form validity', function() {
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeTruthy();

            controller = this.element.controller('passwordTab');
            controller.form.$invalid = false;
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeFalsy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        loginManagerSvc.currentUser = 'user';
        userManagerSvc.users = [{username: 'user'}];
        var element = $compile(angular.element('<password-tab></password-tab>'))(scope);
        scope.$digest();
        controller = element.controller('passwordTab');
        spyOn(controller, 'save');

        var button = angular.element(element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(controller.save).toHaveBeenCalled();
    });
});