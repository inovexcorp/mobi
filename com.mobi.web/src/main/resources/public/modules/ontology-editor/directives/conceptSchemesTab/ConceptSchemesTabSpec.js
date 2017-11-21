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
describe('Concept Schemes Tab directive', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('conceptSchemesTab');
        mockOntologyManager();
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        this.element = $compile(angular.element('<concept-schemes-tab></concept-schemes-tab>'))(scope);
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
            expect(this.element.hasClass('concept-schemes-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a concept-scheme-hierarchy-block', function() {
            expect(this.element.find('concept-scheme-hierarchy-block').length).toBe(1);
        });
        it('with a .editor', function() {
            expect(this.element.querySelectorAll('.editor').length).toBe(1);
        });
        it('with a selected-details', function() {
            expect(this.element.find('selected-details').length).toBe(1);
        });
        it('with a annotation-block', function() {
            expect(this.element.find('annotation-block').length).toBe(1);
        });
        it('with a relationships-block', function() {
            expect(this.element.find('relationships-block').length).toBe(1);
        });
        it('with a usages-block', function() {
            expect(this.element.find('usages-block').length).toBe(1);
        });
    });
});