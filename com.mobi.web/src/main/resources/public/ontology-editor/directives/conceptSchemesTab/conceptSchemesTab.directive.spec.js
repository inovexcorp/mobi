/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc, propertyManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('conceptSchemesTab');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockPropertyManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _propertyManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            propertyManagerSvc = _propertyManagerService_;
            modalSvc = _modalService_;
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
        ontologyUtilsManagerSvc = null;
        propertyManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('concept-schemes-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        ['concept-scheme-hierarchy-block', 'selected-details', 'annotation-block', 'relationships-block', 'usages-block'].forEach(test => {
            it('with a ' + test, function() {
                expect(this.element.find(test).length).toBe(1);
            });
        });
        it('with a button to delete a concept scheme if a user can modify', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var button = this.element.querySelectorAll('.selected-header button.btn-danger');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('Delete');
        });
        it('with no button to delete a concept scheme if a user cannot modify', function() {
            ontologyStateSvc.canModify.and.returnValue(false);
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-header button.btn-danger').length).toBe(0);
        });
        it('with a button to see the entity history', function() {
            var button = this.element.querySelectorAll('.selected-header button.btn-primary');
            expect(button.length).toEqual(1);
            expect(angular.element(button[0]).text()).toEqual('See History');
        });
        it('based on whether something is selected', function() {
            expect(this.element.querySelectorAll('.selected-entity').length).toEqual(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-entity').length).toEqual(0);
        });
        it('depending on whether the selected entity is imported', function() {
            ontologyStateSvc.canModify.and.returnValue(true);
            scope.$digest();
            var historyButton = angular.element(this.element.querySelectorAll('.selected-header button.btn-primary')[0]);
            var deleteButton = angular.element(this.element.querySelectorAll('.selected-header button.btn-danger')[0]);
            expect(historyButton.attr('disabled')).toBeFalsy();
            expect(deleteButton.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(historyButton.attr('disabled')).toBeTruthy();
            expect(deleteButton.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('should open a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), this.controller.deleteEntity);
        });
        it('should show a class history', function() {
            this.controller.seeHistory();
            expect(ontologyStateSvc.listItem.seeHistory).toEqual(true);
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
    it('should call seeHistory when the see history button is clicked', function() {
        spyOn(this.controller, 'seeHistory');
        var button = angular.element(this.element.querySelectorAll('.selected-header button.btn-primary')[0]);
        button.triggerHandler('click');
        expect(this.controller.seeHistory).toHaveBeenCalled();
    });
    it('should call showDeleteConfirmation when the delete button is clicked', function() {
        ontologyStateSvc.canModify.and.returnValue(true);
        scope.$digest();
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('.selected-header button.btn-danger')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});