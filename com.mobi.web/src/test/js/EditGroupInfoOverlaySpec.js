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
    var $compile,
        scope,
        $q,
        element,
        controller,
        userManagerSvc,
        userStateSvc;

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
        element = $compile(angular.element('<edit-group-info-overlay></edit-group-info-overlay>'))(scope);
        scope.$digest();
        controller = element.controller('editGroupInfoOverlay');
    });

    describe('controller methods', function() {
        describe('should save changes to the group information', function() {
            beforeEach(function() {
                userStateSvc.displayEditGroupInfoOverlay = true;
                userManagerSvc.groups = [userStateSvc.selectedGroup];
            });
            it('unless an error occurs', function() {
                userManagerSvc.updateGroup.and.returnValue($q.reject('Error message'));
                controller.set();
                scope.$apply();
                expect(userManagerSvc.updateGroup).toHaveBeenCalledWith(userStateSvc.selectedGroup.title, controller.newGroup);
                expect(controller.errorMessage).toBe('Error message');
                expect(userStateSvc.displayEditGroupInfoOverlay).toBe(true);
            });
            it('successfully', function() {
                var selectedGroup = userStateSvc.selectedGroup;
                controller.set();
                scope.$apply();
                expect(userManagerSvc.updateGroup).toHaveBeenCalledWith(selectedGroup.title, controller.newGroup);
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.displayEditGroupInfoOverlay).toBe(false);
                expect(userStateSvc.selectedGroup).toEqual(controller.newGroup);
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('edit-group-info-overlay')).toBe(true);
            expect(element.querySelectorAll('form.content').length).toBe(1);
        });
        it('with a text area', function() {
            expect(element.find('text-area').length).toBe(1);
        });
        it('depending on the form validity', function() {
            var button = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            controller.form.$invalid = true;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there is an error', function() {
            expect(element.find('error-display').length).toBe(0);
            controller.errorMessage = 'Error message';
            scope.$digest();
            expect(element.find('error-display').length).toBe(1);
        });
        it('with buttons to cancel and set', function() {
            var buttons = element.querySelectorAll('.btn-container button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Set']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should set the correct state when the cancel button is clicked', function() {
        var cancelButton = angular.element(element.querySelectorAll('.btn-container button.btn-default')[0]);
        cancelButton.triggerHandler('click');
        expect(userStateSvc.displayEditGroupInfoOverlay).toBe(false);
    });
    it('should call set when the button is clicked', function() {
        spyOn(controller, 'set');
        var setButton = angular.element(element.querySelectorAll('.btn-container button.btn-primary')[0]);
        setButton.triggerHandler('click');
        expect(controller.set).toHaveBeenCalled();
    });
});