/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
describe('Edit Group Info Overlay component', function() {
    var $compile, scope, $q, userManagerSvc, userStateSvc, prefixes;

    beforeEach(function() {
        module('templates');
        module('user-management');
        mockUserManager();
        mockUserState();
        mockUtil();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$q_, _userManagerService_, _userStateService_, _prefixes_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $q = _$q_;
            userManagerSvc = _userManagerService_;
            userStateSvc = _userStateService_;
            prefixes = _prefixes_;
        });

        userStateSvc.selectedGroup = {
            jsonld: {
                [prefixes.dcterms + 'title']: [{'@value': 'John'}],
                [prefixes.dcterms + 'description']: [{'@value': 'Doe'}]
            },
            title: 'group'};
        scope.close = jasmine.createSpy('close');
        scope.dismiss = jasmine.createSpy('dismiss');
        this.element = $compile(angular.element('<edit-group-info-overlay close="close()" dismiss="dismiss()"></edit-group-info-overlay>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('editGroupInfoOverlay');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $q = null;
        userManagerSvc = null;
        userStateSvc = null;
        prefixes = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('close should be called in the parent scope', function() {
            this.controller.close();
            expect(scope.close).toHaveBeenCalled();
        });
        it('dismiss should be called in the parent scope', function() {
            this.controller.dismiss();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('controller methods', function() {
        describe('should save changes to the group information', function() {
            beforeEach(function() {
                userManagerSvc.groups = [userStateSvc.selectedGroup];
            });
            it('unless an error occurs', function() {
                userManagerSvc.updateGroup.and.returnValue($q.reject('Error message'));
                this.controller.set();
                scope.$apply();
                expect(userManagerSvc.updateGroup).toHaveBeenCalledWith(userStateSvc.selectedGroup.title, this.controller.newGroup);
                expect(this.controller.errorMessage).toBe('Error message');
                expect(scope.close).not.toHaveBeenCalled();
            });
            it('successfully', function() {
                var selectedGroup = userStateSvc.selectedGroup;
                this.controller.set();
                scope.$apply();
                expect(userManagerSvc.updateGroup).toHaveBeenCalledWith(selectedGroup.title, this.controller.newGroup);
                expect(this.controller.errorMessage).toBe('');
                expect(userStateSvc.selectedGroup).toEqual(this.controller.newGroup);
                expect(scope.close).toHaveBeenCalled();
            });
        });
        it('should cancel the overlay', function() {
            this.controller.cancel();
            expect(scope.dismiss).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('EDIT-GROUP-INFO-OVERLAY');
            expect(this.element.querySelectorAll('.modal-header').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-body').length).toEqual(1);
            expect(this.element.querySelectorAll('.modal-footer').length).toEqual(1);
        });
        ['form', 'text-area'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('depending on the form validity', function() {
            var button = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
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
            var buttons = this.element.querySelectorAll('.modal-footer button');
            expect(buttons.length).toBe(2);
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[0]).text().trim());
            expect(['Cancel', 'Submit']).toContain(angular.element(buttons[1]).text().trim());
        });
    });
    it('should set the correct state when the cancel button is clicked', function() {
        spyOn(this.controller, 'cancel');
        var cancelButton = angular.element(this.element.querySelectorAll('.modal-footer button:not(.btn-primary)')[0]);
        cancelButton.triggerHandler('click');
        expect(this.controller.cancel).toHaveBeenCalled();
    });
    it('should call set when the button is clicked', function() {
        spyOn(this.controller, 'set');
        var setButton = angular.element(this.element.querySelectorAll('.modal-footer button.btn-primary')[0]);
        setButton.triggerHandler('click');
        expect(this.controller.set).toHaveBeenCalled();
    });
});