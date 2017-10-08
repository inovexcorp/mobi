/*-
 * #%L
 * com.mobi.web
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
describe('Query Tab directive', function() {
    var $compile, scope, element;

    beforeEach(function() {
        module('templates');
        module('queryTab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<query-tab></query-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('query-tab')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toEqual(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toEqual(1);
        });
        it('with a sparql-editor', function() {
            expect(element.find('sparql-editor').length).toEqual(1);
        });
        it('with a sparql-result-block', function() {
            expect(element.find('sparql-result-block').length).toEqual(1);
        });
    });
});