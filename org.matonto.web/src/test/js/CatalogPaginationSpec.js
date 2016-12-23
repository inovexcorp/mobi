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
describe('Catalog Pagination directive', function() {
    var $compile,
        scope,
        catalogManagerSvc,
        catalogStateSvc,
        $timeout,
        controller;

    beforeEach(function() {
        module('templates');
        module('catalogPagination');
        mockCatalogManager();
        mockCatalogState();

        inject(function( _$compile_, _$rootScope_, _catalogManagerService_, _catalogStateService_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
            $timeout = _$timeout_;
        });
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<catalog-pagination></catalog-pagination>'))(scope);
            scope.$digest();
            controller = this.element.controller('catalogPagination');
        });
        it('should get the indicated page of paginated results', function() {
            var currentPage = catalogStateSvc.currentPage;
            controller.getPage('next');
            $timeout.flush();
            expect(catalogManagerSvc.getResultsPage).toHaveBeenCalledWith(catalogStateSvc.links.next);
            expect(catalogStateSvc.currentPage).toBe(currentPage + 1);
            expect(catalogStateSvc.setPagination).toHaveBeenCalled();

            currentPage = catalogStateSvc.currentPage;
            controller.getPage('prev');
            $timeout.flush();
            expect(catalogManagerSvc.getResultsPage).toHaveBeenCalledWith(catalogStateSvc.links.prev);
            expect(catalogStateSvc.currentPage).toBe(currentPage - 1);
            expect(catalogStateSvc.setPagination).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<catalog-pagination></catalog-pagination>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('catalog-pagination')).toBe(true);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(1);
        });
    });
});