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
describe('Users List directive', function() {
    var $compile,
        usernameSearchFilter,
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
        injectUsernameSearchFilter();

        inject(function(_userManagerService_, _userStateService_, _loginManagerService_, _usernameSearchFilter_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            usernameSearchFilter = _usernameSearchFilter_;
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
        it('should set the selected user when clicked', function() {
            var user = {username: 'user'};
            controller.onClick(user);
            expect(userStateSvc.selectedUser).toEqual(user);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<users-list></users-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('users-list')).toBe(true);
        });
        it('depending on how many users there are', function() {
            expect(this.element.find('li').length).toBe(0);

            userManagerSvc.users = [{username: ''}];
            controller = this.element.controller('usersList');
            scope.$digest();
            expect(this.element.find('li').length).toBe(userManagerSvc.users.length);
        });
        it('depending on which user is selected', function() {
            var user = {username: 'user'};
            userManagerSvc.users = [user];
            scope.$digest();
            var userLink = angular.element(this.element.querySelectorAll('li a')[0]);
            expect(userLink.hasClass('active')).toBe(false);

            userStateSvc.selectedUser = user;
            scope.$digest();
            expect(userLink.hasClass('active')).toBe(true);
        });
        it('depending on whether the user in the list is an admin', function() {
            controller = this.element.controller('usersList');
            userManagerSvc.users = [{username: ''}];
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('li .admin').length).toBe(0);

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('li .admin').length).toBe(1);
        });
        it('depending on the user search string', function() {
            var user = {username: 'user'};
            userManagerSvc.users = [user];
            userStateSvc.userSearchString = user.username;
            scope.$digest();
            expect(usernameSearchFilter).toHaveBeenCalledWith([user], user.username);
            expect(this.element.find('li').length).toBe(1);

            usernameSearchFilter.and.returnValue([]);
            userStateSvc.userSearchString = 'abc';
            scope.$digest();
            expect(usernameSearchFilter).toHaveBeenCalledWith([user], 'abc');
            expect(this.element.find('li').length).toBe(0);
        });
    });
    it('should call onClick when a group is clicked', function() {
        var user = {username: 'user'};
        userManagerSvc.users = [user];
        var element = $compile(angular.element('<users-list></users-list>'))(scope);
        scope.$digest();
        controller = element.controller('usersList');
        spyOn(controller, 'onClick');

        var userLink = angular.element(element.querySelectorAll('li a')[0]);
        userLink.triggerHandler('click');
        expect(controller.onClick).toHaveBeenCalledWith(user);
    });
});