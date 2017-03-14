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
describe('Property Hierarchy Block directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyStateSvc,
        ontologyManagerSvc,
        ontologyUtilsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propertyHierarchyBlock');
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
        });

        ontologyStateSvc.listItem = {recordId: 'record', dataPropertyHierarchy: [{}], objectPropertyHierarchy: [{}]};
        element = $compile(angular.element('<property-hierarchy-block></property-hierarchy-block>'))(scope);
        scope.$digest();
    });

    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('property-hierarchy-block')).toBe(true);
        });
        it('with a block', function() {
            expect(element.find('block').length).toBe(1);
        });
        it('with a block-header', function() {
            expect(element.find('block-header').length).toBe(1);
        });
        it('with a block-content', function() {
            expect(element.find('block-content').length).toBe(1);
        });
        it('with a block-footer', function() {
            expect(element.find('block-footer').length).toBe(1);
        });
        it('with a button to delete a property', function() {
            var button = element.querySelectorAll('block-footer button');
            expect(button.length).toBe(1);
            expect(angular.element(button[0]).text()).toContain('Delete Property');
        });
        it('depending on whether a delete should be confirmed', function() {
            expect(element.find('confirmation-overlay').length).toBe(0);

            controller = element.controller('propertyHierarchyBlock');
            controller.showDeleteConfirmation = true;
            scope.$digest();
            expect(element.find('confirmation-overlay').length).toBe(1);
        });
        it('based on whether something is selected', function() {
            var button = angular.element(element.querySelectorAll('block-footer button')[0]);
            expect(button.attr('disabled')).toBeFalsy();

            ontologyStateSvc.selected = undefined;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there is a data property hierarchy', function() {
            expect(element.querySelectorAll('.data-property-hierarchy').length).toBe(1);

            ontologyStateSvc.listItem.dataPropertyHierarchy = [];
            scope.$digest();
            expect(element.querySelectorAll('.data-property-hierarchy').length).toBe(0);
        });
        it('depending on whether there is a object property hierarchy', function() {
            expect(element.querySelectorAll('.object-property-hierarchy').length).toBe(1);

            ontologyStateSvc.listItem.objectPropertyHierarchy = [];
            scope.$digest();
            expect(element.querySelectorAll('.object-property-hierarchy').length).toBe(0);
        });
        it('depending on whether the data property hierarchy is opened', function() {
            var icon = angular.element(element.querySelectorAll('.data-property-hierarchy li a i')[0]);
            expect(icon.hasClass('fa-folder-o')).toBe(true);
            expect(icon.hasClass('fa-folder-open-o')).toBe(false);
            expect(element.querySelectorAll('.data-property-hierarchy hierarchy-tree').length).toBe(0);

            ontologyStateSvc.getDataPropertiesOpened.and.returnValue(true);
            scope.$digest();
            expect(icon.hasClass('fa-folder-o')).toBe(false);
            expect(icon.hasClass('fa-folder-open-o')).toBe(true);
            expect(element.querySelectorAll('.data-property-hierarchy hierarchy-tree').length).toBe(1);
        });
        it('depending on whether the object property hierarchy is opened', function() {
            var icon = angular.element(element.querySelectorAll('.object-property-hierarchy li a i')[0]);
            expect(icon.hasClass('fa-folder-o')).toBe(true);
            expect(icon.hasClass('fa-folder-open-o')).toBe(false);
            expect(element.querySelectorAll('.object-property-hierarchy hierarchy-tree').length).toBe(0);

            ontologyStateSvc.getObjectPropertiesOpened.and.returnValue(true);
            scope.$digest();
            expect(icon.hasClass('fa-folder-o')).toBe(false);
            expect(icon.hasClass('fa-folder-open-o')).toBe(true);
            expect(element.querySelectorAll('.object-property-hierarchy hierarchy-tree').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('propertyHierarchyBlock');
        });
        describe('should delete', function() {
            it('if it is an object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).not.toHaveBeenCalled();
                expect(controller.showDeleteConfirmation).toBe(false);
            });
            it('if it is a datatype property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).not.toHaveBeenCalled();
                expect(controller.showDeleteConfirmation).toBe(false);
            });
            it('if it is an annotation property', function() {
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.selected);
                expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(ontologyStateSvc.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).toHaveBeenCalled();
                expect(controller.showDeleteConfirmation).toBe(false);
            });
        });
    });
    it('should set the correct state when the create property link is clicked', function() {
        var link = angular.element(element.querySelectorAll('block-header a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.showCreatePropertyOverlay).toBe(true);
    });
    it('should set the correct state when the delete property button is clicked', function() {
        controller = element.controller('propertyHierarchyBlock');
        var button = angular.element(element.querySelectorAll('block-footer button')[0]);
        button.triggerHandler('click');
        expect(controller.showDeleteConfirmation).toBe(true);
    });
    it('should call setDataPropertiesOpened if the data property link is clicked', function() {
        var link = angular.element(element.querySelectorAll('.data-property-hierarchy li a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.setDataPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Boolean));
    });
    it('should call setObjectPropertiesOpened if the data property link is clicked', function() {
        var link = angular.element(element.querySelectorAll('.object-property-hierarchy li a')[0]);
        link.triggerHandler('click');
        expect(ontologyStateSvc.setObjectPropertiesOpened).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, jasmine.any(Boolean));
    });
});