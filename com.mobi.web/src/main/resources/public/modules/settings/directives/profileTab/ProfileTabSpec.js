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
describe('Profile Tab directive', function() {
    var $compile, scope, $q, userManagerSvc, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('profileTab');
        mockUserManager();
        mockLoginManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _loginManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
        });

        loginManagerSvc.currentUser = 'user';
        userManagerSvc.users = [{username: 'user'}];
        this.element = $compile(angular.element('<profile-tab></profile-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('profileTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        this.element.remove();
    });

    it('should initialize with the current user', function() {
        expect(this.controller.currentUser).not.toBe(userManagerSvc.users[0]);
        expect(this.controller.currentUser).toEqual(userManagerSvc.users[0]);
    });
    describe('controller methods', function() {
        describe('should save changes to the user profile', function() {
            it('unless an error occurs', function() {
                userManagerSvc.updateUser.and.returnValue($q.reject('Error message'));
                this.controller.save();
                scope.$apply();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(loginManagerSvc.currentUser, userManagerSvc.users[0]);
                expect(this.controller.success).toBe(false);
                expect(this.controller.errorMessage).toBe('Error message');
            });
            it('successfully', function() {
                this.controller.save();
                scope.$apply();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(loginManagerSvc.currentUser, userManagerSvc.users[0]);
                expect(this.controller.success).toBe(true);
                expect(this.controller.errorMessage).toBe('');
                expect(this.controller.form.$pristine).toBe(true);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('profile-tab')).toBe(true);
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
        it('with text inputs', function() {
            expect(this.element.find('text-input').length).toBe(2);
        });
        it('with an email input', function() {
            expect(this.element.find('email-input').length).toBe(1);
        });
        it('depending on whether the password was saved successfully', function() {
            expect(this.element.querySelectorAll('.text-success').length).toBe(0);

            this.controller.success = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.text-success').length).toBe(1);
        });
        it('depending on the form validity and dirtiness', function() {
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeTruthy();

            this.controller.form.$invalid = false;
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeTruthy();

            this.controller.form.$setDirty();
            scope.$digest();
            expect(this.element.querySelectorAll('block-footer button').attr('disabled')).toBeFalsy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        spyOn(this.controller, 'save');
        var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(this.controller.save).toHaveBeenCalled();
    });
});