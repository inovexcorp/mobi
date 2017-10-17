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
describe('User Management Overlays directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        userManagerSvc,
        userStateSvc;

    beforeEach(function() {
        module('templates');
        module('userManagementOverlays');
        mockUserState();
        mockUserManager();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _userStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
        });

        element = $compile(angular.element('<user-management-overlays></user-management-overlays>'))(scope);
        scope.$digest();
        controller = element.controller('userManagementOverlays');
    });

    describe('controller methods', function() {
        describe('should delete a group', function() {
            beforeEach(function() {
                userStateSvc.displayDeleteGroupConfirm = true;
                this.group = userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.deleteGroup.and.returnValue($q.reject('Error message'));
                controller.deleteGroup();
                scope.$apply();
                expect(userManagerSvc.deleteGroup).toHaveBeenCalledWith(this.group.title);
                expect(controller.errorMessage).toBe('Error message');
                expect(userStateSvc.displayDeleteGroupConfirm).toBe(true);
                expect(userStateSvc.selectedGroup).toEqual(this.group);
            });
            it('successfully', function() {
                controller.deleteGroup();
                scope.$apply();
                expect(userManagerSvc.deleteGroup).toHaveBeenCalledWith(this.group.title);
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.displayDeleteGroupConfirm).toBe(false);
                expect(userStateSvc.selectedGroup).toBeUndefined();
            });
        });
        describe('should delete a user', function() {
            beforeEach(function() {
                userStateSvc.displayDeleteUserConfirm = true;
                this.user = userStateSvc.selectedUser = {username: 'user'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.deleteUser.and.returnValue($q.reject('Error message'));
                controller.deleteUser();
                scope.$apply();
                expect(userManagerSvc.deleteUser).toHaveBeenCalledWith(this.user.username);
                expect(controller.errorMessage).toBe('Error message');
                expect(userStateSvc.displayDeleteUserConfirm).toBe(true);
                expect(userStateSvc.selectedUser).toEqual(this.user);
            });
            it('successfully', function() {
                controller.deleteUser();
                scope.$apply();
                expect(userManagerSvc.deleteUser).toHaveBeenCalledWith(this.user.username);
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.displayDeleteUserConfirm).toBe(false);
                expect(userStateSvc.selectedUser).toBeUndefined();
            });
        });
        describe('should remove a group member', function() {
            beforeEach(function() {
                userStateSvc.displayRemoveMemberConfirm = true;
                this.memberName = userStateSvc.memberName = 'user';
                this.group = userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.deleteUserGroup.and.returnValue($q.reject('Error message'));
                controller.removeMember();
                scope.$apply();
                expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(this.memberName, this.group.title);
                expect(controller.errorMessage).toBe('Error message');
            });
            it('unless an error occurs', function() {
                controller.removeMember();
                scope.$apply();
                expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(this.memberName, this.group.title);
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.memberName).toBe('');
                expect(userStateSvc.selectedGroup).toEqual(this.group);
                expect(userStateSvc.displayRemoveMemberConfirm).toBe(false);
            });
        })
    });
    describe('contains the correct html', function() {
        it('depending on whether a user is being created', function() {
            userStateSvc.displayCreateUserOverlay = true;
            scope.$digest();
            expect(element.find('create-user-overlays').length).toBe(1);

            userStateSvc.displayCreateUserOverlay = false;
            scope.$digest();
            expect(element.find('create-user-overlays').length).toBe(0);
        });
        it('depending on whether a group is being created', function() {
            userStateSvc.displayCreateGroupOverlay = true;
            scope.$digest();
            expect(element.find('create-group-overlay').length).toBe(1);

            userStateSvc.displayCreateGroupOverlay = false;
            scope.$digest();
            expect(element.find('create-group-overlay').length).toBe(0);
        });
        it('depending on whether a password is being reset', function() {
            userStateSvc.displayResetPasswordOverlay = true;
            scope.$digest();
            expect(element.find('reset-password-overlay').length).toBe(1);

            userStateSvc.displayResetPasswordOverlay = false;
            scope.$digest();
            expect(element.find('reset-password-overlay').length).toBe(0);
        });
        it('depending on whether a user profile is being edited', function() {
            userStateSvc.displayEditUserProfileOverlay = true;
            scope.$digest();
            expect(element.find('edit-user-profile-overlay').length).toBe(1);

            userStateSvc.displayEditUserProfileOverlay = false;
            scope.$digest();
            expect(element.find('edit-user-profile-overlay').length).toBe(0);
        });
        it('depending on whether group information is being edited', function() {
            userStateSvc.displayEditGroupInfoOverlay = true;
            scope.$digest();
            expect(element.find('edit-group-info-overlay').length).toBe(1);

            userStateSvc.displayEditGroupInfoOverlay = false;
            scope.$digest();
            expect(element.find('edit-group-info-overlay').length).toBe(0);
        });
        it('depending on whether deleting an user should be confirmed', function() {
            userStateSvc.displayDeleteUserConfirm = true;
            scope.$digest();
            var overlay = element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-user-confirm')).toBe(true);

            userStateSvc.displayDeleteUserConfirm = false;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether deleting a group should be confirmed', function() {
            userStateSvc.displayDeleteGroupConfirm = true;
            scope.$digest();
            var overlay = element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('delete-group-confirm')).toBe(true);

            userStateSvc.displayDeleteGroupConfirm = false;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(0);
        });
        it('depending on whether removing a group member should be confirmed', function() {
            userStateSvc.displayRemoveMemberConfirm = true;
            scope.$digest();
            var overlay = element.find('confirmation-overlay');
            expect(overlay.length).toBe(1);
            expect(overlay.hasClass('remove-member-confirm')).toBe(true);

            userStateSvc.displayRemoveMemberConfirm = false;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(0);
        });
        describe('depending on whether an error occured', function() {
            beforeEach(function() {
                controller.errorMessage = 'Error message';
            })
            it('when deleting a user', function() {
                userStateSvc.displayDeleteUserConfirm = true;
                scope.$digest();
                expect(element.find('error-display').length).toBe(1);
            });
            it('when deleting a group', function() {
                userStateSvc.displayDeleteGroupConfirm = true;
                scope.$digest();
                expect(element.find('error-display').length).toBe(1);
            });
            it('when removing a group member', function() {
                userStateSvc.displayRemoveMemberConfirm = true;
                scope.$digest();
                expect(element.find('error-display').length).toBe(1);
            });
        });
    });
});
