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
describe('Resource Type directive', function() {
    var $compile,
        scope,
        catalogManagerSvc;

    beforeEach(function() {
        module('templates');
        module('resourceType');
        mockCatalogManager();

        inject(function(_catalogManagerService_) {
            catalogManagerSvc = _catalogManagerService_;
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.type = '';

            this.element = $compile(angular.element('<resource-type type="type"></resource-type>'))(scope);
            scope.$digest();
        });
        it('type should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.type = 'test';
            scope.$digest();
            expect(scope.type).toEqual('test');
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            scope.type = '';

            this.element = $compile(angular.element('<resource-type type="type"></resource-type>'))(scope);
            scope.$digest();
        });
        it('should get the shorthand type string', function() {
            var controller = this.element.controller('resourceType');
            var result = controller.getType(scope.type);

            expect(typeof result).toBe('string');
            expect(catalogManagerSvc.getType).toHaveBeenCalledWith(scope.type);
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            scope.type = '';

            this.element = $compile(angular.element('<resource-type type="type"></resource-type>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('label')).toBe(true);
        });
        it('with the correct classes depending on the resource type', function() {
            var controller = this.element.controller('resourceType');
            spyOn(controller, 'getType').and.callFake(_.identity);
            scope.$digest();
            expect(this.element.hasClass('label-default')).toBe(true);

            scope.type = 'Ontology';
            scope.$digest();
            expect(this.element.hasClass('label-primary')).toBe(true);

            scope.type = 'Mapping';
            scope.$digest();
            expect(this.element.hasClass('label-success')).toBe(true);
        });
    });
});