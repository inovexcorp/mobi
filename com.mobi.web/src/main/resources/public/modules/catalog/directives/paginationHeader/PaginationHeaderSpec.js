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
describe('Pagination Header directive', function() {
    var $compile, scope, catalogManagerSvc, catalogStateSvc;

    beforeEach(function() {
        module('templates');
        module('paginationHeader');
        mockCatalogState();
        mockCatalogManager();

        inject(function(_$compile_, _$rootScope_, _catalogStateService_, _catalogManagerService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
            catalogManagerSvc = _catalogManagerService_;
        });

        scope.listKey = '';
        scope.changeSort = jasmine.createSpy('changeSort');
        this.element = $compile(angular.element('<pagination-header list-key="listKey" change-sort="changeSort()"></pagination-header>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            this.isolatedScope = this.element.isolateScope();
        });
        it('listKey should be one way bound', function() {
            this.isolatedScope.listKey = 'test';
            scope.$digest();
            expect(scope.listKey).toBe('');
        });
        it('changeSort should be called in parent scope when invoked', function() {
            this.isolatedScope.changeSort();
            expect(scope.changeSort).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('pagination-header')).toBe(true);
        });
        it('with a paging-details', function() {
            expect(this.element.find('paging-details').length).toBe(1);
        });
        it('with a sort-options', function() {
            expect(this.element.find('sort-options').length).toBe(1);
        });
    });
});