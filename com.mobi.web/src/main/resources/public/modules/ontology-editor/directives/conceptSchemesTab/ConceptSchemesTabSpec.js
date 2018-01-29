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
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, propertyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('conceptSchemesTab');
        mockOntologyManager();
        mockOntologyState();
        mockPropertyManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _propertyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            propertyManagerSvc = _propertyManagerService_;
        });

        this.element = $compile(angular.element('<concept-schemes-tab></concept-schemes-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('conceptSchemesTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        propertyManagerSvc = null;
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
    describe('should update dvm.relationshipList when a', function() {
        beforeEach(function () {
            propertyManagerSvc.conceptSchemeRelationshipList = ['relationshipA', 'relationshipB'];
            propertyManagerSvc.schemeRelationshipList = ['relationshipD'];
            ontologyStateSvc.listItem.iriList = ['relationshipA'];
            ontologyStateSvc.listItem.derivedSemanticRelations = ['relationshipC'];
        });
        it('Concept is selected', function() {
            ontologyStateSvc.listItem.selected = {new: true};
            ontologyManagerSvc.isConcept.and.returnValue(true);
            scope.$digest();
            expect(this.controller.relationshipList).toEqual(['relationshipC', 'relationshipA']);
        });
        it('ConceptScheme is selected', function() {
            ontologyStateSvc.listItem.selected = {new: true};
            ontologyManagerSvc.isConcept.and.returnValue(false);
            ontologyManagerSvc.isConceptScheme.and.returnValue(true);
            scope.$digest();
            expect(this.controller.relationshipList).toEqual(['relationshipD']);
        });
    });
});