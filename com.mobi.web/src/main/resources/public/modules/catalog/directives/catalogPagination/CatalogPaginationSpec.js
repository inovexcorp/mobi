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
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('catalogPagination');
        mockCatalogState();
        mockUtil();

        inject(function( _$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.listKey = 'test';
        scope.getPage = jasmine.createSpy('getPage');
        this.element = $compile(angular.element('<catalog-pagination list-key="listKey" get-page="getPage()"></catalog-pagination>'))(scope);
        scope.$digest();
        this.isolatedScope = this.element.isolateScope();
        this.controller = this.element.controller('catalogPagination');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('in isolated scope', function() {
        it('listkey should be one way bound', function() {
            this.isolatedScope.listKey = 'blah';
            scope.$digest();
            expect(scope.listKey).toEqual('test');
        });
        it('getPage should be called in parent scope when invoked', function() {
            this.isolatedScope.getPage();
            expect(scope.getPage).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('catalog-pagination')).toBe(true);
        });
        it('with a pagination', function() {
            expect(this.element.find('pagination').length).toBe(1);
        });
    });
});