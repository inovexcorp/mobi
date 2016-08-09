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
describe('User Management Side Bar directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        loginManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('userManagementSideBar');
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
            this.element = $compile(angular.element('<user-management-side-bar></user-management-side-bar>'))(scope);
            scope.$digest();
            controller = this.element.controller('userManagementSideBar');
        });
        describe('should create the correct button title', function() {
            beforeEach(function() {
                this.action = 'Test';
            });
            it('for the users page', function() {
                userStateSvc.showUsersList = true;
                var result = controller.getButtonTitle(this.action);
                expect(result).toBe(this.action + ' User');

                userStateSvc.showUsersList = false;
                userStateSvc.editUser = true;
                result = controller.getButtonTitle(this.action);
                expect(result).toBe(this.action + ' User');
            });
            it('for the group page', function() {
                userStateSvc.showGroupsList = true;
                var result = controller.getButtonTitle(this.action);
                expect(result).toBe(this.action + ' Group');

                userStateSvc.showGroupsList = false;
                userStateSvc.editGroup = true;
                result = controller.getButtonTitle(this.action);
                expect(result).toBe(this.action + ' Group');
            });
        });
        it('should navigate to the groups list', function() {
            controller.openGroups();
            expect(userStateSvc.reset).toHaveBeenCalled();
            expect(userStateSvc.showGroupsList).toBe(true);
        });
        it('should navigate to the groups list', function() {
            controller.openUsers();
            expect(userStateSvc.reset).toHaveBeenCalled();
            expect(userStateSvc.showUsersList).toBe(true);
        });
        it('should set the correct state for adding a user', function() {
            controller.addUser();
            expect(userStateSvc.showAddUser).toBe(true);
        });
        it('should set the correct state for adding a group', function() {
            controller.addGroup();
            expect(userStateSvc.showAddGroup).toBe(true);
        });
        it('should set the correct state for deleting a group or a user', function() {
            controller.delete();
            expect(userStateSvc.showDeleteConfirm).toBe(true);
        });
    });
    describe('fills the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<user-management-side-bar></user-management-side-bar>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('USER-MANAGEMENT-SIDE-BAR');
            var leftNav = this.element.find('left-nav');
            expect(leftNav.length).toBe(1);
            expect(leftNav.hasClass('user-management-side-bar')).toBe(true);
        });
        it('with the correct number of nav items', function() {
            expect(this.element.find('left-nav-item').length).toBe(4);
        });
    });
});