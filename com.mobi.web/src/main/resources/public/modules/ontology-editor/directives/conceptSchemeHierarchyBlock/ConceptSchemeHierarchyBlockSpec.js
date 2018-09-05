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
    var $compile, scope, ontologyStateSvc, ontologyUtilsManagerSvc, ontologyManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('conceptSchemeHierarchyBlock');
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _ontologyManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            ontologyManagerSvc = _ontologyManagerService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<concept-scheme-hierarchy-block></concept-scheme-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('conceptSchemeHierarchyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyUtilsManagerSvc = null;
        ontologyManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('concept-scheme-hierarchy-block')).toBe(true);
        });
        it('with a block', function() {
            expect(this.element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(this.element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(this.element.find('block-content').length).toBe(1);
        });
        it('with a hierarchy-tree', function() {
            expect(this.element.find('hierarchy-tree').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(this.element.find('block-footer').length).toBe(1);
        });
        it('with a button to delete a concept scheme', function() {
            var button = this.element.querySelectorAll('block-footer button');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('Delete Entity');
        });
        it('based on whether something is selected', function() {
            var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), this.controller.deleteEntity);
        });
        describe('should delete an entity', function() {
            it('if it is a concept', function() {
                this.controller.deleteEntity();
                expect(ontologyManagerSvc.isConcept).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConcepts);
                expect(ontologyUtilsManagerSvc.deleteConcept).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteConceptScheme).not.toHaveBeenCalled();
            });
            it('if it is a concept scheme', function() {
                ontologyManagerSvc.isConcept.and.returnValue(false);
                this.controller.deleteEntity();
                expect(ontologyManagerSvc.isConceptScheme).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected, ontologyStateSvc.listItem.derivedConceptSchemes);
                expect(ontologyUtilsManagerSvc.deleteConcept).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteConceptScheme).toHaveBeenCalled();
            });
        });
        it('should open the createConceptSchemeOverlay', function() {
            this.controller.showCreateConceptSchemeOverlay();
            expect(ontologyStateSvc.unSelectItem).toHaveBeenCalled();
            expect(modalSvc.openModal).toHaveBeenCalledWith('createConceptSchemeOverlay');
        });
    });
    it('should call showCreateConceptSchemeOverlay when the create concept scheme link is clicked', function() {
        spyOn(this.controller, 'showCreateConceptSchemeOverlay');
        var link = angular.element(this.element.querySelectorAll('block-header .scheme-link')[0]);
        link.triggerHandler('click');
        expect(this.controller.showCreateConceptSchemeOverlay).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmation when the delete concept scheme button is clicked', function() {
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});