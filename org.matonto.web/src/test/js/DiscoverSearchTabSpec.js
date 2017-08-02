/*-
 * #%L
 * org.matonto.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2017 iNovex Information Systems, Inc.
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
describe('Discover Search Tab directive', function() {
    var $compile, scope, element;

    beforeEach(function() {
        module('templates');
        module('discoverSearchTab');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<discover-search-tab></discover-search-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('discover-search-tab')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
        });
        it('with a search-form', function() {
            expect(element.find('search-form').length).toEqual(1);
        });
        it('with a block', function() {
            expect(element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toEqual(1);
        });
        it('with a sparql-result-table', function() {
            expect(element.find('sparql-result-table').length).toEqual(1);
        });
    });
});