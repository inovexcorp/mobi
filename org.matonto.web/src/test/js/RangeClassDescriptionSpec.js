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
describe('Range Class Description directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc,
        mappingManagerSvc;

    beforeEach(function() {
        module('templates');
        module('rangeClassDescription');
        mockPrefixes();
        mockOntologyManager();
        mockMappingManager();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mappingManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
        });
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            scope.selectedProp = '';
            this.element = $compile(angular.element('<range-class-description selected-prop="{{selectedProp}}"></range-class-description>'))(scope);
            scope.$digest();
            controller = this.element.controller('rangeClassDescription');
        });
        it('selectedProp should be one way bound', function() {
            controller.selectedProp = 'test';
            scope.$digest();
            expect(scope.selectedProp).not.toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.classId = '';
            scope.selectedProp = '';
            this.element = $compile(angular.element('<range-class-description selected-prop="{{selectedProp}}"></range-class-description>'))(scope);
            scope.$digest();
            controller = this.element.controller('rangeClassDescription');
        });
        it('should get the name of the range class', function() {
            var result = controller.getRangeClassName();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get the description of the range class', function() {
            var result = controller.getRangeClassDescription();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            scope.selectedProp = '';
            var element = $compile(angular.element('<range-class-description selected-prop="{{selectedProp}}"></range-class-description>'))(scope);
            scope.$digest();
            expect(element.hasClass('class-description')).toBe(true);
        });
    });
});