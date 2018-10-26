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
describe('Edit Group Info Overlay directive', function() {
    var $compile, scope, $q, userManagerSvc, userStateSvc;

    beforeEach(function() {
        module('templates');
        module('editGroupInfoOverlay');
        mockUserManager();
        mockUserState();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _userStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
        });

        userStateSvc.selectedGroup = {title: 'group'};
        this.element = $compile(angular.element('<edit-group-info-overlay></edit-group-info-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editGroupInfoOverlay');
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
        describe('should save changes to the group information', function() {
            beforeEach(function() {
                userStateSvc.displayEditGroupInfoOverlay = true;
                userManagerSvc.groups = [userStateSvc.selectedGroup];
            });
            it('unless an error occurs', function() {
                userManagerSvc.updateGroup.and.returnValue($q.reject('Error message'));
                this.controller.set();
                scope.$apply();
                expect(userManagerSvc.updateGroup).toHaveBeenCalledWith(userStateSvc.selectedGroup.title, this.controller.newGroup);
                expect(this.controller.errorMessage).toBe('Error message');
                expect(userStateSvc.displayEditGroupInfoOverlay).toBe(true);
            });
            it('successfully', function() {
                var selectedGroup = userStateSvc.selectedGroup;
                this.controller.set();
                scope.$apply();
                expect(userManagerSvc.updateGroup).toHaveBeenCalledWith(selectedGroup.title, this.controller.newGroup);
                expect(this.controller.errorMessage).toBe('');
                expect(userStateSvc.displayEditGroupInfoOverlay).toBe(false);
                expect(userStateSvc.selectedGroup).toEqual(this.controller.newGroup);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('edit-group-info-overlay')).toBe(true);
            expect(this.element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a text area', function() {
            expect(this.element.find('text-area').length).toBe(1);
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
        expect(userStateSvc.displayEditGroupInfoOverlay).toBe(false);
    });
    it('should call set when the button is clicked', function() {
        spyOn(this.controller, 'set');
        var setButton = angular.element(this.element.querySelectorAll('.btn-container button.btn-primary')[0]);
        setButton.triggerHandler('click');
        expect(this.controller.set).toHaveBeenCalled();
    });
});