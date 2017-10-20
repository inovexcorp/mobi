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
describe('Groups Page directive', function() {
    var $compile,
        scope,
        userStateSvc,
        userManagerSvc,
        loginManagerSvc,
        utilSvc,
        $q;

    beforeEach(function() {
        module('templates');
        module('groupsPage');
        mockUserState();
        mockUserManager();
        mockLoginManager();
        mockUtil();

        inject(function(_$compile_, _$rootScope_, _userStateService_, _userManagerService_, _loginManagerService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userStateSvc = _userStateService_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        this.element = $compile(angular.element('<groups-page></groups-page>'))(scope);
        scope.$digest();
    });

    describe('controller methods', function() {
        beforeEach(function() {
            controller = this.element.controller('groupsPage');
        });
        it('should set the correct state for creating a group', function() {
            controller.createGroup();
            expect(userStateSvc.displayCreateGroupOverlay).toBe(true);
        });
        it('should set the correct state for deleting a group', function() {
            controller.deleteGroup();
            expect(userStateSvc.displayDeleteGroupConfirm).toBe(true);
        });
        it('should set the correct state for editing a group description', function() {
            controller.editDescription();
            expect(userStateSvc.displayEditGroupInfoOverlay).toBe(true);
        });
        it('should set the correct state for removing a member', function() {
            controller.removeMember();
            expect(userStateSvc.displayRemoveMemberConfirm).toBe(true);
        });
        describe('should add a group member', function() {
            beforeEach(function() {
                this.username = userStateSvc.memberName = 'user';
                userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUserGroup.and.returnValue($q.reject('Error message'));
                controller.addMember();
                scope.$apply();
                expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(this.username, userStateSvc.selectedGroup.title);
                expect(userStateSvc.memberName).toBe(this.username);
                expect(controller.errorMessage).toBe('Error message');
            });
            it('successfully', function() {
                controller.addMember();
                scope.$apply();
                expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(this.username, userStateSvc.selectedGroup.title);
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.memberName).toBe('');
            });
        });
        describe('should correctly update the admin status of a group', function() {
            beforeEach(function() {
                userStateSvc.selectedGroup = {title: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addGroupRoles.and.returnValue($q.reject('Error message'));
                userManagerSvc.deleteGroupRole.and.returnValue($q.reject('Error message'));
                controller.changeRoles();
                scope.$apply();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('if the role has been added', function() {
                controller.roles.admin = true;
                controller.changeRoles();
                scope.$apply();
                expect(userManagerSvc.addGroupRoles).toHaveBeenCalledWith(userStateSvc.selectedGroup.title, ['admin']);
                expect(userManagerSvc.deleteGroupRole).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
            it('if the role has been removed', function() {
                controller.roles.admin = false;
                controller.changeRoles();
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
            expect(this.element.hasClass('row')).toBe(true);
            expect(this.element.querySelectorAll('.col-xs-4').length).toBe(1);
            expect(this.element.querySelectorAll('.col-xs-8').length).toBe(1);
        });
        it('with blocks', function() {
            expect(this.element.find('block').length).toBe(4);
        });
        it('with a groups list', function() {
            expect(this.element.find('groups-list').length).toBe(1);
        });
        it('with a block search header for the groups list', function() {
            expect(this.element.querySelectorAll('.col-xs-4 block-search').length).toBe(1);
        });
        it('with buttons for creating a group and deleting a group', function() {
            var createButton = this.element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0];
            expect(createButton).toBeDefined();
            expect(angular.element(createButton).text().trim()).toContain('Create');

            var deleteButton = this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0];
            expect(deleteButton).toBeDefined();
            expect(angular.element(deleteButton).text().trim()).toContain('Delete');
        });
        it('with a button for editing a group description', function() {
            var editButton = this.element.querySelectorAll('.col-xs-8 block-header button.btn-link')[0];
            expect(editButton).toBeDefined();
            expect(angular.element(editButton).text().trim()).toContain('Edit');
        });
        it('depending on whether a group is selected', function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
            var editButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-header button.btn-link')[0]);
            expect(this.element.querySelectorAll('.col-xs-8 .group-description').length).toBe(0);
            expect(this.element.find('member-table').length).toBe(0);
            expect(this.element.find('permissions-input').length).toBe(0);
            expect(deleteButton.attr('disabled')).toBeTruthy();
            expect(editButton.attr('disabled')).toBeTruthy();

            userStateSvc.selectedGroup = {title: 'group', members: []};
            scope.$digest();
            expect(this.element.querySelectorAll('.col-xs-8 .group-description').length).toBe(1);
            expect(this.element.find('member-table').length).toBe(1);
            expect(this.element.find('permissions-input').length).toBe(1);
            expect(deleteButton.attr('disabled')).toBeFalsy();
            expect(editButton.attr('disabled')).toBeFalsy();
        });
        it('depending on whether the current user is an admin', function() {
            userStateSvc.selectedGroup = {title: 'group', members: []};
            userManagerSvc.isAdmin.and.returnValue(false);
            scope.$digest();
            var deleteButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
            var createButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0]);
            var editButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-header button.btn-link')[0]);
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
        controller = this.element.controller('groupsPage');
        spyOn(controller, 'createGroup');

        var createButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-header button.btn-link')[0]);
        createButton.triggerHandler('click');
        expect(controller.createGroup).toHaveBeenCalled();
    });
    it('should call deleteGroup when the button is clicked', function() {
        controller = this.element.controller('groupsPage');
        spyOn(controller, 'deleteGroup');

        var deleteButton = angular.element(this.element.querySelectorAll('.col-xs-4 block-footer button.btn-link')[0]);
        deleteButton.triggerHandler('click');
        expect(controller.deleteGroup).toHaveBeenCalled();
    });
    it('should call editDescription when the button is clicked', function() {
        controller = this.element.controller('groupsPage');
        spyOn(controller, 'editDescription');

        var editButton = angular.element(this.element.querySelectorAll('.col-xs-8 block-header button.btn-link')[0]);
        editButton.triggerHandler('click');
        expect(controller.editDescription).toHaveBeenCalled();
    });
});
