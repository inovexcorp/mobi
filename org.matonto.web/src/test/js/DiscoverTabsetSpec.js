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
describe('Discover Tabset directive', function() {
    var $compile, scope, element, discoverStateSvc;

    beforeEach(function() {
        module('templates');
        module('discoverTabset');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_, _discoverStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            discoverStateSvc = _discoverStateService_;
        });
        
        element = $compile(angular.element('<discover-tabset></discover-tabset>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('discover-tabset')).toBe(true);
        });
        it('with a tabset', function() {
            expect(element.find('tabset').length).toBe(1);
        });
        it('with tabs', function() {
            expect(element.find('tab').length).toBe(3);
        });
        it('with explore-tab', function() {
            expect(element.find('explore-tab').length).toBe(1);
        });
        it('with query-tab', function() {
            expect(element.find('query-tab').length).toBe(1);
        });
        it('with search-tab', function() {
            expect(element.find('discover-search-tab').length).toBe(1);
        });
    });
});