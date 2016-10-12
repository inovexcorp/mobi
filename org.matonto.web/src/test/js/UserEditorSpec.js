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
/*describe('User Editor directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        loginManagerSvc,
        $timeout,
        $q,
        controller;

    beforeEach(function() {
        module('templates');
        module('userEditor');
        mockUserManager();
        mockLoginManager();
        mockUserState();

        inject(function(_userManagerService_, _userStateService_, _loginManagerService_, _$timeout_, _$q_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            $timeout = _$timeout_;
            $q = _$q_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    it('should initialize the user roles correctly', function() {
        userManagerSvc.isAdmin.and.returnValue(false);
        userStateSvc.selectedUser = {username: ''};
        var element = $compile(angular.element('<user-editor></user-editor>'))(scope);
        scope.$digest();
        controller = element.controller('userEditor');
        expect(controller.roles.admin).toBe(false);
    });
    describe('controller methods', function() {
        beforeEach(function() {
            userStateSvc.selectedUser = {username: ''};
            this.element = $compile(angular.element('<user-editor></user-editor>'))(scope);
            scope.$digest();
            controller = this.element.controller('userEditor');
        });
        describe('should correctly save changes to the user', function() {
            beforeEach(function() {
                spyOn(controller.form, '$setPristine');
                spyOn(controller.form, '$setUntouched');
            });
            describe('if the password has been changed', function() {
                beforeEach(function() {
                    this.password = controller.password = 'test';
                });
                it('unless an error occurs', function() {
                    userManagerSvc.updateUser.and.returnValue($q.reject('Error message'));
                    controller.save();
                    $timeout.flush();
                    expect(userManagerSvc.updateUser).toHaveBeenCalledWith(userStateSvc.selectedUser.username, undefined, this.password);
                    expect(controller.errorMessage).toBe('Error message');
                    expect(controller.success).toBe(false);
                });
                it('successfully', function() {
                    controller.save();
                    $timeout.flush();
                    expect(userManagerSvc.updateUser).toHaveBeenCalledWith(userStateSvc.selectedUser.username, undefined, this.password);
                    expect(controller.errorMessage).toBe('');
                    expect(controller.success).toBe(true);
                    expect(controller.password).toBe('');
                    expect(controller.toConfirm).toBe('');
                    expect(controller.form.$setPristine).toHaveBeenCalled();
                    expect(controller.form.$setUntouched).toHaveBeenCalled();
                });
            });
            describe('if the user admin role', function() {
                describe('has been added', function() {
                    beforeEach(function() {
                        userManagerSvc.isAdmin.and.returnValue(false);
                        controller.roles.admin = true;
                    });
                    it('unless an error occurs', function() {
                        userManagerSvc.addUserGroup.and.returnValue($q.reject('Error message'));
                        controller.save();
                        $timeout.flush();
                        expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admingroup');
                        expect(controller.errorMessage).toBe('Error message');
                        expect(controller.success).toBe(false);
                    });
                    it('successfully', function() {
                        controller.save();
                        $timeout.flush();
                        expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admingroup');
                        expect(controller.errorMessage).toBe('');
                        expect(controller.success).toBe(true);
                        expect(controller.password).toBe('');
                        expect(controller.toConfirm).toBe('');
                        expect(controller.form.$setPristine).toHaveBeenCalled();
                        expect(controller.form.$setUntouched).toHaveBeenCalled();
                    });
                });
                describe('has been removed', function() {
                    beforeEach(function() {
                        userManagerSvc.isAdmin.and.returnValue(true);
                        controller.roles.admin = false;
                    });
                    it('unless an error occurs', function() {
                        userManagerSvc.deleteUserRole.and.returnValue($q.reject('Error message'));
                        controller.save();
                        $timeout.flush();
                        expect(userManagerSvc.deleteUserRole).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admin');
                        expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admingroup');
                        expect(controller.errorMessage).toBe('Error message');
                        expect(controller.success).toBe(false);

                        controller.errorMessage = '';
                        controller.success = true;
                        userManagerSvc.deleteUserRole.and.returnValue($q.resolve());
                        userManagerSvc.deleteUserGroup.and.returnValue($q.reject('Error message'));
                        controller.save();
                        $timeout.flush();
                        expect(userManagerSvc.deleteUserRole).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admin');
                        expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admingroup');
                        expect(controller.errorMessage).toBe('Error message');
                        expect(controller.success).toBe(false);
                    });
                    it('successfully', function() {
                        controller.save();
                        $timeout.flush();
                        expect(userManagerSvc.deleteUserRole).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admin');
                        expect(userManagerSvc.deleteUserGroup).toHaveBeenCalledWith(userStateSvc.selectedUser.username, 'admingroup');
                        expect(controller.errorMessage).toBe('');
                        expect(controller.success).toBe(true);
                        expect(controller.password).toBe('');
                        expect(controller.toConfirm).toBe('');
                        expect(controller.form.$setPristine).toHaveBeenCalled();
                        expect(controller.form.$setUntouched).toHaveBeenCalled();
                    });
                });
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            userManagerSvc.isAdmin.and.returnValue(true);
            userStateSvc.selectedUser = {username: ''};
            this.element = $compile(angular.element('<user-editor></user-editor>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('user-editor')).toBe(true);
        });
        it('with a password confirm input', function() {
            expect(this.element.find('password-confirm-input').length).toBe(1);
        });
        it('with a user permissions input', function() {
            expect(this.element.find('user-permissions-input').length).toBe(1);
        });
        it('depending on whether an error has occured', function() {
            expect(this.element.find('error-display').length).toBe(0);

            controller = this.element.controller('userEditor');
            controller.errorMessage = 'Test';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('depending on whether changes were successfully saved', function() {
            expect(this.element.querySelectorAll('.text-success').length).toBe(0);

            controller = this.element.controller('userEditor');
            controller.success = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.text-success').length).toBe(1);
        });
        it('depending on the form validity', function() {
            expect(this.element.querySelectorAll('.save-btn').attr('disabled')).toBeFalsy();

            controller = this.element.controller('userEditor');
            controller.form.$invalid = true;
            scope.$digest();
            expect(this.element.querySelectorAll('.save-btn').attr('disabled')).toBeTruthy();
        });
    });
    it('should save changes when the save button is clicked', function() {
        userManagerSvc.isAdmin.and.returnValue(true);
        userStateSvc.selectedUser = {username: ''};
        var element = $compile(angular.element('<user-editor></user-editor>'))(scope);
        scope.$digest();
        controller = element.controller('userEditor');
        spyOn(controller, 'save');

        var button = angular.element(element.querySelectorAll('.save-btn')[0]);
        button.triggerHandler('click');
        expect(controller.save).toHaveBeenCalled();
    });
});*/