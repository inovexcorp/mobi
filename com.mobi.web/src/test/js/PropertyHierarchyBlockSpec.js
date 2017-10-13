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
describe('Property Hierarchy Block directive', function() {
    var $compile, scope, element, controller, ontologyStateSvc, ontologyManagerSvc, ontologyUtilsManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propertyHierarchyBlock');
        mockOntologyState();
        mockOntologyManager();
        mockOntologyUtilsManager();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyUtilsManagerSvc = _ontologyUtilsManagerService_;
        });

        element = $compile(angular.element('<property-hierarchy-block></property-hierarchy-block>'))(scope);
        scope.$digest();
        controller = element.controller('propertyHierarchyBlock');
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(controller, 'isShown').and.returnValue(true);
        });
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

            ontologyStateSvc.listItem.selected = undefined;
            scope.$digest();
            expect(button.attr('disabled')).toBeTruthy();
        });
        it('depending on whether there is a flat data property hierarchy', function() {
            expect(element.querySelectorAll('.tree-item').length).toBe(0);
            expect(element.find('tree-item').length).toBe(0);
            
            ontologyStateSvc.listItem.flatDataPropertyHierarchy = [{entityIRI: 'iri'}];
            scope.$digest();
            expect(element.querySelectorAll('.tree-item').length).toBe(1);
            expect(element.find('tree-item').length).toBe(1);
        });
        it('depending on whether there is a flat object property hierarchy', function() {
            expect(element.querySelectorAll('.tree-item').length).toBe(0);
            expect(element.find('tree-item').length).toBe(0);
            
            ontologyStateSvc.listItem.flatObjectPropertyHierarchy = [{entityIRI: 'iri'}];
            scope.$digest();
            expect(element.querySelectorAll('.tree-item').length).toBe(1);
            expect(element.find('tree-item').length).toBe(1);
        });
        it('depending on whether there is an annotation in the ontology', function() {
            expect(element.querySelectorAll('.tree-item').length).toBe(0);
            expect(element.find('tree-item').length).toBe(0);
            
            ontologyStateSvc.listItem.flatAnnotationPropertyHierarchy = [{entityIRI: 'iri'}];
            scope.$digest();
            expect(element.querySelectorAll('.tree-item').length).toBe(1);
            expect(element.find('tree-item').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('should delete', function() {
            it('an object property', function() {
                ontologyManagerSvc.isObjectProperty.and.returnValue(true);
                controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).not.toHaveBeenCalled();
                expect(controller.showDeleteConfirmation).toBe(false);
            });
            it('a datatype property', function() {
                ontologyManagerSvc.isDataTypeProperty.and.returnValue(true);
                controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).not.toHaveBeenCalled();
                expect(controller.showDeleteConfirmation).toBe(false);
            });
            it('an annotation property', function() {
                ontologyManagerSvc.isAnnotation.and.returnValue(true);
                controller.deleteProperty();
                expect(ontologyManagerSvc.isObjectProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isDataTypeProperty).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyManagerSvc.isAnnotation).toHaveBeenCalledWith(ontologyStateSvc.listItem.selected);
                expect(ontologyUtilsManagerSvc.deleteDataTypeProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteObjectProperty).not.toHaveBeenCalled();
                expect(ontologyUtilsManagerSvc.deleteAnnotationProperty).toHaveBeenCalled();
                expect(controller.showDeleteConfirmation).toBe(false);
            });
        });
        describe('isShown returns', function() {
            var get, node;
            beforeEach(function() {
                get = jasmine.createSpy('get').and.returnValue(true);
                node = {
                    indent: 1,
                    path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                    get: get
                };
            });
            describe('true when', function() {
                beforeEach(function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                });
                it('node does not have an entityIRI property', function() {
                    expect(controller.isShown(node)).toBe(true);
                });
                it('node does have an entityIRI property and areParentsOpen is true and node.get is true', function() {
                    node.entityIRI = 'iri';
                    expect(controller.isShown(node)).toBe(true);
                    expect(get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
            });
            describe('false when node does have an entityIRI and', function() {
                beforeEach(function() {
                    node.entityIRI = 'iri';
                });
                it('areParentsOpen is false', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(controller.isShown(node)).toBe(false);
                });
                it('node.get is false', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    get.and.returnValue(false);
                    expect(controller.isShown(node)).toBe(false);
                    expect(get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
            });
            it('make sure flatPropertyTree is populated correctly and $watch is working correctly', function() {
                expect(controller.flatPropertyTree).toEqual([]);
                ontologyStateSvc.listItem.flatDataPropertyHierarchy = [{prop: 'data'}];
                ontologyStateSvc.listItem.flatObjectPropertyHierarchy = [{prop: 'object'}];
                ontologyStateSvc.listItem.flatAnnotationPropertyHierarchy = [{prop: 'annotation'}];
                scope.$digest();
                var copy = angular.copy(controller.flatPropertyTree);
                expect(copy).toContain({title: 'Data Properties', get: ontologyStateSvc.getDataPropertiesOpened, set: ontologyStateSvc.setDataPropertiesOpened});
                expect(copy).toContain({title: 'Object Properties', get: ontologyStateSvc.getObjectPropertiesOpened, set: ontologyStateSvc.setObjectPropertiesOpened});
                expect(copy).toContain({title: 'Annotation Properties', get: ontologyStateSvc.getAnnotationPropertiesOpened, set: ontologyStateSvc.setAnnotationPropertiesOpened});
                expect(copy).toContain({get: ontologyStateSvc.getDataPropertiesOpened, prop: 'data'});
                expect(copy).toContain({get: ontologyStateSvc.getObjectPropertiesOpened, prop: 'object'});
                expect(copy).toContain({get: ontologyStateSvc.getAnnotationPropertiesOpened, prop: 'annotation'});
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
});