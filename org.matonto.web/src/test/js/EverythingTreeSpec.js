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
describe('Everything Tree directive', function() {
    var $compile, scope, element, ontologyStateSvc, ontologyManagerSvc, controller;

    beforeEach(function() {
        module('templates');
        module('everythingTree');
        mockOntologyManager();
        mockOntologyState();
        mockOntologyUtilsManager();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });
        
        ontologyManagerSvc.hasNoDomainProperties.and.returnValue(true);
        ontologyStateSvc.getOpened.and.returnValue(true);
        ontologyStateSvc.getNoDomainsOpened.and.returnValue(true);
        ontologyStateSvc.listItem.flatEverythingTree = [{
            '@id': 'class1',
            hasChildren: true,
            indent: 0,
            path: ['recordId']
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            path: ['recordId', 'class1']
        }, {
            title: 'Properties',
            get: jasmine.createSpy('get').and.returnValue(true),
            set: jasmine.createSpy('set')
        }, {
            '@id': 'property1',
            hasChildren: false,
            indent: 1,
            get: ontologyStateSvc.getNoDomainsOpened
        }];

        element = $compile(angular.element('<everything-tree></everything-tree>'))(scope);
        scope.$digest();
        controller = element.controller('everythingTree');
    });

    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(controller, 'isShown').and.returnValue(true);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('tree')).toBe(true);
            expect(element.hasClass('everything-tree')).toBe(true);
            expect(element.hasClass('hierarchy-tree')).toBe(true);
            expect(element.hasClass('full-height')).toBe(true);
        });
        it('based on .repeater-container', function() {
            expect(element.querySelectorAll('.repeater-container').length).toBe(1);
        });
        it('based on tree-items', function() {
            expect(element.find('tree-item').length).toBe(3);
        });
        it('based on .tree-items', function() {
            expect(element.querySelectorAll('.tree-item').length).toBe(1);
        });
        it('based on .fa-folder-open-o', function() {
            expect(element.querySelectorAll('.tree-item .fa-folder-open-o').length).toBe(1);
            ontologyStateSvc.listItem.flatEverythingTree[2].get.and.returnValue(false);
            scope.$digest();
            expect(element.querySelectorAll('.tree-item .fa-folder-open-o').length).toBe(0);
        });
        it('based on .fa-folder-o', function() {
            expect(element.querySelectorAll('.tree-item .fa-folder-o').length).toBe(0);
            ontologyStateSvc.listItem.flatEverythingTree[2].get.and.returnValue(false);
            scope.$digest();
            expect(element.querySelectorAll('.tree-item .fa-folder-o').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        describe('isShown should return', function() {
            describe('true when', function() {
                it('entity does not have an @id', function() {
                    var entity = {};
                    expect(controller.isShown(entity)).toBe(true);
                });
                it('entity does have an @id and get returns true', function() {
                    var entity = {
                        '@id': 'id',
                        get: jasmine.createSpy('get').and.returnValue(true)
                    };
                    expect(controller.isShown(entity)).toBe(true);
                    expect(entity.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                it('entity does have an @id, does not have a get, indent is greater than 0, and areParentsOpen is true', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(controller.isShown(entity)).toBe(true);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(entity);
                });
                it('entity does have an @id, does not have a get, indent is 0, and the parent path has a length of 2', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 0,
                        path: ['recordId', 'iri']
                    };
                    expect(controller.isShown(entity)).toBe(true);
                });
            });
            describe('false when', function() {
                it('has an @id', function() {
                    var entity = {'@id': 'id'};
                    expect(controller.isShown(entity)).toBe(false);
                });
                it('has a get that returns false', function() {
                    var entity = {
                        '@id': 'id',
                        get: jasmine.createSpy('get').and.returnValue(false)
                    }
                    expect(controller.isShown(entity)).toBe(false);
                    expect(entity.get).toHaveBeenCalledWith(ontologyStateSvc.listItem.ontologyRecord.recordId);
                });
                it('indent is greater than 0 and areParentsOpen is false', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 1,
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(controller.isShown(entity)).toBe(false);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(entity);
                });
                it('indent is 0 and the parent path does not have a length of 2', function() {
                    var entity = {
                        '@id': 'id',
                        indent: 0,
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    expect(controller.isShown(entity)).toBe(false);
                });
            });
        });
    });
});