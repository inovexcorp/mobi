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
describe('Groups Tab directive', function() {
    var $compile,
        scope,
        userStateSvc;

    beforeEach(function() {
        module('templates');
        module('groupsTab');
        mockUserState();

        inject(function(_$compile_, _$rootScope_, _userStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            userStateSvc = _userStateService_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<groups-tab></groups-tab>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('groups-tab')).toBe(true);
        });
        it('with a tabset', function() {
            var tabset = this.element.find('tabset');
            expect(tabset.length).toBe(1);
            expect(tabset.hasClass('centered')).toBe(true);
        });
        it('with tabs', function() {
            expect(this.element.find('tab').length).toBe(2);
        });
        it('with a groups page', function() {
            expect(this.element.find('groups-page').length).toBe(2);
        });
    });
});