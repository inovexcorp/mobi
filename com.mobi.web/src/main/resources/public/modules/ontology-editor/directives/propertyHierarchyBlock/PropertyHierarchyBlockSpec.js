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
    var $compile, scope, ontologyStateSvc, ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propertyHierarchyBlock');
        mockOntologyState();
        mockOntologyManager();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyManagerSvc = _ontologyManagerService_;
        });

        this.element = $compile(angular.element('<property-hierarchy-block></property-hierarchy-block>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('propertyHierarchyBlock');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyStateSvc = null;
        ontologyManagerSvc = null;
        this.element.remove();
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(this.controller, 'isShown').and.returnValue(true);
        });
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DIV');
            expect(this.element.hasClass('property-hierarchy-block')).toBe(true);
        });
        it('depending on whether the flat property tree is empty', function() {
            expect(this.element.find('info-message').length).toEqual(1);
            expect(this.element.querySelectorAll('.tree').length).toBe(0);

            this.controller.flatPropertyTree = [{}];
            scope.$digest();
            expect(this.element.find('info-message').length).toEqual(0);
            expect(this.element.querySelectorAll('.tree').length).toBe(1);
        });
        it('depending on whether there is a flat data property hierarchy', function() {
            expect(this.element.querySelectorAll('.tree-item').length).toBe(0);
            expect(this.element.find('tree-item').length).toBe(0);

            ontologyStateSvc.listItem.dataProperties.flat = [{entityIRI: 'iri'}];
            scope.$digest();
            expect(this.element.querySelectorAll('.tree-item').length).toBe(1);
            expect(this.element.find('tree-item').length).toBe(1);
        });
        it('depending on whether there is a flat object property hierarchy', function() {
            expect(this.element.querySelectorAll('.tree-item').length).toBe(0);
            expect(this.element.find('tree-item').length).toBe(0);

            ontologyStateSvc.listItem.objectProperties.flat = [{entityIRI: 'iri'}];
            scope.$digest();
            expect(this.element.querySelectorAll('.tree-item').length).toBe(1);
            expect(this.element.find('tree-item').length).toBe(1);
        });
        it('depending on whether there is an annotation in the ontology', function() {
            expect(this.element.querySelectorAll('.tree-item').length).toBe(0);
            expect(this.element.find('tree-item').length).toBe(0);

            ontologyStateSvc.listItem.annotations.flat = [{entityIRI: 'iri'}];
            scope.$digest();
            expect(this.element.querySelectorAll('.tree-item').length).toBe(1);
            expect(this.element.find('tree-item').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('isShown returns', function() {
            beforeEach(function() {
                this.get = jasmine.createSpy('get').and.returnValue(true);
                this.node = {
                    indent: 1,
                    path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri'],
                    get: this.get
                };
            });
            describe('true when', function() {
                beforeEach(function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                });
                it('node does not have an entityIRI property', function() {
                    expect(this.controller.isShown(this.node)).toBe(true);
                });
                it('node does have an entityIRI property and areParentsOpen is true and node.get is true', function() {
                    this.node.entityIRI = 'iri';
                    expect(this.controller.isShown(this.node)).toBe(true);
                    expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
            });
            describe('false when node does have an entityIRI and', function() {
                beforeEach(function() {
                    this.node.entityIRI = 'iri';
                });
                it('areParentsOpen is false', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(this.controller.isShown(this.node)).toBe(false);
                });
                it('node.get is false', function() {
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    this.get.and.returnValue(false);
                    expect(this.controller.isShown(this.node)).toBe(false);
                    expect(this.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
            });
            it('make sure flatPropertyTree is populated correctly and $watch is working correctly', function() {
                expect(this.controller.flatPropertyTree).toEqual([]);
                ontologyStateSvc.listItem.dataProperties.flat = [{prop: 'data'}];
                ontologyStateSvc.listItem.objectProperties.flat = [{prop: 'object'}];
                ontologyStateSvc.listItem.annotations.flat = [{prop: 'annotation'}];
                scope.$digest();
                var copy = angular.copy(this.controller.flatPropertyTree);
                expect(copy).toContain({title: 'Data Properties', get: ontologyStateSvc.getDataPropertiesOpened, set: ontologyStateSvc.setDataPropertiesOpened});
                expect(copy).toContain({title: 'Object Properties', get: ontologyStateSvc.getObjectPropertiesOpened, set: ontologyStateSvc.setObjectPropertiesOpened});
                expect(copy).toContain({title: 'Annotation Properties', get: ontologyStateSvc.getAnnotationPropertiesOpened, set: ontologyStateSvc.setAnnotationPropertiesOpened});
                expect(copy).toContain({get: ontologyStateSvc.getDataPropertiesOpened, prop: 'data'});
                expect(copy).toContain({get: ontologyStateSvc.getObjectPropertiesOpened, prop: 'object'});
                expect(copy).toContain({get: ontologyStateSvc.getAnnotationPropertiesOpened, prop: 'annotation'});
            });
        });
    });
});