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
        controller,
        ontologyManagerSvc,
        stateManagerSvc;

    beforeEach(function() {
        module('templates');
        module('propertyTree');
        mockPrefixes();
        mockOntologyManager();
        mockStateManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _stateManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            stateManagerSvc = _stateManagerService_;
        });
    });

    beforeEach(function() {
        ontologyManagerSvc.getObjectProperties.and.returnValue([{matonto:{originalIRI:'object1'}}, {matonto:{originalIRI:'object2'}}, {matonto:{originalIRI:'object3'}}]);
        ontologyManagerSvc.getDataTypeProperties.and.returnValue([{matonto:{originalIRI:'dataType1'}}, {matonto:{originalIRI:'dataType2'}}, {matonto:{originalIRI:'dataType3'}}]);
        ontologyManagerSvc.list = [{
            id: '',
            ontology: [{}],
            ontologyIRI: ''
        }];
        scope.headerText = 'test';
        scope.propertyType = 'test';
        element = $compile(angular.element('<property-tree header-text="{{headerText}}" property-type="{{propertyType}}"></property-tree>'))(scope);
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
            var uls = element.find('ul');
            expect(uls.length).toBe(2);
        });
        it('based on container tree-items', function() {
            controller = element.controller('propertyTree');
            controller.getPropertyIRIs = jasmine.createSpy('getPropertyIRIs').and.returnValue(['1', '2', '3']);
            scope.$digest();
            var lis = element.querySelectorAll('.container tree-item');
            expect(lis.length).toBe(controller.getPropertyIRIs().length);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('propertyTree');
        });
        describe('getProperties calls correct function', function() {
            it('if propertyType = "object"', function() {
                scope.propertyType = 'object';
                scope.$digest();
                var result = controller.getProperties([]);
                expect(ontologyManagerSvc.getObjectProperties).toHaveBeenCalledWith([]);
                expect(result).toEqual(ontologyManagerSvc.getObjectProperties([]));
            });
            it('if propertyType = "dataType"', function() {
                scope.propertyType = 'dataType';
                scope.$digest();
                var result = controller.getProperties([]);
                expect(ontologyManagerSvc.getDataTypeProperties).toHaveBeenCalledWith([]);
                expect(result).toEqual(ontologyManagerSvc.getDataTypeProperties([]));
            });
        });
        describe('hasProperties calls the correct function', function() {
            it('if propertyType = "object"', function() {
                scope.propertyType = 'object';
                scope.$digest();
                var result = controller.hasProperties([]);
                expect(ontologyManagerSvc.hasObjectProperties).toHaveBeenCalledWith([]);
                expect(result).toEqual(ontologyManagerSvc.hasObjectProperties([]));
            });
            it('if propertyType = "dataType"', function() {
                scope.propertyType = 'dataType';
                scope.$digest();
                var result = controller.hasProperties([]);
                expect(ontologyManagerSvc.hasDataTypeProperties).toHaveBeenCalledWith([]);
                expect(result).toEqual(ontologyManagerSvc.hasDataTypeProperties([]));
            });
        });
    });
});
