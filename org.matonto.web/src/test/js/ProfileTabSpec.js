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
describe('Profile Tab directive', function() {
    var $compile,
        scope,
        userManagerSvc,
        loginManagerSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('profileTab');
        mockUserManager();
        mockLoginManager();

        inject(function(_userManagerService_, _loginManagerService_, _$compile_, _$rootScope_) {
            userManagerSvc = _userManagerService_;
            loginManagerSvc = _loginManagerService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    it('should initialize with the current user', function() {
        loginManagerSvc.currentUser = 'user';
        userManagerSvc.users = [{username: 'user'}];
        var element = $compile(angular.element('<profile-tab></profile-tab>'))(scope);
        scope.$digest();
        controller = element.controller('profileTab');
        expect(controller.currentUser).toEqual(userManagerSvc.users[0]);
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            loginManagerSvc.currentUser = 'user';
            userManagerSvc.users = [{username: 'user'}];
            this.element = $compile(angular.element('<profile-tab></profile-tab>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('profile-tab')).toBe(true);
        });
    });
});