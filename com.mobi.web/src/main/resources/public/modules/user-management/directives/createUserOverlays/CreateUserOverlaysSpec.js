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
describe('Create User Overlays directive', function() {
    var $compile, $q, scope, userManagerSvc, userStateSvc;

    beforeEach(function() {
        module('templates');
        module('createUserOverlays');
        injectRegexConstant();
        mockUserManager();
        mockUserState();

        inject(function( _$compile_, _$rootScope_, _userManagerService_, _userStateService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            $q = _$q_;
        });

        this.element = $compile(angular.element('<create-user-overlays></create-user-overlays>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createUserOverlays');
    });

    afterEach(function() {
        $compile = null;
        $q = null;
        scope = null;
        userManagerSvc = null;
        userStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        it('should get the list of used usernames', function() {
            userManagerSvc.users = [{username: 'user'}];
            var usernames = this.controller.getUsernames();
            expect(usernames.length).toBe(userManagerSvc.users.length);
            _.forEach(usernames, function(username, idx) {
                expect(username).toBe(userManagerSvc.users[idx].username);
            });
        });
        describe('should add a user with the entered information', function() {
            beforeEach(function() {
                this.controller.newUser = {username: 'username', firstName: 'John', lastName: "Doe", email: 'example@example.com'};
                this.controller.password = 'password';
                userStateSvc.displayCreateUserOverlay = true;
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUser.and.returnValue($q.reject('Error Message'));
                this.controller.add();
                scope.$apply()
                expect(userManagerSvc.addUser).toHaveBeenCalledWith(this.controller.newUser, this.controller.password);
                expect(this.controller.errorMessage).toBe('Error Message');
                expect(userStateSvc.displayCreateUserOverlay).not.toBe(false);
            });
            describe('and the correct roles and groups', function() {
                it('unless an error occurs', function() {
                    userManagerSvc.addUserRoles.and.returnValue($q.reject('Error Message'));
                    this.controller.add();
                    scope.$apply()
                    expect(userManagerSvc.addUser).toHaveBeenCalledWith(this.controller.newUser, this.controller.password);
                    expect(userManagerSvc.addUserRoles).toHaveBeenCalledWith(this.controller.newUser.username, ['user']);
                    expect(this.controller.errorMessage).toBe('Error Message');
                    expect(userStateSvc.displayCreateUserOverlay).not.toBe(false);
                });
                it('successfully', function() {
                    this.controller.add();
                    scope.$apply()
                    expect(userManagerSvc.addUser).toHaveBeenCalledWith(this.controller.newUser, this.controller.password);
                    expect(userManagerSvc.addUserRoles).toHaveBeenCalledWith(this.controller.newUser.username, ['user']);
                    expect(this.controller.errorMessage).toBe('');
                    expect(userStateSvc.displayCreateUserOverlay).toBe(false);

                    this.controller.roles.admin = true;
                    userStateSvc.displayCreateUserOverlay = true;
                    this.controller.add();
                    scope.$apply()
                    expect(userManagerSvc.addUser).toHaveBeenCalledWith(this.controller.newUser, this.controller.password);
                    expect(userManagerSvc.addUserRoles).toHaveBeenCalledWith(this.controller.newUser.username, ['user', 'admin']);
                    expect(this.controller.errorMessage).toBe('');
                    expect(userStateSvc.displayCreateUserOverlay).toBe(false);
                });
            });
        });
    });
    describe('fills the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('CREATE-USER-OVERLAYS');
        });
        it('depending on the step', function() {
            expect(this.element.querySelectorAll('.create-user-info-overlay').length).toBe(1);
            expect(this.element.querySelectorAll('.create-user-perms-overlay').length).toBe(0);

            this.controller.step = 1;
            scope.$digest();
            expect(this.element.querySelectorAll('.create-user-info-overlay').length).toBe(0);
            expect(this.element.querySelectorAll('.create-user-perms-overlay').length).toBe(1);
        });
        it('with a step progress bar', function() {
            expect(this.element.find('step-progress-bar').length).toBe(1);
        });
        it('with the correct classes based on the username field validity', function() {
            scope.$digest();
            var usernameInput = angular.element(this.element.querySelectorAll('.username input')[0]);
            expect(usernameInput.hasClass('is-invalid')).toBe(false);

            this.controller.newUser.username = '$';
            this.controller.infoForm.username.$setDirty();
            scope.$digest();
            expect(usernameInput.hasClass('is-invalid')).toBe(true);
        });
        it('with the correct classes based on the info form validity', function() {
            this.controller.infoForm.$invalid = false;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.infoForm.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with the correct classes based on the permission form validity', function() {
            this.controller.step = 1;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.permissionForm.$setValidity('test', false);
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('with a password confirm input', function() {
            expect(this.element.find('password-confirm-input').length).toBe(1);
        });
        it('with text inputs', function() {
            expect(this.element.find('text-input').length).toBe(2);
        });
        it('with an email input', function() {
            expect(this.element.find('email-input').length).toBe(1);
        });
        it('with a permissions input', function() {
            this.controller.step = 1;
            scope.$digest();
            expect(this.element.find('permissions-input').length).toBe(1);
        });
        it('depending on whether there is an error', function() {
            this.controller.step = 1;
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(0);

            this.controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with buttons to cancel and go to the next overlay', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Next']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Next']).toContain(angular.element(buttons[1]).text().trim());
        });
        it('with buttons to go back and add', function() {
            this.controller.step = 1;
            scope.$digest();
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Back', 'Add']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Back', 'Add']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var cancelButton = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        cancelButton.triggerHandler('click');
        expect(userStateSvc.displayCreateUserOverlay).toBe(false);
    });
    it('should set the correct state when the next button is clicked', function() {
        var nextButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        nextButton.triggerHandler('click');
        expect(this.controller.step).toBe(1);
    });
    it('should set the correct state when the back button is clicked', function() {
        this.controller.step = 1;
        scope.$digest();

        var backButton = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        backButton.triggerHandler('click');
        expect(this.controller.step).toBe(0);
    });
    it('should call add when the button is clicked', function() {
        this.controller.step = 1;
        spyOn(this.controller, 'add');
        scope.$digest();

        var addButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        addButton.triggerHandler('click');
        expect(this.controller.add).toHaveBeenCalled();
    });
});