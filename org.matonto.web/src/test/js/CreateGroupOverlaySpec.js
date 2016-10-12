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
describe('Create Group Overlay directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        userStateSvc,
        loginManagerSvc,
        $q,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('createGroupOverlay');
        mockUserManager();
        mockLoginManager();
        mockUserState();

        inject(function(_userManagerService_, _userStateService_, _loginManagerService_, _$timeout_, _$q_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            $q = _$q_;
            $timeout = _$timeout_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    it('should intialize with the correct value for members', function() {
        loginManagerSvc.currentUser = 'user';
        var element = $compile(angular.element('<create-group-overlay></create-group-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createGroupOverlay');
        expect(controller.members).toContain(loginManagerSvc.currentUser);
    });
    describe('controller methods', function() {
        beforeEach(function() {
            loginManagerSvc.currentUser = 'user';
            this.element = $compile(angular.element('<create-group-overlay></create-group-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('createGroupOverlay');
        });
        describe('should add a group with the name and members entered', function() {
            beforeEach(function() {
                controller.name = 'groupName'
                controller.members = ['user'];
                userStateSvc.displayCreateGroupOverlay = true;
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUserGroup.and.returnValue($q.reject('Error Message'));
                controller.add();
                $timeout.flush();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(controller.name);
                _.forEach(controller.members, function(member) {
                    expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(member, controller.name);
                });
                expect(controller.errorMessage).toBe('Error Message');
                expect(userStateSvc.displayCreateGroupOverlay).not.toBe(false);

                userManagerSvc.addUserGroup.calls.reset();
                userManagerSvc.addGroup.and.returnValue($q.reject('Error Message'));
                controller.add();
                $timeout.flush();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(controller.name);
                expect(userManagerSvc.addUserGroup).not.toHaveBeenCalled();
                expect(controller.errorMessage).toBe('Error Message');
                expect(userStateSvc.displayCreateGroupOverlay).not.toBe(false);
            });
            it('successfully', function() {
                controller.add();
                $timeout.flush();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(controller.name);
                _.forEach(controller.members, function(member) {
                    expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(member, controller.name);
                });
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.displayCreateGroupOverlay).toBe(false);
            });
        });
        it('should test the uniqueness of the entered group name', function() {
            controller.name = 'group';
            userManagerSvc.groups = [{name: 'group'}];
            scope.$digest();
            controller.testUniqueness();
            expect(controller.form.name.$invalid).toBe(true);

            controller.name = 'group1';
            scope.$digest();
            controller.testUniqueness();
            expect(controller.form.name.$invalid).toBe(false);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            loginManagerSvc.currentUser = 'user';
            this.element = $compile(angular.element('<create-group-overlay></create-group-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('create-group-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a member table', function() {
            expect(this.element.find('member-table').length).toBe(1);
        });
        it('depending on the form validity', function() {
            controller = this.element.controller('createGroupOverlay');
            controller.name = 'group';
            scope.$digest();
            var inputGroup = angular.element(this.element.querySelectorAll('.name')[0]);
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(inputGroup.hasClass('has-error')).toBe(false);
            expect(button.attr('disabled')).toBeFalsy();

            controller.form.name.$touched = true;
            controller.form.name.$setValidity('uniqueName', false);
            scope.$digest();
            expect(inputGroup.hasClass('has-error')).toBe(true);
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            controller = this.element.controller('createGroupOverlay');
            controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with buttons to cancel and add', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Add']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should call add when the button is clicked', function() {
        var element = $compile(angular.element('<create-group-overlay></create-group-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('createGroupOverlay');
        controller.name = 'group';
        spyOn(controller, 'add');
        scope.$digest();

        var continueButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(controller.add).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var element = $compile(angular.element('<create-group-overlay></create-group-overlay>'))(scope);
        scope.$digest();

        var cancelButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        cancelButton.triggerHandler('click');
        expect(userStateSvc.displayCreateGroupOverlay).toBe(false);
    });
});