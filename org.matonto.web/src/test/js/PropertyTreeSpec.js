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
describe('Property Tree directive', function() {
    var $compile,
        scope,
        element,
        ontologyManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propertyTree');
        mockPrefixes();
        mockOntologyManager();
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
        });
    });

    beforeEach(function() {
        ontologyManagerSvc.getList.and.returnValue([
            {
                matonto: {
                    classes: [
                        {
                            matonto: {
                                properties: ['prop1', 'prop2']
                            }
                        }
                    ],
                    noDomains: ['prop3']
                }
            }
        ]);
        scope.headerText = 'test';
        scope.propertyType = 'test';

        element = $compile(angular.element('<property-tree header-text="headerText" property-type="propertyType"></property-tree>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('headerText should be one way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.headerText = 'new';
            scope.$digest();
            expect(scope.headerText).not.toEqual('new');
        });
    });
    describe('controller bound variables', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('propertyTree');
        });
        it('propertyType should be one way bound', function() {
            controller.propertyType = 'new';
            scope.$digest();
            expect(scope.propertyType).not.toEqual('new');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on tree class', function() {
            expect(element.hasClass('tree')).toBe(true);
        });
        it('based on container class', function() {
            var container = element.querySelectorAll('.container');
            expect(container.length).toBe(1);
        });
        it('based on ul', function() {
            var uls = element.querySelectorAll('ul');
            expect(uls.length).toBe(3);
        });
        it('based on container tree-items', function() {
            spyOn(element.controller('propertyTree'), 'isThisType').and.returnValue(true);
            scope.$digest();

            var lis = element.querySelectorAll('.container tree-item');
            expect(lis.length).toBe(3);
        });
    });
    describe('controller methods', function() {
        var controller;

        beforeEach(function() {
            controller = element.controller('propertyTree');
        });
        it('isThisType returns a boolean value', function() {
            var result = controller.isThisType({}, 'datatypeproperty');
            expect(typeof result).toBe('boolean');
        });
        it('hasChildren returns a boolean value', function() {
            var result = controller.hasChildren({});
            expect(typeof result).toBe('boolean');
        });
    });
});
