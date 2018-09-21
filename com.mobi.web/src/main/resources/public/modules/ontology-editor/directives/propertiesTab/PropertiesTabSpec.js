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
describe('Properties Tab directive', function() {
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc, modalSvc;

    beforeEach(function() {
        module('templates');
        module('propertiesTab');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        mockModal();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_, _modalService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
            modalSvc = _modalService_;
        });

        this.element = $compile(angular.element('<properties-tab></properties-tab>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertiesTab');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        ontologyUtilsManagerSvc = null;
        modalSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('properties-tab')).toBe(true);
            expect(this.element.hasClass('row')).toBe(true);
        });
        it('with a property-hierarchy-block', function() {
            expect(this.element.find('property-hierarchy-block').length).toBe(1);
        });
        it('with a selected-details', function() {
            expect(this.element.find('selected-details').length).toBe(1);
        });
        it('with an annotation-block', function() {
            expect(this.element.find('annotation-block').length).toBe(1);
        });
        it('with an axiom-block', function() {
            expect(this.element.find('axiom-block').length).toBe(1);
            ontologyManagerSvc.isAnnotation.and.returnValue(true);
            scope.$apply();
            expect(this.element.find('axiom-block').length).toBe(0);
        });
        it('with a characteristics-row', function() {
            expect(this.element.find('characteristics-row').length).toBe(1);
        });
        it('with a usages-block', function() {
            expect(this.element.find('usages-block').length).toBe(1);
        });
        it('with a button to delete a property', function() {
            var button = this.element.querySelectorAll('button');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('Delete');
        });
        it('depending on whether something is selected', function() {
            expect(this.element.querySelectorAll('.selected-property').length).toEqual(1);

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(this.element.querySelectorAll('.selected-property').length).toEqual(0);
        });
        it('depending on whether the selected property is imported', function() {
            var button = angular.element(this.element.querySelectorAll('button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.listItem.selected.mobi = {imported: true};
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
    });
    describe('controller methods', function() {
        it('showDeleteConfirmation opens a delete confirmation modal', function() {
            this.controller.showDeleteConfirmation();
            expect(modalSvc.openConfirmModal).toHaveBeenCalledWith(jasmine.any(String), this.controller.deleteProperty);
        });
        describe('should delete', function() {
            it('an object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                this.controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).not.toHaveBeenCalled();
            });
            it('a datatype property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                this.controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).not.toHaveBeenCalled();
            });
            it('an annotation property', function() {
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                this.controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).toHaveBeenCalled();
            });
        });
    });
    it('should call showDeleteConfirmation when the delete property button is clicked', function() {
        spyOn(this.controller, 'showDeleteConfirmation');
        var button = angular.element(this.element.querySelectorAll('button')[0]);
        button.triggerHandler('click');
        expect(this.controller.showDeleteConfirmation).toHaveBeenCalled();
    });
});