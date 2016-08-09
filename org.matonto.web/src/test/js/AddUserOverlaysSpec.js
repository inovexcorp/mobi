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
describe('Add User Overlays directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        $timeout,
        $q,
        controller;

    beforeEach(function() {
        module('templates');
        module('addUserOverlays');
        mockUserManager();
        mockUserState();

        inject(function(_userManagerService_, _userStateService_, _$timeout_, _$q_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            $timeout = _$timeout_;
            $q = _$q_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<add-user-overlays></add-user-overlays>'))(scope);
            scope.$digest();
            $timeout.flush();
            controller = this.element.controller('addUserOverlays');
        });
        describe('should add a user with the username and password entered', function() {
            beforeEach(function() {
                controller.username = 'username'
                controller.password = 'password';
                userStateSvc.showAddUser = true;
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUser.and.returnValue($q.reject('Error Message'));
                controller.add();
                $timeout.flush();
                expect(userManagerSvc.addUser).toHaveBeenCalledWith(controller.username, controller.password);
                expect(controller.errorMessage).toBe('Error Message');
                expect(userStateSvc.showAddUser).not.toBe(false);
            });
            describe('and the correct roles and groups', function() {
                it('unless an error occurs', function() {
                    userManagerSvc.addUserRole.and.returnValue($q.reject('Error Message'));
                    controller.add();
                    $timeout.flush();
                    expect(userManagerSvc.addUser).toHaveBeenCalledWith(controller.username, controller.password);
                    expect(userManagerSvc.addUserRole).toHaveBeenCalledWith(controller.username, 'user');
                    expect(userManagerSvc.addUserGroup).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('Error Message');
                    expect(userStateSvc.showAddUser).not.toBe(false);

                    userManagerSvc.addUserRole.and.returnValue($q.when());
                    userManagerSvc.addUserGroup.and.returnValue($q.reject('Error Message'));
                    controller.roles.admin = true;
                    controller.errorMessage = '';
                    userStateSvc.showAddUser = true;
                    controller.add();
                    $timeout.flush();
                    expect(userManagerSvc.addUser).toHaveBeenCalledWith(controller.username, controller.password);
                    expect(userManagerSvc.addUserRole).toHaveBeenCalledWith(controller.username, 'user');
                    expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(controller.username, 'admingroup');
                    expect(controller.errorMessage).toBe('Error Message');
                    expect(userStateSvc.showAddUser).not.toBe(false);
                });
                it('successfully', function() {
                    controller.add();
                    $timeout.flush();
                    expect(userManagerSvc.addUser).toHaveBeenCalledWith(controller.username, controller.password);
                    expect(userManagerSvc.addUserRole).toHaveBeenCalledWith(controller.username, 'user');
                    expect(userManagerSvc.addUserGroup).not.toHaveBeenCalled();
                    expect(controller.errorMessage).toBe('');
                    expect(userStateSvc.showAddUser).toBe(false);

                    controller.roles.admin = true;
                    userStateSvc.showAddUser = true;
                    controller.add();
                    $timeout.flush();
                    expect(userManagerSvc.addUser).toHaveBeenCalledWith(controller.username, controller.password);
                    expect(userManagerSvc.addUserRole).toHaveBeenCalledWith(controller.username, 'user');
                    expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(controller.username, 'admingroup');
                    expect(controller.errorMessage).toBe('');
                    expect(userStateSvc.showAddUser).toBe(false);
                });
            });
        });
        it('should test the uniqueness of the entered user name', function() {
            controller.username = 'username';
            userManagerSvc.users = [{username: 'username'}];
            scope.$digest();
            controller.testUniqueness();
            expect(controller.infoForm.username.$invalid).toBe(true);

            controller.username = 'username1';
            scope.$digest();
            controller.testUniqueness();
            expect(controller.infoForm.username.$invalid).toBe(false);
        });
    });
    describe('fills the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<add-user-overlays></add-user-overlays>'))(scope);
            scope.$digest();
            $timeout.flush();
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('ADD-USER-OVERLAYS');
        });
        it('depending on the step', function() {
            expect(angular.element(this.element.querySelectorAll('.step-number')[0]).text().trim()).toBe('Step 1 of 2');
            expect(this.element.querySelectorAll('.add-user-info-overlay').length).toBe(1);
            expect(this.element.querySelectorAll('.add-user-perms-overlay').length).toBe(0);

            controller = this.element.controller('addUserOverlays');
            controller.step = 1;
            scope.$digest();
            expect(angular.element(this.element.querySelectorAll('.step-number')[0]).text().trim()).toBe('Step 2 of 2');
            expect(this.element.querySelectorAll('.add-user-info-overlay').length).toBe(0);
            expect(this.element.querySelectorAll('.add-user-perms-overlay').length).toBe(1);
        });
        it('with the correct classes based on the username validity', function() {
            controller = this.element.controller('addUserOverlays');
            var inputGroup = angular.element(this.element.querySelectorAll('.username')[0]);
            expect(inputGroup.hasClass('has-error')).toBe(false);

            controller.infoForm.username.$touched = true;
            controller.infoForm.username.$setValidity('uniqueName', false);
            scope.$digest();
            expect(inputGroup.hasClass('has-error')).toBe(true);
        });
        it('with a password confirm input', function() {
            expect(this.element.find('password-confirm-input').length).toBe(1);
        });
        it('with a user permissions input', function() {
            controller = this.element.controller('addUserOverlays');
            controller.step = 1;
            scope.$digest();
            expect(this.element.find('user-permissions-input').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            controller = this.element.controller('addUserOverlays');
            controller.step = 1;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(0);

            controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with custom buttons to go cancel and continue', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Next'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Next'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
        it('with custom buttons to go cancel and continue', function() {
            controller = this.element.controller('addUserOverlays');
            controller.step = 1;
            scope.$digest();
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Back', 'Add'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Back', 'Add'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});