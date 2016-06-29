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
describe('Class Preview directive', function() {
    var $compile,
        scope,
        ontologyManagerSvc;

    mockPrefixes();
    beforeEach(function() {
        module('templates');
        module('classPreview');
        mockOntologyManager();

        inject(function(_ontologyManagerService_) {
            ontologyManagerSvc = _ontologyManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.classObj = {};

            this.element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();
        });

        it('classObj should be two way bound', function() {
            var controller = this.element.controller('classPreview');
            controller.classObj = {matonto: {}};
            scope.$digest();
            expect(scope.classObj).toEqual({matonto: {}});
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.classObj = {matonto: {properties: [{}]}};

            this.element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();
        });
        it('should create a title for classObj', function() {
            var controller = this.element.controller('classPreview');
            var result = controller.createTitle();

            expect(ontologyManagerSvc.getEntityName).toHaveBeenCalledWith(controller.classObj);
            expect(typeof result).toBe('string');
        });
        it('should create a description of the ontology', function() {
            var controller = this.element.controller('classPreview');
            var result = controller.createDescription();
            expect(typeof result).toBe('string');
        });
        it('should get classes from the ontology', function() {
            var controller = this.element.controller('classPreview');
            var result = controller.getProps();
            expect(Array.isArray(result)).toBe(true);
            expect(result).toEqual(controller.classObj.matonto.properties);
        });
        it('should get the list of classes to display', function() {
            ontologyManagerSvc.getEntityName.calls.reset();
            var controller = this.element.controller('classPreview');
            controller.classObj = {matonto: {properties: [{}, {}, {}, {}, {}, {}, {}]}};
            controller.full = false;
            var result = controller.getPropList();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(controller.numPropPreview);
            expect(ontologyManagerSvc.getEntityName.calls.count()).toBe(controller.numPropPreview);
           
            ontologyManagerSvc.getEntityName.calls.reset();
            controller.full = true;
            result = controller.getPropList();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(controller.classObj.matonto.properties.length);
            expect(ontologyManagerSvc.getEntityName.calls.count()).toBe(controller.classObj.matonto.properties.length);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<class-preview class-obj="classObj"></class-preview>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('class-preview')).toBe(true);
        });
        it('depending on whether classObj was passed', function() {
            expect(this.element.children().length).toBe(0);

            scope.classObj = {};
            scope.$digest();
            expect(this.element.children().length).toBe(1);
        });
        it('depending on whether classObj has any properties', function() {
            scope.classObj = {matonto: {properties: []}};
            scope.$digest();
            var propList = angular.element(this.element.querySelectorAll('ul')[0]);
            expect(propList.html()).toContain('None');

            scope.classObj = {matonto: {properties: [{}]}};
            scope.$digest();
            expect(propList.html()).not.toContain('None');
            expect(propList.children().length).toBe(scope.classObj.matonto.properties.length);
        });
        it('depending on how many properties are showing', function() {
            var controller = this.element.controller('classPreview');
            scope.classObj = {matonto: {properties: [{}, {}, {}, {}, {}, {}]}};
            scope.$digest();
            var link = angular.element(this.element.querySelectorAll('a.header-link')[0]);
            expect(link.text()).toBe('See More');
            controller.full = true;
            scope.$digest();
            expect(link.text()).toBe('See Less');
        });
        it('with the correct number of list items for properties', function() {
            var controller = this.element.controller('classPreview');
            scope.classObj = {matonto: {properties: [{}, {}, {}, {}, {}]}};
            scope.$digest();
            expect(this.element.querySelectorAll('.props li').length).toBe(scope.classObj.matonto.properties.length);
        });
    });
});