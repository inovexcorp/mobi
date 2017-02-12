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
        ontologyManagerSvc,
        mapperStateSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('classPreview');
        mockOntologyManager();
        mockMapperState();

        inject(function(_$compile_, _$rootScope_, _ontologyManagerService_, _mapperStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            ontologyManagerSvc = _ontologyManagerService_;
            mapperStateSvc = _mapperStateService_;
        });

        scope.classObj = {};
        scope.ontologies = [];
        this.element = $compile(angular.element('<class-preview class-obj="classObj" ontologies="ontologies"></class-preview>'))(scope);
        scope.$digest();
    });

    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = this.element.controller('classPreview');
        });
        it('classObj should be one way bound', function() {
            controller.classObj = {'@id': ''};
            scope.$digest();
            expect(scope.classObj).toEqual({});
        });
        it('ontologies should be one way bound', function() {
            controller.ontologies = [{}];
            scope.$digest();
            expect(scope.ontologies).toEqual([]);
        });
    });
    it('should set the property list when the classObj changes', function() {
        controller = this.element.controller('classPreview');
        var props = [{}];
        mapperStateSvc.getClassProps.and.returnValue(props);
        scope.classObj = {'@id': ''};
        scope.$digest();
        expect(mapperStateSvc.getClassProps).toHaveBeenCalledWith(controller.ontologies, controller.classObj['@id']);
        expect(controller.props).toEqual(props);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('class-preview')).toBe(true);
        });
        it('depending on whether classObj has any properties', function() {
            controller = this.element.controller('classPreview');
            scope.$digest();
            var propList = angular.element(this.element.querySelectorAll('ul')[0]);
            expect(propList.html()).toContain('None');

            controller.props = [{}];
            scope.$digest();
            expect(propList.html()).not.toContain('None');
            expect(propList.children().length).toBe(controller.props.length);
        });
    });
});