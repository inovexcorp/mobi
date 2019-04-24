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
describe('Users Page component', function() {
    var $compile, scope, $q, userStateSvc, userManagerSvc, loginManagerSvc, utilSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('user-management');
        mockComponent('user-management', 'usersList');
        mockComponent('user-management', 'permissionsInput');
        mockUserState();
        mockUserManager();
        mockLoginManager();
        mockUtil();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _userStateService_, _userManagerService_, _loginManagerService_, _utilService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            utilSvc = _utilService_;
            modalSvc = _modalService_;
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
        modalSvc = null;
        this.element.remove();
    });

    describe('initializes with the correct values for', function() {
        it('roles', function() {
            expect(this.controller.roles).toEqual({admin: false});

            userStateSvc.selectedUser = {roles: ['admin']};
            this.controller.$onInit();
            expect(this.controller.roles).toEqual({admin: true});
        });
    });
    describe('controller methods', function() {
        it('should select a user', function() {
            var user = {roles: ['admin']};
            this.controller.selectUser(user);
            expect(userStateSvc.selectedUser).toEqual(user);
            expect(this.controller.roles).toEqual({admin: true});
        });
        it('should open a modal for creating a user', function() {
            this.controller.createUser();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createUserOverlay');
        });
        it('should open a modal for deleting a user', function() {
            userStateSvc.selectedUser = {username: 'test'};
            this.controller.confirmDeleteUser();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to remove'), this.controller.deleteUser);
        });
        it('should open a modal for changing a user profile', function() {
            this.controller.editProfile();
            expect(modalSvc.openModal).toHaveBeenCalledWith('editUserProfileOverlay');
        });
        it('should open a modal for reseting a user password', function() {
            this.controller.resetPassword();
            expect(modalSvc.openModal).toHaveBeenCalledWith('resetPasswordOverlay');
        });
        describe('should delete a user', function() {
            beforeEach(function() {
                this.user = userStateSvc.selectedUser = {username: 'user'};
                this.controller.roles = {admin: true};
            });
            it('unless an error occurs', function() {
                userManagerSvc.deleteUser.and.returnValue($q.reject('Error message'));
                this.controller.deleteUser();
                scope.$apply();
                expect(userManagerSvc.deleteUser).toHaveBeenCalledWith(this.user.username);
                expect(userStateSvc.selectedUser).toEqual(this.user);
                expect(this.controller.roles).toEqual({admin: true});
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                this.controller.deleteUser();
                scope.$apply();
                expect(userManagerSvc.deleteUser).toHaveBeenCalledWith(this.user.username);
                expect(userStateSvc.selectedUser).toBeUndefined();
                expect(this.controller.roles).toEqual({admin: false});
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('should correctly update the admin status of a user', function() {
            beforeEach(function() {
                userStateSvc.selectedUser = {username: 'user'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUserRoles.and.returnValue($q.reject('Error message'));
                userManagerSvc.deleteUserRole.and.returnValue($q.reject('Error message'));
                var originalRoles = angular.copy(this.controller.roles);
                this.controller.changeRoles({});
                scope.$apply();
                expect(this.controller.roles).toEqual(originalRoles);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('if the role has been added', function() {
                this.controller.changeRoles({admin: true});
                scope.$apply();
                expect(this.controller.roles).toEqual({admin: true});
                expect(userManagerSvc.addUserRoles).toHaveBeenCalledWith(userStateSvc.selectedUser.username, ['admin']);
                expect(userManagerSvc.deleteUserRole).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('if the role has been removed', function() {
                this.controller.roles.admin = false;
                this.controller.changeRoles({admin: false});
                scope.$apply();
                expect(this.controller.roles).toEqual({admin: false});
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
            expect(userStateSvc.showGroups).toEqual(true);
            expect(userStateSvc.showUsers).toEqual(false);
            expect(userStateSvc.selectedGroup).toEqual(group);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('USERS-PAGE');
            expect(this.element.querySelectorAll('.users-page').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-4').length).toEqual(1);
            expect(this.element.querySelectorAll('.col-8').length).toEqual(1);
        });
        it('with .rows', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(6);            
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toEqual(5);
        });
        it('with a users-list', function() {
            expect(this.element.find('users-list').length).toEqual(1);
        });
        it('with a block search header for the users list', function() {
            expect(this.element.querySelectorAll('.col-4 block-search').length).toEqual(1);
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
            expect(this.element.querySelectorAll('.col-8 .user-profile').length).toEqual(0);
            expect(this.element.querySelectorAll('.col-6 .user-groups-list').length).toEqual(0);
            expect(this.element.find('permissions-input').length).toEqual(0);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(passwordButton.attr('disabled')).toBeTruthy();
            expect(editProfileButton.attr('disabled')).toBeTruthy();

            userStateSvc.selectedUser = {username: 'user'};
            scope.$digest();
            expect(this.element.querySelectorAll('.col-8 .user-profile').length).toEqual(1);
            expect(this.element.find('permissions-input').length).toEqual(1);
            expect(this.element.querySelectorAll('.user-groups-list').length).toEqual(1);
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
        it('depending on whether the selected user is external', function() {
            userStateSvc.selectedUser = {username: 'user', external: true};
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            var passwordButton = angular.element(this.element.querySelectorAll('.col-8 block-content button')[0]);
            var editProfileButton = angular.element(this.element.querySelectorAll('.col-8 block-header button')[0]);
            var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(passwordButton.attr('disabled')).toBeTruthy();
            expect(editProfileButton.attr('disabled')).toBeTruthy();
        });
        it('depending on the number of groups a user is in', function() {
            userStateSvc.selectedUser = {username: 'user'};
            spyOn(this.controller, 'getUserGroups').and.returnValue([{title: 'group', roles: []}]);
            scope.$digest();
            expect(this.element.querySelectorAll('.user-groups-list li').length).toEqual(1);
            expect(this.element.querySelectorAll('.user-groups-list li.no-groups').length).toEqual(0);

            this.controller.getUserGroups.and.returnValue([]);
            scope.$digest();
            expect(this.element.querySelectorAll('.user-groups-list li').length).toEqual(1);
            expect(this.element.querySelectorAll('.user-groups-list li.no-groups').length).toEqual(1);
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
    it('should call confirmDeleteUser when the button is clicked', function() {
        spyOn(this.controller, 'confirmDeleteUser');
        var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
        deleteButton.triggerHandler('click');
        expect(this.controller.confirmDeleteUser).toHaveBeenCalled();
    });
    it('should call resetPassword when the button is clicked', function() {
        spyOn(this.controller, 'resetPassword');
        var passwordButton = angular.element(this.element.querySelectorAll('.col-8 block-content button')[0]);
        passwordButton.triggerHandler('click');
        expect(this.controller.resetPassword).toHaveBeenCalled();
    });
});
