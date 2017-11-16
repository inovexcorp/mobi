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
describe('Create Group Overlay directive', function() {
    var $compile, scope, $q, userManagerSvc, userStateSvc, loginManagerSvc;

    beforeEach(function() {
        module('templates');
        module('createGroupOverlay');
        mockUserManager();
        mockLoginManager();
        mockUserState();

        inject(function(_$compile_, _$rootScope_, _userManagerService_, _userStateService_, _loginManagerService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            loginManagerSvc = _loginManagerService_;
            $q = _$q_;
        });

        loginManagerSvc.currentUser = 'user';
        this.element = $compile(angular.element('<create-group-overlay></create-group-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('createGroupOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        userStateSvc = null;
        loginManagerSvc = null;
        this.element.remove();
    });

    it('should intialize with the correct value for members', function() {
        expect(this.controller.newGroup.members).toContain(loginManagerSvc.currentUser);
    });
    describe('controller methods', function() {
        it('should get the list of used group titles', function() {
            userManagerSvc.groups = [{title: 'group'}];
            var titles = this.controller.getTitles();
            expect(titles.length).toBe(userManagerSvc.groups.length);
            _.forEach(titles, function(title, idx) {
                expect(title).toBe(userManagerSvc.groups[idx].title);
            });
        });
        describe('should add a group with the entered information', function() {
            beforeEach(function() {
                this.controller.newGroup = {title: 'title', description: 'Description', members: ['user']};
                userStateSvc.displayCreateGroupOverlay = true;
            });
            it('unless an error occurs', function() {
                userManagerSvc.addGroupUsers.and.returnValue($q.reject('Error Message'));
                this.controller.add();
                scope.$apply();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(this.controller.newGroup);
                expect(userManagerSvc.addGroupUsers).toHaveBeenCalledWith(this.controller.newGroup.title, this.controller.newGroup.members);
                expect(this.controller.errorMessage).toBe('Error Message');
                expect(userStateSvc.displayCreateGroupOverlay).not.toBe(false);

                userManagerSvc.addGroupUsers.calls.reset();
                userManagerSvc.addGroup.and.returnValue($q.reject('Error Message'));
                this.controller.add();
                scope.$apply();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(this.controller.newGroup);
                expect(userManagerSvc.addGroupUsers).not.toHaveBeenCalled();
                expect(this.controller.errorMessage).toBe('Error Message');
                expect(userStateSvc.displayCreateGroupOverlay).not.toBe(false);
            });
            it('successfully', function() {
                this.controller.add();
                scope.$apply();
                expect(userManagerSvc.addGroup).toHaveBeenCalledWith(this.controller.newGroup);
                expect(userManagerSvc.addGroupUsers).toHaveBeenCalledWith(this.controller.newGroup.title, this.controller.newGroup.members);
                expect(this.controller.errorMessage).toBe('');
                expect(userStateSvc.displayCreateGroupOverlay).toBe(false);
            });
        });
        it('should add a member to the new group', function() {
            userStateSvc.memberName = 'John';
            this.controller.addMember();
            expect(this.controller.newGroup.members).toContain('John');
            expect(userStateSvc.memberName).toBe('');
        });
        it('should remove a member from the new group', function() {
            userStateSvc.memberName = 'user';
            this.controller.removeMember();
            expect(this.controller.newGroup.members).not.toContain('user');
            expect(userStateSvc.memberName).toBe('');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('create-group-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a member table', function() {
            expect(this.element.find('member-table').length).toBe(1);
        });
        it('with a text area for the group description', function() {
            expect(this.element.find('text-area').length).toBe(1);
        });
        it('depending on the title field validity', function() {
            scope.$digest();
            var inputGroup = angular.element(this.element.querySelectorAll('.title')[0]);
            expect(inputGroup.hasClass('has-error')).toBe(false);

            this.controller.form.title.$setDirty();
            this.controller.form.title.$touched = true;
            scope.$digest();
            expect(inputGroup.hasClass('has-error')).toBe(true);
        });
        it('depending on the form validity', function() {
            this.controller.form.$invalid = false;
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            this.controller.form.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there is an error', function() {
            expect(this.element.find('error-display').length).toBe(0);
            this.controller.errorMessage = 'Error message';
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
        this.controller.name = 'group';
        spyOn(this.controller, 'add');
        scope.$digest();

        var continueButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        continueButton.triggerHandler('click');
        expect(this.controller.add).toHaveBeenCalled();
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var cancelButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-default')[0]);
        cancelButton.triggerHandler('click');
        expect(userStateSvc.displayCreateGroupOverlay).toBe(false);
    });
});