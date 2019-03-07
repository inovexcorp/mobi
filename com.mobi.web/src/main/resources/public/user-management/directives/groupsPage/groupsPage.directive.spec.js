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
describe('Groups Page directive', function() {
    var $compile, scope, $q, userStateSvc, userManagerSvc, utilSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('groupsPage');
        mockUserState();
        mockUserManager();
        mockLoginManager();
        mockUtil();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _$q_, _userStateService_, _userManagerService_, _utilService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            utilSvc = _utilService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<groups-page></groups-page>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('groupsPage');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userStateSvc = null;
        userManagerSvc = null;
        utilSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should open a modal for creating a group', function() {
            this.controller.createGroup();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createGroupOverlay');
        });
        it('should open a modal for deleting a group', function() {
            userStateSvc.selectedGroup = {title: 'test'};
            this.controller.confirmDeleteGroup();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to remove'), this.controller.deleteGroup);
        });
        it('should open a modal for editing a group description', function() {
            this.controller.editDescription();
            expect(modalSvc.openModal).toHaveBeenCalledWith('editGroupInfoOverlay');
        });
        it('should set the correct state for removing a member', function() {
            userStateSvc.selectedGroup = {title: 'test'};
            this.controller.confirmRemoveMember('user');
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.stringMatching('Are you sure you want to remove'), jasmine.any(Function));
        });
        describe('should delete a group', function() {
            beforeEach(function() {
                this.group = userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.deleteGroup.and.returnValue($q.reject('Error message'));
                this.controller.deleteGroup();
                scope.$apply();
                expect(userManagerSvc.deleteGroup).toHaveBeenCalledWith(this.group.title);
                expect(userStateSvc.selectedGroup).toEqual(this.group);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                this.controller.deleteGroup();
                scope.$apply();
                expect(userManagerSvc.deleteGroup).toHaveBeenCalledWith(this.group.title);
                expect(userStateSvc.selectedGroup).toBeUndefined();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('should add a group member', function() {
            beforeEach(function() {
                this.username = 'user';
                userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUserGroup.and.returnValue($q.reject('Error message'));
                this.controller.addMember(this.username);
                scope.$apply();
                expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(this.username, userStateSvc.selectedGroup.title);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                this.controller.addMember(this.username);
                scope.$apply();
                expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(this.username, userStateSvc.selectedGroup.title);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
        describe('should remove a group member', function() {
            beforeEach(function() {
                this.memberName = 'user';
                this.group = userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.deleteUserGroup.and.returnValue($q.reject('Error message'));
                this.controller.removeMember(this.memberName);
                scope.$apply();
                expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(this.memberName, this.group.title);
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('unless an error occurs', function() {
                this.controller.removeMember(this.memberName);
                scope.$apply();
                expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(this.memberName, this.group.title);
                expect(userStateSvc.selectedGroup).toEqual(this.group);
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        })
        describe('should correctly update the admin status of a group', function() {
            beforeEach(function() {
                userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addGroupRoles.and.returnValue($q.reject('Error message'));
                userManagerSvc.deleteGroupRole.and.returnValue($q.reject('Error message'));
                this.controller.changeRoles();
                scope.$apply();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('if the role has been added', function() {
                this.controller.roles.admin = true;
                this.controller.changeRoles();
                scope.$apply();
                expect(userManagerSvc.addGroupRoles).toHaveBeenCalledWith(userStateSvc.selectedGroup.title, ['admin']);
                expect(userManagerSvc.deleteGroupRole).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('if the role has been removed', function() {
                this.controller.roles.admin = false;
                this.controller.changeRoles();
                scope.$apply();
                expect(userManagerSvc.deleteGroupRole).toHaveBeenCalledWith(userStateSvc.selectedGroup.title, 'admin');
                expect(userManagerSvc.addGroupRoles).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('groups-page')).toBe(true);
            expect(this.element.querySelectorAll('.col-4').length).toBe(1);
            expect(this.element.querySelectorAll('.col-8').length).toBe(1);
        });
        it('with .rows', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(4);            
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toBe(4);
        });
        it('with a groups list', function() {
            expect(this.element.find('groups-list').length).toBe(1);
        });
        it('with a block search header for the groups list', function() {
            expect(this.element.querySelectorAll('.col-4 block-search').length).toBe(1);
        });
        it('with buttons for creating a group and deleting a group', function() {
            var createButton = this.element.querySelectorAll('.col-4 block-header button.btn-link')[0];
            expect(createButton).toBeDefined();
            expect(angular.element(createButton).text().trim()).toContain('Create');

            var deleteButton = this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0];
            expect(deleteButton).toBeDefined();
            expect(angular.element(deleteButton).text().trim()).toContain('Delete');
        });
        it('with a button for editing a group description', function() {
            var editButton = this.element.querySelectorAll('.col-8 block-header button.btn-link')[0];
            expect(editButton).toBeDefined();
            expect(angular.element(editButton).text().trim()).toContain('Edit');
        });
        it('depending on whether a group is selected', function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
            var editButton = angular.element(this.element.querySelectorAll('.col-8 block-header button.btn-link')[0]);
            expect(this.element.querySelectorAll('.col-8 .group-description').length).toBe(0);
            expect(this.element.find('member-table').length).toBe(0);
            expect(this.element.find('permissions-input').length).toBe(0);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(editButton.attr('disabled')).toBeTruthy();

            userStateSvc.selectedGroup = {title: 'group', members: []};
            scope.$digest();
            expect(this.element.querySelectorAll('.col-8 .group-description').length).toBe(1);
            expect(this.element.find('member-table').length).toBe(1);
            expect(this.element.find('permissions-input').length).toBe(1);
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(editButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the current user is an admin', function() {
            userStateSvc.selectedGroup = {title: 'group', members: []};
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
            var createButton = angular.element(this.element.querySelectorAll('.col-4 block-header button.btn-link')[0]);
            var editButton = angular.element(this.element.querySelectorAll('.col-8 block-header button.btn-link')[0]);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(createButton.attr('disabled')).toBeTruthy();
            expect(editButton.attr('disabled')).toBeTruthy();

            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(createButton.attr('disabled')).toBeFalsy();
            expect(editButton.attr('disabled')).toBeFalsy();
        });
    });
    it('should call createGroup when the button is clicked', function() {
        spyOn(this.controller, 'createGroup');
        var createButton = angular.element(this.element.querySelectorAll('.col-4 block-header button.btn-link')[0]);
        createButton.triggerHandler('click');
        expect(this.controller.createGroup).toHaveBeenCalled();
    });
    it('should call confirmDeleteGroup when the button is clicked', function() {
        spyOn(this.controller, 'confirmDeleteGroup');
        var deleteButton = angular.element(this.element.querySelectorAll('.col-4 block-footer button.btn-link')[0]);
        deleteButton.triggerHandler('click');
        expect(this.controller.confirmDeleteGroup).toHaveBeenCalled();
    });
    it('should call editDescription when the button is clicked', function() {
        spyOn(this.controller, 'editDescription');
        var editButton = angular.element(this.element.querySelectorAll('.col-8 block-header button.btn-link')[0]);
        editButton.triggerHandler('click');
        expect(this.controller.editDescription).toHaveBeenCalled();
    });
});
