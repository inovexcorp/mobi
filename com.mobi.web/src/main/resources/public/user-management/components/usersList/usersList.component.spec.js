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
describe('Users List component', function() {
    var $compile, scope, userManagerSvc;

    beforeEach(function() {
        module('templates');
        module('user-management');
        mockUserManager();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _userManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userManagerSvc = _userManagerService_;
        });

        scope.users = [];
        scope.searchText = '';
        scope.selectedUser = undefined;
        scope.clickEvent = jasmine.createSpy('clickEvent')
        this.element = $compile(angular.element('<users-list users="users" search-text="searchText" selected-user="selectedUser" click-event="clickEvent(user)"></users-list>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('usersList');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        userManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('users should be one way bound', function() {
            this.controller.users = [{}];
            scope.$digest();
            expect(scope.users).toEqual([]);
        });
        it('searchText should be one way bound', function() {
            this.controller.searchText = 'test';
            scope.$digest();
            expect(scope.searchText).toEqual('');
        });
        it('selectedUser should be one way bound', function() {
            this.controller.selectedUser = {};
            scope.$digest();
            expect(scope.selectedUser).toBeUndefined();
        });
        it('clickEvent should be called in the parent scope', function() {
            this.controller.clickEvent({user: {}});
            expect(scope.clickEvent).toHaveBeenCalledWith({});
        });
    });
    describe('should initialize with the correct values for', function() {
        describe('filteredUsers if', function() {
            beforeEach(function() {
                this.user1 = {username: 'testUsername', firstName: 'testFirstName', lastName: 'testLastName'};
                this.user2 = {username: 'seconduser', firstName: 'secondfirst', lastName: 'secondlast'};
                this.user3 = {username: 'thirduser', firstName: 'no', lastName: ''};
                this.user4 = {username: 'fourthuser', firstName: '', lastName: 'onlylast'};
                this.controller.users = [this.user1, this.user2, this.user3, this.user4];
            });
            it('searchText is empty', function() {
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual(this.controller.users);
            });
            it('searchText does not match any users', function() {
                this.controller.searchText = 'thisstringdoesnotmatch';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([]);
            });
            it('searchText matches all users', function() {
                this.controller.searchText = 'user';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user4, this.user2, this.user1, this.user3]);
            });
            it('searchTest matches only first name', function() {
                this.controller.searchText = 'testFirst';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user1]);
            });
            it('searchText matches only last name', function() {
                this.controller.searchText = 'testLast';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user1]);
            });
            it('searchText matches only username', function() {
                this.controller.searchText = 'testuser';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user1]);
            });
            it('searchText matches firstName lastName', function() {
                this.controller.searchText = 'FirstName testLast';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user1]);
            });
            it('searchText matches lastName firstName', function() {
                this.controller.searchText = 'LastName testFirst';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user1]);
            });
            it('searchText matches lastName, firstName', function() {
                this.controller.searchText = 'LastName, testFirst';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user1]);
            });
            it('searchText matches but casing is different', function() {
                this.controller.searchText = 'LaStNaMe TeStFiRsT';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user1]);
            });
            it('searchText matches two users', function() {
                this.controller.searchText = 'first';
                this.controller.$onInit();
                expect(this.controller.filteredUsers).toEqual([this.user2, this.user1]);
            });
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('USERS-LIST');
            expect(this.element.querySelectorAll('.users-list').length).toEqual(1);
        });
        it('depending on how many users there are', function() {
            expect(this.element.find('li').length).toBe(0);

            this.controller.filteredUsers = [{username: ''}];
            scope.$digest();
            expect(this.element.find('li').length).toBe(this.controller.filteredUsers.length);
        });
        it('depending on which user is selected', function() {
            var user = {username: 'user'};
            this.controller.filteredUsers = [user];
            scope.$digest();
            var userLink = angular.element(this.element.querySelectorAll('li a')[0]);
            expect(userLink.hasClass('active')).toBe(false);

            this.controller.selectedUser = user;
            scope.$digest();
            expect(userLink.hasClass('active')).toBe(true);
        });
        it('depending on whether the user in the list is an admin', function() {
            this.controller.filteredUsers = [{username: ''}];
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('li .admin').length).toBe(0);

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('li .admin').length).toBe(1);
        });
    });
    it('should call clickEVent when a group is clicked', function() {
        var user = {username: 'user'};
        this.controller.filteredUsers = [user];
        scope.$digest();

        var userLink = angular.element(this.element.querySelectorAll('li a')[0]);
        userLink.triggerHandler('click');
        expect(scope.clickEvent).toHaveBeenCalledWith(user);
    });
});