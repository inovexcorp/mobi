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
describe('Users Page directive', function() {
    var $compile,
        scope,
        userStateSvc;

    beforeEach(function() {
        module('templates');
        module('usersPage');
        mockUserState();
        
        inject(function(_userStateService_, _$compile_, _$rootScope_) {
            userStateSvc = _userStateService_;
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('contains the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<users-page></users-page>'))(scope);
            scope.$digest();
        });
        it('depending whether a user is being edited', function() {
            userStateSvc.editUser = true;
            scope.$digest();
            expect(this.element.find('user-editor').length).toBe(1);

            userStateSvc.editUser = false;
            scope.$digest();
            expect(this.element.find('user-editor').length).toBe(0);
        });
        it('depending whether the users list should be shown', function() {
            userStateSvc.showUsersList = true;
            scope.$digest();
            expect(this.element.find('users-list').length).toBe(1);

            userStateSvc.showUsersList = false;
            scope.$digest();
            expect(this.element.find('users-list').length).toBe(0);
        });
    });
});