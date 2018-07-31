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
describe('Users Page directive', function() {
    var $compile, scope, $q, userStateSvc, userManagerSvc, loginManagerSvc, utilSvc;

    beforeEach(function() {
        module('templates');
        module('usersPage');
        mockUserState();
        mockUserManager();
        mockLoginManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _$q_, _userStateService_, _userManagerService_, _loginManagerService_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            utilSvc = _utilService_;
        });

        this.element = $compile(angular.element('<users-page></users-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('usersPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userStateSvc = null;
        userManagerSvc = null;
        loginManagerSvc = null;
        utilSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should set the correct state for creating a user', function() {
            this.controller.createUser();
            expect(userStateSvc.displayCreateUserOverlay).toBe(true);
        });
        it('should set the correct state for deleting a user', function() {
            this.controller.deleteUser();
            expect(userStateSvc.displayDeleteUserConfirm).toBe(true);
        });
        it('should set the correct state for changing a user profile', function() {
            this.controller.editProfile();
            expect(userStateSvc.displayEditUserProfileOverlay).toBe(true);
        });
        it('should set the correct state for reseting a user password', function() {
            this.controller.resetPassword();
            expect(userStateSvc.displayResetPasswordOverlay).toBe(true);
        });
        describe('should correctly update the admin status of a user', function() {
            beforeEach(function() {
                userStateSvc.selectedUser = {username: 'user'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUserRoles.and.returnValue($q.reject('Error message'));
                userManagerSvc.deleteUserRole.and.returnValue($q.reject('Error message'));
                this.controller.changeRoles();
                scope.$apply();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('if the role has been added', function() {
                this.controller.roles.admin = true;
                this.controller.changeRoles();
                scope.$apply();
                expect(userManagerSvc.addUserRoles).toHaveBeenCalledWith(userStateSvc.selectedUser.username, ['admin']);
                expect(userManagerSvc.deleteUserRole).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('if the role has been removed', function() {
                this.controller.roles.admin = false;
                this.controller.changeRoles();
                scope.$apply();
                expect(userManagerSvc.deleteUserRole).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admin');
                expect(userManagerSvc.addUserRoles).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        it('should find all groups a user is a part of', function() {
            userStateSvc.selectedUser = {username: 'user'};
            var group = {members: [userStateSvc.selectedUser.username]};
            userManagerSvc.groups = [group];
            var result = this.controller.getUserGroups();
            expect(result).toContain(group);
        });
        it('should set the correct state for opening a group', function() {
            var group = {title: 'group'};
            this.controller.goToGroup(group);
            expect(userStateSvc.showGroups).toBe(true);
            expect(userStateSvc.showUsers).toBe(false);
            expect(userStateSvc.selectedGroup).toEqual(group);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('users-page')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-4').length).toBe(1);
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toBe(5);
        });
        it('with a users list', function() {
            expect(this.element.find('users-list').length).toBe(1);
        });
        it('with a block search header for the users list', function() {
            expect(this.element.querySelectorAll('.col-4 block-search').length).toBe(1);
        });
        it('with buttons for creating a user and deleting a user', function() {
            var createButton = this.element.querySelectorAll('.col-4 block-header button.btn-link')[0];
            expect(createButton).toBeDefined();
            expect(angular.element(createButton).text().trim()).toContain('Create');

            var deleteButton = this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0];
            expect(deleteButton).toBeDefined();
            expect(angular.element(deleteButton).text().trim()).toContain('Delete');
        });
        it('depending on whether a user is selected', function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
            var passwordButton = angular.element(this.element.querySelectorAll('.col-8 block-content button')[0]);
            var editProfileButton = angular.element(this.element.querySelectorAll('.col-8 block-header button')[0]);
            expect(this.element.querySelectorAll('.col-8 .user-profile').length).toBe(0);
            expect(this.element.querySelectorAll('.col-6 .user-groups-list').length).toBe(0);
            expect(this.element.find('permissions-input').length).toBe(0);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(passwordButton.attr('disabled')).toBeTruthy();
            expect(editProfileButton.attr('disabled')).toBeTruthy();

            userStateSvc.selectedUser = {username: 'user'};
            scope.$digest();
            expect(this.element.querySelectorAll('.col-8 .user-profile').length).toBe(1);
            expect(this.element.find('permissions-input').length).toBe(1);
            expect(this.element.querySelectorAll('.col-6 .user-groups-list').length).toBe(1);
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(passwordButton.attr('disabled')).toBeFalsy();
            expect(editProfileButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the current user is an admin', function() {
            userStateSvc.selectedUser = {username: 'user'};
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
            var createButton = angular.element(this.element.querySelectorAll('.col-4 block-header button.btn-link')[0]);
            var passwordButton = angular.element(this.element.querySelectorAll('.col-8 block-content button')[0]);
            var editProfileButton = angular.element(this.element.querySelectorAll('.col-8 block-header button')[0]);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(createButton.attr('disabled')).toBeTruthy();
            expect(passwordButton.attr('disabled')).toBeTruthy();
            expect(editProfileButton.attr('disabled')).toBeTruthy();

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(createButton.attr('disabled')).toBeFalsy();
            expect(passwordButton.attr('disabled')).toBeFalsy();
            expect(editProfileButton.attr('disabled')).toBeFalsy();
        });
        it('depending on if the selected user is the current user', function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            userStateSvc.selectedUser = {username: 'user'};
            loginManagerSvc.currentUser = userStateSvc.selectedUser.username;
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
            expect(deleteButton.attr('disabled')).toBeTruthy();

            loginManagerSvc.currentUser = '';
            scope.$digest();
            expect(deleteButton.attr('disabled')).toBeFalsy();
        });
        it('depending on the number of groups a user is in', function() {
            userStateSvc.selectedUser = {username: 'user'};
            spyOn(this.controller, 'getUserGroups').and.returnValue([{title: 'group', roles: []}]);
            scope.$digest();
            expect(this.element.querySelectorAll('.col-6 .user-groups-list li').length).toBe(1);
            expect(this.element.querySelectorAll('.col-6 .user-groups-list li.no-groups').length).toBe(0);

            this.controller.getUserGroups.and.returnValue([]);
            scope.$digest();
            expect(this.element.querySelectorAll('.col-6 .user-groups-list li').length).toBe(1);
            expect(this.element.querySelectorAll('.col-6 .user-groups-list li.no-groups').length).toBe(1);
        });
    });
    it('should call createGroup when the button is clicked', function() {
        spyOn(this.controller, 'createUser');
        var createButton = angular.element(this.element.querySelectorAll('.col-4 block-header button.btn-link')[0]);
        createButton.triggerHandler('click');
        expect(this.controller.createUser).toHaveBeenCalled();
    });
    it('should call editProfile when the button is clicked', function() {
        spyOn(this.controller, 'editProfile');
        var editProfileButton = angular.element(this.element.querySelectorAll('.col-8 block-header button')[0]);
        editProfileButton.triggerHandler('click');
        expect(this.controller.editProfile).toHaveBeenCalled();
    });
    it('should call deleteGroup when the button is clicked', function() {
        spyOn(this.controller, 'deleteUser');
        var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
        deleteButton.triggerHandler('click');
        expect(this.controller.deleteUser).toHaveBeenCalled();
    });
    it('should call resetPassword when the button is clicked', function() {
        spyOn(this.controller, 'resetPassword');
        var passwordButton = angular.element(this.element.querySelectorAll('.col-8 block-content button')[0]);
        passwordButton.triggerHandler('click');
        expect(this.controller.resetPassword).toHaveBeenCalled();
    });
});
