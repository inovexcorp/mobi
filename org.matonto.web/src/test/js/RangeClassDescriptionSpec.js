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

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('rangeClassDescription');
        mockOntologyManager();
        mockMappingManager();

        inject(function(_ontologyManagerService_, _mappingManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
            mappingManagerSvc = _mappingManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.classId = '';
            scope.selectedProp = '';
            this.element = $compile(angular.element('<range-class-description class-id="{{classId}}" selected-prop="{{selectedProp}}"></range-class-description>'))(scope);
            scope.$digest();
        });

        it('classId should be one way bound', function() {
            var controller = this.element.controller('rangeClassDescription');
            controller.classId = 'test';
            scope.$digest();
            expect(scope.classId).not.toEqual('test');
        });
        it('selectedProp should be one way bound', function() {
            var controller = this.element.controller('rangeClassDescription');
            controller.selectedProp = 'test';
            scope.$digest();
            expect(scope.selectedProp).not.toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.classId = '';
            scope.selectedProp = '';
            this.element = $compile(angular.element('<range-class-description class-id="{{classId}}" selected-prop="{{selectedProp}}"></range-class-description>'))(scope);
            scope.$digest();
        });
        it('should get the name of the range class', function() {
            var controller = this.element.controller('rangeClassDescription');
            var result = controller.getRangeClassName();
            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalled();
            expect(typeof result).toBe('string');
        });
        it('should get the description of the range class', function() {
            var controller = this.element.controller('rangeClassDescription');
            var result = controller.getRangeClassDescription();
            expect(typeof result).toBe('string');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            scope.classId = '';
            scope.selectedProp = '';
            var element = $compile(angular.element('<range-class-description class-id="{{classId}}" selected-prop="{{selectedProp}}"></range-class-description>'))(scope);
            scope.$digest();
            expect(element.hasClass('class-description')).toBe(true);
        });
    });
});