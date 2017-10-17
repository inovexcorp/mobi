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


describe('Hierarchy Tree directive', function() {
    var $compile, scope, element, isolatedScope, ontologyStateSvc, ontologyUtils, controller;

    beforeEach(function() {
        module('templates');
        module('hierarchyTree');
        mockOntologyState();
        mockOntologyUtilsManager();
        injectUniqueKeyFilter();
        injectIndentConstant();

        inject(function(_$compile_, _$rootScope_, _ontologyStateService_, _ontologyUtilsManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyStateSvc = _ontologyStateService_;
            ontologyUtils = _ontologyUtilsManagerService_;
        });
        scope.hierarchy = [{
            entityIRI: 'class1',
            indent: 0,
            path: []
        }, {
            entityIRI: 'class2',
            indent: 1,
            path: []
        }, {
            entityIRI: 'class3',
            indent: 0,
            path: []
        }];
        element = $compile(angular.element('<hierarchy-tree hierarchy="hierarchy"></hierarchy-tree>'))(scope);
        scope.$digest();
        controller = element.controller('hierarchyTree');
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('hierarchy should be one way bound', function() {
            isolatedScope.hierarchy = [];
            scope.$digest();
            expect(angular.copy(scope.hierarchy)).toEqual([{
                entityIRI: 'class1',
                indent: 0,
                path: []
            }, {
                entityIRI: 'class2',
                indent: 1,
                path: []
            }, {
                entityIRI: 'class3',
                indent: 0,
                path: []
            }]);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            spyOn(controller, 'isShown').and.returnValue(true);
            scope.$apply();
        });
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('hierarchy-tree')).toBe(true);
            expect(element.hasClass('tree')).toBe(true);
        });
        it('based on .repeater-container', function() {
            expect(element.querySelectorAll('.repeater-container').length).toBe(1);
        });
        it('based on tree-items', function() {
            expect(element.find('tree-item').length).toBe(3);
        });
        it('based on .tree-item-wrapper', function() {
            expect(element.querySelectorAll('.tree-item-wrapper').length).toBe(3);
        });
    });
    describe('controller methods', function() {
        describe('isShown should return', function() {
            describe('true when', function() {
                it('indent is greater than 0 and areParentsOpen is true', function() {
                    var node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'andAnotherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(true);
                    expect(controller.isShown(node)).toBe(true);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(node);
                });
                it('indent is 0 and the parent path has a length of 2', function() {
                    var node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'iri']
                    };
                    expect(controller.isShown(node)).toBe(true);
                });
            });
            describe('false when', function() {
                it('indent is greater than 0 and areParentsOpen is false', function() {
                    var node = {
                        indent: 1,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    ontologyStateSvc.areParentsOpen.and.returnValue(false);
                    expect(controller.isShown(node)).toBe(false);
                    expect(ontologyStateSvc.areParentsOpen).toHaveBeenCalledWith(node);
                });
                it('indent is 0 and the parent path does not have a length of 2', function() {
                    var node = {
                        indent: 0,
                        entityIRI: 'iri',
                        path: ['recordId', 'otherIRI', 'iri']
                    };
                    expect(controller.isShown(node)).toBe(false);
                });
            });
        });
    });
});
