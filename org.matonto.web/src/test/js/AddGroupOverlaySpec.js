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
describe('Add Group Overlay directive', function() {
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
        module('addGroupOverlay');
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
        var element = $compile(angular.element('<add-group-overlay></add-group-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('addGroupOverlay');
        expect(controller.members).toContain(loginManagerSvc.currentUser);
    });
    describe('controller methods', function() {
        beforeEach(function() {
            loginManagerSvc.currentUser = 'user';
            this.element = $compile(angular.element('<add-group-overlay></add-group-overlay>'))(scope);
            scope.$digest();
            controller = this.element.controller('addGroupOverlay');
        });
        describe('should add a group with the name and members entered', function() {
            beforeEach(function() {
                controller.name = 'groupName'
                controller.members = ['user'];
                userStateSvc.showAddGroup = true;
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
                expect(userStateSvc.showAddGroup).not.toBe(false);

                userManagerSvc.addUserGroup.calls.reset();
                userManagerSvc.addGroup.and.returnValue($q.reject('Error Message'));
                controller.add();
                $timeout.flush();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(controller.name);
                expect(userManagerSvc.addUserGroup).not.toHaveBeenCalled();
                expect(controller.errorMessage).toBe('Error Message');
                expect(userStateSvc.showAddGroup).not.toBe(false);
            });
            it('successfully', function() {
                controller.add();
                $timeout.flush();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(controller.name);
                _.forEach(controller.members, function(member) {
                    expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(member, controller.name);
                });
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.showAddGroup).toBe(false);
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
            this.element = $compile(angular.element('<add-group-overlay></add-group-overlay>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('add-group-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a member table', function() {
            expect(this.element.find('member-table').length).toBe(1);
        });
        it('with the correct classes based on the form validity', function() {
            controller = this.element.controller('addGroupOverlay');
            var inputGroup = angular.element(this.element.querySelectorAll('.name')[0]);
            expect(inputGroup.hasClass('has-error')).toBe(false);

            controller.form.name.$touched = true;
            controller.form.name.$setValidity('uniqueName', false);
            scope.$digest();
            expect(inputGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            controller = this.element.controller('addGroupOverlay');
            controller.errorMessage = 'Error message';
            scope.$digest();
            expect(this.element.find('error-display').length).toBe(1);
        });
        it('with custom buttons to go back and continue', function() {
            var buttons = this.element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Add'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Cancel', 'Add'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});