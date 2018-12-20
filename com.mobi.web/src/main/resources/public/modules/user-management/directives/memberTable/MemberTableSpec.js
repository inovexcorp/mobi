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
    var $compile, scope, userStateSvc, userManagerSvc, loginManagerSvc;

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

        userManagerSvc.users = [{username: 'user1'}];
        scope.members = ['user1'];
        scope.removeMember = jasmine.createSpy('removeMember');
        scope.addMember = jasmine.createSpy('addMember');
        scope.linkToUser = false;
        this.element = $compile(angular.element('<member-table members="members" remove-member="removeMember(member)" add-member="addMember(member)" link-to-user="linkToUser"></member-table>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('memberTable');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        userStateSvc = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('members should be one way bound', function() {
            this.controller.members = [''];
            scope.$digest();
            expect(scope.members).toEqual(['user1']);
        });
        it('removeMember should be called in parent scope when invoked', function() {
            this.controller.removeMember();
            expect(scope.removeMember).toHaveBeenCalled();
        });
        it('addMember should be called in parent scope when invoked', function() {
            this.controller.addMember();
            expect(scope.addMember).toHaveBeenCalled();
        });
        it('linkToUser should be one way bound', function() {
            this.controller.linkToUser = true;
            scope.$digest();
            expect(scope.linkToUser).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should get the list of group members', function() {
            var result = this.controller.getMembers();
            expect(result.length).toBe(scope.members.length);
            _.forEach(result, function(user, idx) {
                expect(user).toEqual(_.find(userManagerSvc.users, {username: scope.members[idx]}));
            });
        });
        it('should get the list of available users', function() {
            userManagerSvc.users.push({username: 'user1'}, {username: 'user2'});
            var result = this.controller.getAvailableUsers();
            _.forEach(result, function(user, idx) {
                expect(scope.members).not.toContain(user.username);
            });
        });
        it('should set the right state and call addMember', function() {
            var username = 'user';
            this.controller.selectedUser = {username: username};
            this.controller.onSelect();
            expect(scope.addMember).toHaveBeenCalledWith(username);
            expect(this.controller.selectedUser).toBe(undefined);
            expect(this.controller.addingMember).toBe(false);
        })
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('member-table')).toBe(true);
        });
        it('with the correct number of rows for members', function() {
            expect(this.element.querySelectorAll('tr.member').length).toBe(scope.members.length);
        });
        it('depending on whether there are users available to add', function() {
            spyOn(this.controller, 'getAvailableUsers').and.returnValue([]);
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.add-member').length).toBe(0);

            this.controller.getAvailableUsers.and.returnValue([{}]);
            scope.$digest();
            expect(this.element.querySelectorAll('.add-member').length).toBe(1);
        });
        it('depending on whether a member is being added', function() {
            this.controller.addingMember = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.adding-member').length).toBe(0);
            expect(this.element.find('ui-select').length).toBe(0);

            this.controller.addingMember = true;
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
            spyOn(this.controller, 'getAvailableUsers').and.returnValue([{}]);
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
        it('depending on users should be linked to', function() {
            var users = this.element.querySelectorAll('.member-table > tbody > tr > td.username > a');
            expect(users.length).toEqual(0);

            scope.linkToUser = true;
            scope.$digest();
            var users = this.element.querySelectorAll('.member-table > tbody > tr > td.username > a');
            expect(users.length).toEqual(1);
        });
    });
    it('should set the correct state and call removeMember when a delete button is clicked', function() {
        var removeButton = angular.element(this.element.querySelectorAll('.member td:last-child button')[0]);
        removeButton.triggerHandler('click');
        expect(scope.removeMember).toHaveBeenCalledWith(scope.members[0]);
    });
    it('should set the correct state and call removeMember when a delete button is clicked', function() {
        userManagerSvc.isAdmin.and.returnValue(true);
        scope.members = [];
        scope.$digest();

        var addButton = angular.element(this.element.querySelectorAll('.add-member a')[0]);
        addButton.triggerHandler('click');
        expect(this.controller.addingMember).toBe(true);
    });
});