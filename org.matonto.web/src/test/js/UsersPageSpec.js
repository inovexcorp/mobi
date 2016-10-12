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
describe('Users Page directive', function() {
    var $compile,
        scope,
        userStateSvc,
        userManagerSvc,
        loginManagerSvc,
        $timeout,
        $q;

    beforeEach(function() {
        module('templates');
        module('usersPage');
        mockUserState();
        mockUserManager();
        mockLoginManager();

        inject(function(_userStateService_, _userManagerService_, _loginManagerService_, _$timeout_, _$q_, _$compile_, _$rootScope_) {
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            $timeout = _$timeout_;
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<users-page></users-page>'))(scope);
            scope.$digest();
            controller = this.element.controller('usersPage');
        });
        it('should set the correct state for creating a user', function() {
            controller.createUser();
            expect(userStateSvc.displayCreateUserOverlay).toBe(true);
        });
        it('should set the correct state for deleting a user', function() {
            controller.deleteUser();
            expect(userStateSvc.displayDeleteConfirm).toBe(true);
        });
        it('should set the correct state for changing a user password', function() {
            controller.changePassword();
            expect(userStateSvc.displayChangePasswordOverlay).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<users-page></users-page>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('users-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-4').length).toBe(1);
            expect(this.element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toBe(4);
        });
        it('with a users list', function() {
            expect(this.element.find('users-list').length).toBe(1);
        });
        it('with buttons for creating a user and deleting a user', function() {
            var createButton = this.element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0];
            expect(createButton).toBeDefined();
            expect(angular.element(createButton).text().trim()).toContain('Create');

            var deleteButton = this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0];
            expect(deleteButton).toBeDefined();
            expect(angular.element(deleteButton).text().trim()).toContain('Delete');
        });
        it('depending on whether a user is selected', function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
            var passwordButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-content button')[0]);
            expect(this.element.querySelectorAll('.col-xs-8 .user-profile').length).toBe(0);
            expect(this.element.find('user-permissions-input').length).toBe(0);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(passwordButton.attr('disabled')).toBeTruthy();

            userStateSvc.selectedUser = {username: 'user'};
            scope.$digest();
            expect(this.element.querySelectorAll('.col-xs-8 .user-profile').length).toBe(1);
            expect(this.element.find('user-permissions-input').length).toBe(1);
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(passwordButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the current user is an admin', function() {
            userStateSvc.selectedUser = {username: 'user'};
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
            var createButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0]);
            var passwordButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-content button')[0]);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(createButton.attr('disabled')).toBeTruthy();
            expect(passwordButton.attr('disabled')).toBeTruthy();

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(createButton.attr('disabled')).toBeFalsy();
            expect(passwordButton.attr('disabled')).toBeFalsy();
        });
        it('depending on if the selected user is the current user', function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            userStateSvc.selectedUser = {username: 'user'};
            loginManagerSvc.currentUser = userStateSvc.selectedUser.username;
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
            expect(deleteButton.attr('disabled')).toBeTruthy();

            loginManagerSvc.currentUser = '';
            scope.$digest();
            expect(deleteButton.attr('disabled')).toBeFalsy();
        });
    });
    it('should call createGroup when the button is clicked', function() {
        var element = $compile(angular.element('<users-page></users-page>'))(scope);
        scope.$digest();
        controller = element.controller('usersPage');
        spyOn(controller, 'createUser');

        var createButton = angular.element(element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0]);
        createButton.triggerHandler('click');
        expect(controller.createUser).toHaveBeenCalled();
    });
    it('should call deleteGroup when the button is clicked', function() {
        var element = $compile(angular.element('<users-page></users-page>'))(scope);
        scope.$digest();
        controller = element.controller('usersPage');
        spyOn(controller, 'deleteUser');

        var deleteButton = angular.element(element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
        deleteButton.triggerHandler('click');
        expect(controller.deleteUser).toHaveBeenCalled();
    });
    it('should call changePassword when the button is clicked', function() {
        var element = $compile(angular.element('<users-page></users-page>'))(scope);
        scope.$digest();
        controller = element.controller('usersPage');
        spyOn(controller, 'changePassword');

        var passwordButton = angular.element(element.querySelectorAll('.col-xs-8 block-content button')[0]);
        passwordButton.triggerHandler('click');
        expect(controller.changePassword).toHaveBeenCalled();
    });
});
