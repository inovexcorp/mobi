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
describe('Class Preview directive', function() {
    var $compile,
        scope,
        element,
        controller,
        ontologyManagerSvc,
        mapperStateSvc;

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
        element = $compile(angular.element('<class-preview class-obj="classObj" ontologies="ontologies"></class-preview>'))(scope);
        scope.$digest();
        controller = element.controller('classPreview');
    });

    describe('controller bound variable', function() {
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
        var props = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
        mapperStateSvc.getClassProps.and.returnValue(props);
        scope.classObj = {'@id': ''};
        scope.$digest();
        expect(mapperStateSvc.getClassProps).toHaveBeenCalledWith(controller.ontologies, controller.classObj['@id']);
        expect(controller.props).toEqual(props);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('class-preview')).toBe(true);
        });
        it('depending on whether classObj has any properties', function() {
            var propList = angular.element(element.querySelectorAll('ul')[0]);
            expect(propList.html()).toContain('None');

            controller.props = [{}];
            scope.$digest();
            expect(propList.html()).not.toContain('None');
        });
        it('depending on whether classObj has more than 10 properties', function() {
            controller.props = [{}];
            scope.$digest();
            var items = element.querySelectorAll('ul li');
            var lastItem = angular.element(_.last(items));
            expect(items.length).toBe(controller.props.length);
            expect(lastItem.hasClass('last')).toBe(true);
            expect(lastItem.hasClass('limited')).toBe(false);

            controller.props = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
            scope.$digest();
            items = element.querySelectorAll('ul li');
            lastItem = angular.element(_.last(items));
            expect(items.length).toBe(10);
            expect(lastItem.hasClass('last')).toBe(true);
            expect(lastItem.hasClass('limited')).toBe(true);
        });
        it('depending on whether a property is deprecated', function() {
            controller.props = [{}];
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            scope.$digest();
            expect(element.querySelectorAll('ul li span.deprecated').length).toBe(1);
        });
    });
});