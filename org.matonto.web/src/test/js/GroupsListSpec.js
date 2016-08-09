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
describe('Groups List directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        loginManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('groupsList');
        mockUserManager();
        mockLoginManager();
        mockUserState();

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
            this.element = $compile(angular.element('<groups-list></groups-list>'))(scope);
            scope.$digest();
            controller = this.element.controller('groupsList');
        });
        it('should get the list of groups depending on whether it is a full list or not', function() {
            controller.full = false;
            loginManagerSvc.currentUser = 'user';
            userManagerSvc.groups = [{members: ['user']}, {members: []}];
            var result = controller.getGroups();
            expect(result.length).toBe(1);

            controller.full = true;
            result = controller.getGroups();
            expect(result.length).toBe(userManagerSvc.groups.length);
        });
        it('should set the correct state for editing a group', function() {
            var group = {name: 'group'};
            controller.editGroup(group);
            expect(userStateSvc.selectedGroup).toEqual(group);
            expect(userStateSvc.showGroupsList).toBe(false);
            expect(userStateSvc.editGroup).toBe(true);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<groups-list></groups-list>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('groups-list')).toBe(true);
            expect(this.element.querySelectorAll('.toggle-btns').length).toBe(1);
        });
        it('with buttons for different group lists', function() {
            expect(this.element.querySelectorAll('.toggle-btns td').length).toBe(2);
        });
        it('depending on which group list should be shown', function() {
            var myButton = angular.element(this.element.querySelectorAll('.toggle-btns .my-groups')[0]);
            var allButton = angular.element(this.element.querySelectorAll('.toggle-btns .all-groups')[0]);
            controller = this.element.controller('groupsList');
            controller.full = false;
            scope.$digest();
            expect(myButton.hasClass('active')).toBe(true);
            expect(allButton.hasClass('active')).toBe(false);

            controller.full = true;
            scope.$digest();
            expect(myButton.hasClass('active')).toBe(false);
            expect(allButton.hasClass('active')).toBe(true);
        });
        it('depending on how many groups there are', function() {
            var groups = [];
            controller = this.element.controller('groupsList');
            spyOn(controller, 'getGroups').and.returnValue(groups);
            scope.$digest();
            expect(this.element.querySelectorAll('.no-groups').length).toBe(1);
            expect(this.element.querySelectorAll('.groups').length).toBe(0);

            groups = [{}];
            controller.getGroups.and.returnValue(groups);
            scope.$digest();
            expect(this.element.querySelectorAll('.no-groups').length).toBe(0);
            expect(this.element.querySelectorAll('.groups').length).toBe(1);
            expect(this.element.querySelectorAll('.groups tr').length).toBe(groups.length);
        });
        it('depending on which group is selected', function() {
            controller = this.element.controller('groupsList');
            var groups = [{}];
            spyOn(controller, 'getGroups').and.returnValue(groups);
            scope.$digest();
            var groupItem = angular.element(this.element.querySelectorAll('.groups tr')[0]);
            expect(groupItem.hasClass('active')).toBe(false);

            userStateSvc.selectedGroup = groups[0];
            scope.$digest();
            expect(groupItem.hasClass('active')).toBe(true);
        });
        it('depending on whether the current user is an admin and which group it is', function() {
            controller = this.element.controller('groupsList');
            var groups = [{name: 'group'}];
            spyOn(controller, 'getGroups').and.returnValue(groups);
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            var editButton = angular.element(this.element.querySelectorAll('.groups tr td:last-child button')[0]);
            expect(editButton.attr('disabled')).toBeTruthy();

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(editButton.attr('disabled')).toBeFalsy();

            groups = [{name: 'admingroup'}];
            controller.getGroups.and.returnValue(groups);
            scope.$digest();
            editButton = angular.element(this.element.querySelectorAll('.groups tr td:last-child button')[0]);
            expect(editButton.attr('disabled')).toBeTruthy();
        });
    });
    it('should set the correct state depending on the button clicked', function() {
        var element = $compile(angular.element('<groups-list></groups-list>'))(scope);
        scope.$digest();
        controller = element.controller('groupsList');
        var myButton = angular.element(element.querySelectorAll('.toggle-btns .my-groups a')[0]);
        var allButton = angular.element(element.querySelectorAll('.toggle-btns .all-groups a')[0]);

        myButton.triggerHandler('click');
        expect(controller.full).toBe(false);
        allButton.triggerHandler('click');
        expect(controller.full).toBe(true);
    });
    it('should set the selected group when a row is clicked', function() {
        var element = $compile(angular.element('<groups-list></groups-list>'))(scope);
        scope.$digest();
        controller = element.controller('groupsList');
        var group = {};
        spyOn(controller, 'getGroups').and.returnValue([group]);
        scope.$digest();

        var groupItem = angular.element(element.querySelectorAll('.groups tr')[0]);
        groupItem.triggerHandler('click');
        expect(userStateSvc.selectedGroup).toEqual(group);
    });
    it('should call editGroup when a edit button is clicked', function() {
        var element = $compile(angular.element('<groups-list></groups-list>'))(scope);
        scope.$digest();
        controller = element.controller('groupsList');
        var group = {};
        spyOn(controller, 'getGroups').and.returnValue([group]);
        spyOn(controller, 'editGroup');
        scope.$digest();

        var editButton = angular.element(element.querySelectorAll('.groups tr td:last-child button')[0]);
        editButton.triggerHandler('click');
        expect(controller.editGroup).toHaveBeenCalledWith(group);
    });
});