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
describe('Discover Search Tab directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('discoverSearchTab');
        mockDiscoverState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<discover-search-tab></discover-search-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('discover-search-tab')).toBe(true);
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a search-form', function() {
            expect(this.element.find('search-form').length).toEqual(1);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toEqual(1);
        });
        it('with a sparql-result-table', function() {
            expect(this.element.find('sparql-result-table').length).toEqual(1);
        });
    });
});