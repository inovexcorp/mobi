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
/*describe('Group Editor directive', function() {
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
        module('groupEditor');
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

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<group-editor></group-editor>'))(scope);
            scope.$digest();
            controller = this.element.controller('groupEditor');
        });
        it('should set the correct state for removing a member', function() {
            controller.removeMember();
            expect(userStateSvc.showRemoveMemberConfirm).toBe(true);
        });
        describe('should add a group member', function() {
            beforeEach(function() {
                this.username = userStateSvc.memberName = 'user';
                userStateSvc.selectedGroup = {name: 'group'};
            });
            it('unless an error occurs', function() {
                userManagerSvc.addUserGroup.and.returnValue($q.reject('Error message'));
                controller.addMember();
                $timeout.flush();
                expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(this.username, userStateSvc.selectedGroup.name);
                expect(userStateSvc.memberName).toBe(this.username);
                expect(controller.errorMessage).toBe('Error message');
            });
            it('successfully', function() {
                controller.addMember();
                $timeout.flush();
                expect(userManagerSvc.addUserGroup).toHaveBeenCalledWith(this.username, userStateSvc.selectedGroup.name);
                expect(controller.errorMessage).toBe('');
                expect(userStateSvc.memberName).toBe('');
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<group-editor></group-editor>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('group-editor')).toBe(true);
        });
        it('with a member table', function() {
            expect(this.element.find('member-table').length).toBe(1);
        });
    });
});*/