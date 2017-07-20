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
describe('Error Display directive', function() {
    var $compile, element, scope;

    beforeEach(function() {
        module('templates');
        module('errorDisplay');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        element = $compile(angular.element('<error-display></error-display>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping-containers', function() {
            expect(element.prop('tagName')).toBe('P');
            expect(element.hasClass('error-display')).toBe(true);
        });
        it('with a i.fa-exclamation-triangle', function() {
            var items = element.find('i');
            expect(items.length).toBe(1);
            expect(items.hasClass('fa-exclamation-triangle')).toEqual(true);
        });
        it('with a span', function() {
            expect(element.find('span').length).toBe(1);
        });
    });
});