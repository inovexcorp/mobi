/*-
 * #%L
 * com.mobi.web
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
describe('Analytics Editor Page directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('analyticsEditorPage');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<analytics-editor-page></analytics-editor-page>'))(scope);
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
            expect(this.element.hasClass('analytics-editor-page')).toBe(true);
            expect(this.element.hasClass('h-100')).toBe(true);
            expect(this.element.hasClass('clearfix')).toBe(true);
        });
        it('with a .row', function() {
            expect(this.element.querySelectorAll('.row').length).toBe(1);
        });
        it('with a class-and-property-block', function() {
            expect(this.element.find('class-and-property-block').length).toBe(1);
        });
        it('with a analytics-editor', function() {
            expect(this.element.find('analytics-editor').length).toBe(1);
        });
    });
});