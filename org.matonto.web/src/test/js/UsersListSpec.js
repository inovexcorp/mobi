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
describe('Users List directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        loginManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('usersList');
        mockUserManager();
        mockUserState();
        mockLoginManager();

        inject(function(_userManagerService_, _userStateService_, _loginManagerService_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<users-list></users-list>'))(scope);
            scope.$digest();
            controller = this.element.controller('usersList');
        });
        it('should set the correct state for editing a user', function() {
            var user = {username: 'user'};
            controller.editUser(user);
            expect(userStateSvc.selectedUser).toEqual(user);
            expect(userStateSvc.showUsersList).toBe(false);
            expect(userStateSvc.editUser).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<users-list></users-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('users-list')).toBe(true);
            expect(this.element.querySelectorAll('.users').length).toBe(1);
        });
        it('depending on how many users there are', function() {
            userManagerSvc.users = [{}];
            controller = this.element.controller('usersList');
            scope.$digest();
            expect(this.element.querySelectorAll('.users tr').length).toBe(userManagerSvc.users.length);
        });
        it('depending on which users is selected', function() {
            controller = this.element.controller('usersList');
            userManagerSvc.users = [{}];
            scope.$digest();
            var userItem = angular.element(this.element.querySelectorAll('.users tr')[0]);
            expect(userItem.hasClass('active')).toBe(false);

            userStateSvc.selectedUser = userManagerSvc.users[0];
            scope.$digest();
            expect(userItem.hasClass('active')).toBe(true);
        });
        it('depending on whether the user in the list is an admin', function() {
            controller = this.element.controller('usersList');
            userManagerSvc.users = [{}];
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.users tr td .admin').length).toBe(0);

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.users tr td .admin').length).toBe(1);
        });
        it('depending on whether the current user is an admin', function() {
            controller = this.element.controller('usersList');
            userManagerSvc.users = [{}];
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            var editButton = angular.element(this.element.querySelectorAll('.users tr td:last-child button')[0]);
            expect(editButton.attr('disabled')).toBeTruthy();

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(editButton.attr('disabled')).toBeFalsy();
        });
    });
    it('should set the selected user when a row is clicked', function() {
        var element = $compile(angular.element('<users-list></users-list>'))(scope);
        scope.$digest();
        controller = element.controller('usersList');
        var user = {};
        userManagerSvc.users = [user];
        scope.$digest();

        var userItem = angular.element(element.querySelectorAll('.users tr')[0]);
        userItem.triggerHandler('click');
        expect(userStateSvc.selectedUser).toEqual(user);
    });
    it('should call editUser when a edit button is clicked', function() {
        var element = $compile(angular.element('<users-list></users-list>'))(scope);
        scope.$digest();
        controller = element.controller('usersList');
        var user = {};
        userManagerSvc.users = [user];
        spyOn(controller, 'editUser');
        scope.$digest();

        var editButton = angular.element(element.querySelectorAll('.users tr td:last-child button')[0]);
        editButton.triggerHandler('click');
        expect(controller.editUser).toHaveBeenCalledWith(user);
    });
});