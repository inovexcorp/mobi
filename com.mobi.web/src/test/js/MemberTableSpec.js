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
describe('Member Table directive', function() {
    var $compile,
        scope,
        userStateSvc,
        userManagerSvc,
        loginManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('memberTable');
        mockLoginManager();
        mockUserManager();
        mockUserState();

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(_userStateService_, _userManagerService_, _loginManagerService_, _$compile_, _$rootScope_) {
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller variable', function() {
        beforeEach(function() {
            scope.members = [];
            scope.removeMember = jasmine.createSpy('removeMember');
            scope.addMember = jasmine.createSpy('addMember');
            this.element = $compile(angular.element('<member-table members="members" remove-member="removeMember()" add-member="addMember()"></member-table>'))(scope);
            scope.$digest();
            controller = this.element.controller('memberTable');
        });
        it('members should be one way bound', function() {
            controller.members = [''];
            scope.$digest();
            expect(scope.members).toEqual([]);
        });
        it('removeMember should be called in parent scope when invoked', function() {
            controller.removeMember();
            expect(scope.removeMember).toHaveBeenCalled();
        });
        it('addMember should be called in parent scope when invoked', function() {
            controller.addMember();
            expect(scope.addMember).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'user1'}];
            scope.members = ['user1'];
            scope.removeMember = jasmine.createSpy('removeMember');
            scope.addMember = jasmine.createSpy('addMember');
            this.element = $compile(angular.element('<member-table members="members" remove-member="removeMember()" add-member="addMember()"></member-table>'))(scope);
            scope.$digest();
            controller = this.element.controller('memberTable');
        });
        it('should get the list of group members', function() {
            var result = controller.getMembers();
            expect(result.length).toBe(scope.members.length);
            _.forEach(result, function(user, idx) {
                expect(user).toEqual(_.find(userManagerSvc.users, {username: scope.members[idx]}));
            });
        });
        it('should get the list of available users', function() {
            userManagerSvc.users.push({username: 'user1'}, {username: 'user2'});
            var result = controller.getAvailableUsers();
            _.forEach(result, function(user, idx) {
                expect(scope.members).not.toContain(user.username);
            });
        });
        it('should set the right state and call addMember', function() {
            var username = 'user';
            controller.selectedUser = {username: username};
            controller.onSelect();
            expect(userStateSvc.memberName).toBe(username);
            expect(controller.selectedUser).toBe(undefined);
            expect(controller.addingMember).toBe(false);
            expect(scope.addMember).toHaveBeenCalled();
        })
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            userManagerSvc.users = [{username: 'user1'}];
            scope.members = ['user1'];
            scope.removeMember = jasmine.createSpy('removeMember');
            scope.addMember = jasmine.createSpy('addMember');
            this.element = $compile(angular.element('<member-table members="members" remove-member="removeMember()" add-member="addMember()"></member-table>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('member-table')).toBe(true);
        });
        it('with the correct number of rows for members', function() {
            expect(this.element.querySelectorAll('tr.member').length).toBe(scope.members.length);
        });
        it('depending on whether there are users available to add', function() {
            controller = this.element.controller('memberTable');
            spyOn(controller, 'getAvailableUsers').and.returnValue([]);
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.add-member').length).toBe(0);

            controller.getAvailableUsers.and.returnValue([{}]);
            scope.$digest();
            expect(this.element.querySelectorAll('.add-member').length).toBe(1);
        });
        it('depending on whether a member is being added', function() {
            controller = this.element.controller('memberTable');
            controller.addingMember = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.adding-member').length).toBe(0);
            expect(this.element.find('ui-select').length).toBe(0);

            controller.addingMember = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.adding-member').length).toBe(1);
            expect(this.element.find('ui-select').length).toBe(1);
        });
        it('depending on whether a user in the list is the current user', function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            var removeButton = angular.element(this.element.querySelectorAll('.member td:last-child button')[0]);
            loginManagerSvc.currentUser = 'user1';
            scope.$digest();
            expect(removeButton.attr('disabled')).toBeTruthy();

            loginManagerSvc.currentUser = 'user2';
            scope.$digest();
            expect(removeButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the current user is an admin', function() {
            controller = this.element.controller('memberTable');
            spyOn(controller, 'getAvailableUsers').and.returnValue([{}]);
            userManagerSvc.isAdmin.and.returnValue(false);
            loginManagerSvc.currentUser = 'user';
            scope.$digest();
            var removeButton = angular.element(this.element.querySelectorAll('.member td:last-child button')[0]);
            expect(removeButton.attr('disabled')).toBeTruthy();
            expect(this.element.querySelectorAll('.add-member').length).toBe(0);

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(removeButton.attr('disabled')).toBeFalsy();
            expect(this.element.querySelectorAll('.add-member').length).toBe(1);
        });
        it('depending on whether the create group overlay is displayed', function() {
            userStateSvc.displayCreateGroupOverlay = true;
            scope.$digest();
            users = this.element.querySelectorAll('.member-table > tbody > tr > td.username > a');
            expect(users.length).toEqual(0);
        });
        it('depending on whether the create group overlay is not displayed', function() {
            userStateSvc.displayCreateGroupOverlay = false;
            scope.$digest();
            users = this.element.querySelectorAll('.member-table > tbody > tr > td.username > a');
            expect(users.length).toBeGreaterThan(0);
        });
    });
    it('should set the correct state and call removeMember when a delete button is clicked', function() {
        userManagerSvc.users = [{username: 'user1'}];
        scope.members = ['user1'];
        scope.removeMember = jasmine.createSpy('removeMember');
        scope.addMember = jasmine.createSpy('addMember');
        var element = $compile(angular.element('<member-table members="members" remove-member="removeMember()" add-member="addMember()"></member-table>'))(scope);
        scope.$digest();

        var removeButton = angular.element(element.querySelectorAll('.member td:last-child button')[0]);
        removeButton.triggerHandler('click');
        expect(userStateSvc.memberName).toBe(scope.members[0]);
        expect(scope.removeMember).toHaveBeenCalled();
    });
    it('should set the correct state and call removeMember when a delete button is clicked', function() {
        userManagerSvc.users = [{username: 'user1'}];
        scope.members = [];
        scope.removeMember = jasmine.createSpy('removeMember');
        scope.addMember = jasmine.createSpy('addMember');
        userManagerSvc.isAdmin.and.returnValue(true);
        var element = $compile(angular.element('<member-table members="members" remove-member="removeMember()" add-member="addMember()"></member-table>'))(scope);
        scope.$digest();
        controller = element.controller('memberTable');

        var addButton = angular.element(element.querySelectorAll('.add-member a')[0]);
        addButton.triggerHandler('click');
        expect(controller.addingMember).toBe(true);
    });
});