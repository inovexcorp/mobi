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
describe('Branch Select directive', function() {
    var $compile, scope, isolatedScope, element, controller, catalogManagerSvc, ontologyStateSvc;

    beforeEach(function() {
        module('templates');
        module('branchSelect');
        mockCatalogManager();
        mockOntologyState();
        mockUtil();
        injectTrustedFilter();
        injectHighlightFilter();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _ontologyStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            ontologyStateSvc = _ontologyStateService_;
        });

        scope.bindModel = {};

        element = $compile(angular.element('<branch-select ng-model="bindModel"></branch-select>'))(scope);
        scope.$digest();

        controller = element.controller('branchSelect');
        isolatedScope = element.isolateScope();
    });

    describe('controller bound variables', function() {
        it('ngModel should be two way bound', function() {
            controller.bindModel = {id: 'id'};
            scope.$digest();
            expect(scope.bindModel).toEqual({id: 'id'});
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a div', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('based on .branch-select', function() {
            expect(element.hasClass('branch-select')).toBe(true);
        });
        it('based on ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('catalogManager.getRecordBranches is called initially', function() {
            expect(catalogManagerSvc.getRecordBranches).toHaveBeenCalledWith(ontologyStateSvc.listItem.recordId, '');
        });
    });
});