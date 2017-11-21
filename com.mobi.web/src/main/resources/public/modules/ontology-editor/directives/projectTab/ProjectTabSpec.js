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
describe('Project Tab directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('projectTab');
        mockOntologyState();
        mockOntologyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<project-tab></project-tab>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('project-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a .editor', function() {
            expect(this.element.querySelectorAll('.editor').length).toBe(1);
        });
        it('with a selected-details', function() {
            expect(this.element.find('selected-details').length).toBe(1);
        });
        it('with a ontology-properties-block', function() {
            expect(this.element.find('ontology-properties-block').length).toBe(1);
        });
        it('with a imports-block', function() {
            expect(this.element.find('imports-block').length).toBe(1);
        });
        it('with a preview-block', function() {
            expect(this.element.find('preview-block').length).toBe(1);
        });
    });
});