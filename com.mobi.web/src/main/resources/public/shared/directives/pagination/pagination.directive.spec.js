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
describe('Pagination directive', function() {
    var $compile, scope, $timeout;

    beforeEach(function() {
        module('templates');
        module('pagination');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        scope.currentPage = 1;
        scope.total = 10;
        scope.limit = 1;
        scope.getPage = jasmine.createSpy('getPage');
        this.element = $compile(angular.element('<pagination total="total" limit="limit" current-page="currentPage" get-page="getPage()"></pagination>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('pagination');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        $timeout = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('total should be one way bound', function() {
            this.controller.total = 0;
            scope.$digest();
            expect(scope.total).toEqual(10);
        });
        it('limit should be one way bound', function() {
            this.controller.limit = 0;
            scope.$digest();
            expect(scope.limit).toEqual(1);
        });
        it('currentPage should be two way bound', function() {
            this.controller.currentPage = 2;
            scope.$digest();
            expect(scope.currentPage).toBe(2);
        });
        it('getPage should be called in parent scope when invoked', function() {
            this.controller.getPage();
            expect(scope.getPage).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.hasClass('page-nav')).toBe(true);
        });
        it('with a ul[uib-pagination]', function() {
            expect(this.element.querySelectorAll('ul[uib-pagination]').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('should change the page', function() {
            this.controller.changePage();
            $timeout.flush();
            expect(scope.getPage).toHaveBeenCalled();
        });
    });
});