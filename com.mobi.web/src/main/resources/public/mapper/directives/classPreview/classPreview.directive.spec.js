/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2019 iNovex Information Systems, Inc.
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
    var $compile, scope, ontologyManagerSvc, mapperStateSvc;

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
        this.controller = this.element.controller('classPreview');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        ontologyManagerSvc = null;
        mapperStateSvc = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('classObj should be one way bound', function() {
            this.controller.classObj = {'@id': ''};
            scope.$digest();
            expect(scope.classObj).toEqual({});
        });
        it('ontologies should be one way bound', function() {
            this.controller.ontologies = [{}];
            scope.$digest();
            expect(scope.ontologies).toEqual([]);
        });
    });
    it('should set the property list when the classObj changes', function() {
        var props = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
        mapperStateSvc.getClassProps.and.returnValue(props);
        scope.classObj = {'@id': ''};
        scope.$digest();
        expect(mapperStateSvc.getClassProps).toHaveBeenCalledWith(this.controller.ontologies, this.controller.classObj['@id']);
        expect(this.controller.props).toEqual(props);
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('class-preview')).toBe(true);
        });
        it('depending on whether classObj has any properties', function() {
            var propList = angular.element(this.element.querySelectorAll('ul')[0]);
            expect(propList.html()).toContain('None');

            this.controller.props = [{}];
            scope.$digest();
            expect(propList.html()).not.toContain('None');
        });
        it('depending on whether classObj has more than 10 properties', function() {
            this.controller.props = [{}];
            scope.$digest();
            var items = this.element.querySelectorAll('ul li');
            var lastItem = angular.element(_.last(items));
            expect(items.length).toBe(this.controller.props.length);
            expect(lastItem.hasClass('last')).toBe(true);
            expect(lastItem.hasClass('limited')).toBe(false);

            this.controller.props = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
            scope.$digest();
            items = this.element.querySelectorAll('ul li');
            lastItem = angular.element(_.last(items));
            expect(items.length).toBe(10);
            expect(lastItem.hasClass('last')).toBe(true);
            expect(lastItem.hasClass('limited')).toBe(true);
        });
        it('depending on whether a property is deprecated', function() {
            this.controller.props = [{}];
            ontologyManagerSvc.isDeprecated.and.returnValue(true);
            scope.$digest();
            expect(this.element.querySelectorAll('ul li span.deprecated').length).toBe(1);
        });
    });
});