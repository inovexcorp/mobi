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
describe('Concept Scheme Hierarchy Block directive', function() {
    var $compile, scope, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('conceptSchemeHierarchyBlock');
        mockOntologyState();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
        });

        this.element = $compile(angular.element('<concept-scheme-hierarchy-block></concept-scheme-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('conceptSchemeHierarchyBlock');
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
            expect(this.element.hasClass('concept-scheme-hierarchy-block')).toBe(true);
        });
        it('depending on whether the tree is empty', function() {
            expect(this.element.find('info-message').length).toEqual(1);

            ontologyStateSvc.listItem.conceptSchemes.flat = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
        });
        it('with a hierarchy-tree', function() {
            expect(this.element.find('hierarchy-tree').length).toBe(1);
        });
    });
});