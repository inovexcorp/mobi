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
describe('Annotation Editor directive', function() {
    var $compile,
        element,
        scope;

    beforeEach(function() {
        module('templates');
        module('annotationEditor');
        mockStateManager();
        injectRemoveMatontoFilter();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            element = $compile(angular.element('<annotation-editor></annotation-editor>'))(scope);
            scope.$digest();
        });
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .annotation-preview', function() {
            expect(element.hasClass('annotation-preview')).toBe(true);
        });
        it('based on h3', function() {
            var headers = element.find('h3');
            expect(headers.length).toBe(1);
        });
        it('based on pre', function() {
            var pres = element.find('pre');
            expect(pres.length).toBe(1);
        });
        it('based on .tab', function() {
            var tabs = element.querySelectorAll('.tab');
            expect(tabs.length).toBe(1);
        });
    });
});