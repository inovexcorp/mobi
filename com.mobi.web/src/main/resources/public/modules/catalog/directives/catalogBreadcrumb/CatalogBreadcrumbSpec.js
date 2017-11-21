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
describe('Catalog Breadcrumb directive', function() {
    var $compile, scope, catalogManagerSvc, catalogStateSvc;

    beforeEach(function() {
        module('templates');
        module('catalogBreadcrumb');
        mockCatalogManager();
        mockCatalogState();

        inject(function(_$compile_, _$rootScope_, _catalogManagerService_, _catalogStateService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            catalogManagerSvc = _catalogManagerService_;
            catalogStateSvc = _catalogStateService_;
        });

        this.catalog = {openedPath: [{}, {}]};
        catalogStateSvc.getCurrentCatalog.and.returnValue(this.catalog);
        this.element = $compile(angular.element('<catalog-breadcrumb></catalog-breadcrumb>'))(scope);
        scope.$digest();
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        catalogManagerSvc = null;
        catalogStateSvc = null;
        this.element.remove();
    });

    describe('controller methods', function() {
        beforeEach(function() {
            this.controller = this.element.controller('catalogBreadcrumb');
        });
        it('should navigate to the selected crumb', function() {
            this.controller.clickCrumb(0);
            expect(catalogStateSvc.resetPagination).toHaveBeenCalled();
            expect(catalogStateSvc.getCurrentCatalog).toHaveBeenCalled();
            expect(this.catalog.openedPath.length).toBe(1);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('catalog-breadcrumb')).toBe(true);
            expect(this.element.hasClass('breadcrumb')).toBe(true);
        });
        it('depending on how many entities are in the path', function() {
            expect(this.element.find('li').length).toBe(this.catalog.openedPath.length);
        });
        it('depending on whether an entity is the last in the list', function() {
            var items = this.element.find('li');
            var firstItem = angular.element(items[0]);
            expect(firstItem.hasClass('active')).toBe(false);
            expect(firstItem.find('span').length).toBe(0);
            expect(firstItem.find('a').length).toBe(1);
            var secondItem = angular.element(items[1]);
            expect(secondItem.hasClass('active')).toBe(true);
            expect(secondItem.find('span').length).toBe(1);
            expect(secondItem.find('a').length).toBe(0);
        });
    });
});