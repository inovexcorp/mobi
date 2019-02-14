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
describe('Concepts Tab directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyUtilsManagerSvc, propertyManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('conceptsTab');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockPropertyManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_, _propertyManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            modalSvc = _modalService_;
        });

        propertyManagerSvc.conceptSchemeRelationshipList = ['topConceptOf', 'inScheme'];
        ontologyStateSvc.listItem.iriList = ['topConceptOf'];
        ontologyStateSvc.listItem.derivedSemanticRelations = ['derived'];
        this.element = $compile(angular.element('<concepts-tab></concepts-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('conceptsTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyUtilsManagerSvc = null;
        propertyManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    it('initializes with the correct list of relationships', function() {
        expect(this.controller.relationshipList).toEqual(['derived', 'topConceptOf']);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('concepts-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a concept-hierarchy-block', function() {
            expect(this.element.find('concept-hierarchy-block').length).toBe(1);
        });
        it('with a selected-details', function() {
            expect(this.element.find('selected-details').length).toBe(1);
        });
        it('with an annotation-block', function() {
            expect(this.element.find('annotation-block').length).toBe(1);
        });
        it('with a relationships-block', function() {
            expect(this.element.find('relationships-block').length).toBe(1);
        });
        it('with a usages-block', function() {
            expect(this.element.find('usages-block').length).toBe(1);
        });
        it('with a button to delete a concept if the user can modify and a button to see history', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = this.element.querySelectorAll('button');
            expect(button.length).toBe(2);
            expect(angular.element(button[1]).text()).toContain('Delete');
        });
        it('with no button to delete a concept if the user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            var button = this.element.querySelectorAll('button');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('See History');
        });
        it('depending on whether something is selected', function() {
            expect(this.element.querySelectorAll('.selected-concept').length).toEqual(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-concept').length).toEqual(0);
        });
        it('depending on whether the selected concept is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = angular.element(this.element.querySelectorAll('button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should show a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), ontologyUtilsManagerSvc.deleteConcept);
        });
    });
    it('should set seeHistory to true when the see history concept button is clicked', function() {
        scope.$digest();
        var button = angular.element(this.element.querySelectorAll('button')[0]);
        button.triggerHandler('click');
        expect(ontologyStateSvc.listItem.seeHistory).toEqual(true);
    });
    it('should call showDeleteConfirmation when the delete concept button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('button')[1]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});