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
describe('Edit User Profile Overlay directive', function() {
    var $compile, scope, $q, userManagerSvc, userStateSvc;

    beforeEach(function() {
        module('templates');
        module('editUserProfileOverlay');
        mockUserManager();
        mockUserState();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _userStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
        });

        userStateSvc.selectedUser = {username: 'user', firstName: 'John', lastName: 'Doe', email: 'mailto:example@example.com'};
        this.element = $compile(angular.element('<edit-user-profile-overlay></edit-user-profile-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editUserProfileOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        userStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        describe('should save changes to the user profile', function() {
            beforeEach(function() {
                userStateSvc.displayEditUserProfileOverlay = true;
                userManagerSvc.users = [userStateSvc.selectedUser];
            });
            it('unless an error occurs', function() {
                userManagerSvc.updateUser.and.returnValue($q.reject('Error message'));
                this.controller.set();
                scope.$apply();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(userStateSvc.selectedUser.username, this.controller.newUser);
                expect(this.controller.errorMessage).toBe('Error message');
                expect(userStateSvc.displayEditUserProfileOverlay).toBe(true);
            });
            it('successfully', function() {
                var selectedUser = userStateSvc.selectedUser;
                this.controller.set();
                scope.$apply();
                expect(userManagerSvc.updateUser).toHaveBeenCalledWith(selectedUser.username, this.controller.newUser);
                expect(this.controller.errorMessage).toBe('');
                expect(userStateSvc.displayEditUserProfileOverlay).toBe(false);
                expect(userStateSvc.selectedUser).toEqual(this.controller.newUser);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-user-profile-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with text inputs', function() {
            expect(this.element.find('text-input').length).toBe(2);
        });
        it('with an email input', function() {
            expect(this.element.find('email-input').length).toBe(1);
        });
        it('depending on the form validity', function() {
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
        it('with buttons to cancel and set', function() {
            var buttons = this.element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var cancelButton = angular.element(this.element.querySelectorAll('.btn-container button:not(.btn-primary)')[0]);
        cancelButton.triggerHandler('click');
        expect(userStateSvc.displayEditUserProfileOverlay).toBe(false);
    });
    it('should call set when the button is clicked', function() {
        spyOn(this.controller, 'set');
        var setButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        setButton.triggerHandler('click');
        expect(this.controller.set).toHaveBeenCalled();
    });
});