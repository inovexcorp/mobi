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
describe('Individuals Tab directive', function() {
    var $compile,
        scope,
        element;

    beforeEach(function() {
        module('templates');
        module('individualsTab');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<individuals-tab></individuals-tab>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('individuals-tab')).toBe(true);
            expect(element.hasClass('row')).toBe(true);
        });
        it('with a individual-hierarchy-block', function() {
            expect(element.find('individual-hierarchy-block').length).toBe(1);
        });
        it('with a .editor', function() {
            expect(element.querySelectorAll('.editor').length).toBe(1);
        });
        it('with a selected-details', function() {
            expect(element.find('selected-details').length).toBe(1);
        });
        it('with a datatype-property-block', function() {
            expect(element.find('datatype-property-block').length).toBe(1);
        });
        it('with a object-property-block', function() {
            expect(element.find('object-property-block').length).toBe(1);
        });
        it('with a annotation-block', function() {
            expect(element.find('annotation-block').length).toBe(1);
        });
    });
});