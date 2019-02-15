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
    var $compile, scope, usernameSearch, userManagerSvc, userStateSvc, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('usersList');
        mockUserManager();
        mockUserState();
        mockLoginManager();
        injectUsernameSearchFilter();

        inject(function(_$compile_, _$rootScope_, _usernameSearchFilter_, _userManagerService_, _userStateService_, _loginManagerService_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            usernameSearch = _usernameSearchFilter_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<users-list></users-list>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('usersList');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        usernameSearch = null;
        userManagerSvc = null;
        userStateSvc = null;
        loginManagerSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should set the selected user when clicked', function() {
            var user = {username: 'user'};
            this.controller.onClick(user);
            expect(userStateSvc.selectedUser).toEqual(user);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('users-list')).toBe(true);
        });
        it('depending on how many users there are', function() {
            expect(this.element.find('li').length).toBe(0);

            userManagerSvc.users = [{username: ''}];
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
            expect(usernameSearch).toHaveBeenCalledWith([user], user.username);
            expect(this.element.find('li').length).toBe(1);

            usernameSearch.and.returnValue([]);
            userStateSvc.userSearchString = 'abc';
            scope.$digest();
            expect(usernameSearch).toHaveBeenCalledWith([user], 'abc');
            expect(this.element.find('li').length).toBe(0);
        });
    });
    it('should call onClick when a group is clicked', function() {
        var user = {username: 'user'};
        userManagerSvc.users = [user];
        spyOn(this.controller, 'onClick');
        scope.$digest();

        var userLink = angular.element(this.element.querySelectorAll('li a')[0]);
        userLink.triggerHandler('click');
        expect(this.controller.onClick).toHaveBeenCalledWith(user);
    });
});