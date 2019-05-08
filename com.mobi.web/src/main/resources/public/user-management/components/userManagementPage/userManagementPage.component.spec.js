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
describe('User Management Page component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('user-management');
        mockComponent('user-management', 'usersPage');
        mockComponent('user-management', 'groupsPage');
        mockComponent('user-management', 'permissionsPage');
        mockUserState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<user-management-page></user-management-page>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('USER-MANAGEMENT-PAGE');
            expect(this.element.querySelectorAll('.user-management-page').length).toEqual(1);
        });
        it('with a material-tabset', function() {
            expect(this.element.find('material-tabset').length).toBe(1);
        });
        it('with material-tabs', function() {
            expect(this.element.find('material-tab').length).toBe(3);
        });
    });
});