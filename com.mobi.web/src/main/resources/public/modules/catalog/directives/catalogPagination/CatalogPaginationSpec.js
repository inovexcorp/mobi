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
describe('Catalog Pagination directive', function() {
    var $compile,
        scope,
        $q,
        element,
        controller,
        catalogStateSvc,
        utilSvc;

    beforeEach(function() {
        module('templates');
        module('catalogPagination');
        mockCatalogState();
        mockUtil();

        inject(function( _$compile_, _$rootScope_, _catalogStateService_, _utilService_, _$q_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogStateSvc = _catalogStateService_;
            utilSvc = _utilService_;
            $q = _$q_;
        });

        element = $compile(angular.element('<catalog-pagination></catalog-pagination>'))(scope);
        scope.$digest();
        controller = element.controller('catalogPagination');
    });

    describe('controller methods', function() {
        describe('should get the indicated page of paginated results', function() {
            it('unless an error occurs', function() {
                utilSvc.getResultsPage.and.returnValue($q.reject('Error message'));
                var currentPage = catalogStateSvc.currentPage;
                controller.getPage('next');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(catalogStateSvc.links.next);
                expect(catalogStateSvc.currentPage).toBe(currentPage);
                expect(catalogStateSvc.setPagination).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');

                currentPage = catalogStateSvc.currentPage;
                controller.getPage('prev');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(catalogStateSvc.links.prev);
                expect(catalogStateSvc.currentPage).toBe(currentPage);
                expect(catalogStateSvc.setPagination).not.toHaveBeenCalled();
                expect(utilSvc.createErrorToast).toHaveBeenCalledWith('Error message');
            });
            it('successfully', function() {
                var currentPage = catalogStateSvc.currentPage;
                controller.getPage('next');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(catalogStateSvc.links.next);
                expect(catalogStateSvc.currentPage).toBe(currentPage + 1);
                expect(catalogStateSvc.setPagination).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();

                currentPage = catalogStateSvc.currentPage;
                controller.getPage('prev');
                scope.$apply();
                expect(utilSvc.getResultsPage).toHaveBeenCalledWith(catalogStateSvc.links.prev);
                expect(catalogStateSvc.currentPage).toBe(currentPage - 1);
                expect(catalogStateSvc.setPagination).toHaveBeenCalled();
                expect(utilSvc.createErrorToast).not.toHaveBeenCalled();
            });
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('catalog-pagination')).toBe(true);
        });
        it('with a pagination', function() {
            expect(element.find('pagination').length).toBe(1);
        });
    });
});