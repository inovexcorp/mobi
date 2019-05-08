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
describe('Member Table component', function() {
    var $compile, scope, userStateSvc, userManagerSvc, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('user-management');
        mockLoginManager();
        mockUserManager();
        mockUserState();
        injectHighlightFilter();
        injectTrustedFilter();

        inject(function(_$compile_, _$rootScope_, _userStateService_, _userManagerService_, _loginManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
        });

        userManagerSvc.users = [{username: 'user1'}];

        scope.members = ['user1'];
        scope.removeMember = jasmine.createSpy('removeMember');
        scope.addMember = jasmine.createSpy('addMember');
        scope.linkToUser = false;
        scope.readOnly = false;
        this.element = $compile(angular.element('<member-table members="members" remove-member="removeMember(member)" add-member="addMember(member)" link-to-user="linkToUser" read-only="readOnly"></member-table>'))(scope);
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
        it('removeMember should be called in parent scope', function() {
            this.controller.removeMember();
            expect(scope.removeMember).toHaveBeenCalled();
        });
        it('addMember should be called in parent scope', function() {
            this.controller.addMember();
            expect(scope.addMember).toHaveBeenCalled();
        });
        it('linkToUser should be one way bound', function() {
            this.controller.linkToUser = true;
            scope.$digest();
            expect(scope.linkToUser).toEqual(false);
        });
        it('readOnly should be one way bound', function() {
            this.controller.readOnly = true;
            scope.$digest();
            expect(scope.readOnly).toEqual(false);
        });
    });
    describe('controller methods', function() {
        it('should update the appropriate lists when the members change', function() {
            this.controller.$onChanges({members: {}});
            expect(this.controller.memberObjects.length).toEqual(scope.members.length);
            _.forEach(this.controller.memberObjects, (user, idx) => {
                expect(user).toEqual(_.find(userManagerSvc.users, {username: scope.members[idx]}));
            });
            _.forEach(this.controller.availableUsers, user => {
                expect(scope.members).not.toContain(user.username);
            });
        });
        it('should select a member to add', function() {
            var username = 'user';
            this.controller.selectedUser = {username: username};
            this.controller.onSelect();
            expect(scope.addMember).toHaveBeenCalledWith(username);
            expect(this.controller.selectedUser).toBeUndefined();
            expect(this.controller.addingMember).toEqual(false);
        });
        it('should set the correct state for navigating to a user', function() {
            this.controller.goToUser({});
            expect(userStateSvc.showGroups).toEqual(false);
            expect(userStateSvc.showUsers).toEqual(true);
            expect(userStateSvc.selectedUser).toEqual({});
        });
    });
    describe('contains with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('MEMBER-TABLE');
            expect(this.element.querySelectorAll('.member-table').length).toEqual(1);
        });
        it('with the correct number of rows for members', function() {
            expect(this.element.querySelectorAll('tr.member').length).toEqual(scope.members.length);
        });
        it('depending on whether there are users available to add', function() {
            this.controller.availableUsers = [];
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('.add-member').length).toEqual(0);

            this.controller.availableUsers = [{}];
            scope.$digest();
            expect(this.element.querySelectorAll('.add-member').length).toEqual(1);
        });
        it('depending on whether a member is being added', function() {
            this.controller.addingMember = false;
            scope.$digest();
            expect(this.element.querySelectorAll('.adding-member').length).toEqual(0);
            expect(this.element.find('ui-select').length).toEqual(0);

            this.controller.addingMember = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.adding-member').length).toEqual(1);
            expect(this.element.find('ui-select').length).toEqual(1);
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
            this.controller.availableUsers = [{}];
            userManagerSvc.isAdmin.and.returnValue(false);
            loginManagerSvc.currentUser = 'user';
            scope.$digest();
            var removeButton = angular.element(this.element.querySelectorAll('.member td:last-child button')[0]);
            expect(removeButton.attr('disabled')).toBeTruthy();
            expect(this.element.querySelectorAll('.add-member').length).toEqual(0);

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(removeButton.attr('disabled')).toBeFalsy();
            expect(this.element.querySelectorAll('.add-member').length).toEqual(1);
        });
        it('depending on whether the table is read only', function() {
            this.controller.availableUsers = [{}];
            this.controller.readOnly = true;
            userManagerSvc.isAdmin.and.returnValue(true);
            loginManagerSvc.currentUser = 'user';
            scope.$digest();
            var removeButton = angular.element(this.element.querySelectorAll('.member td:last-child button')[0]);
            expect(removeButton.attr('disabled')).toBeTruthy();
        });
        it('depending on whether users should be linked to', function() {
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
        expect(this.controller.addingMember).toEqual(true);
    });
});