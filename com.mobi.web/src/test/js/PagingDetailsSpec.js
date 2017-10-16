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
describe('Paging Details directive', function() {
    var $compile,
        scope,
        element,
        isolatedScope;

    beforeEach(function() {
        module('templates');
        module('pagingDetails');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.totalSize = 0;
        scope.pageIndex = 0;
        scope.limit = 0;
        element = $compile(angular.element('<paging-details total-size="totalSize" page-index="pageIndex" limit="limit"></paging-details>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
    });

    describe('in isolated scope', function() {
        it('totalSize should be one way bound', function() {
            isolatedScope.totalSize = 1;
            scope.$digest();
            expect(scope.totalSize).toBe(0);
        });
        it('pageIndex should be one way bound', function() {
            isolatedScope.pageIndex = 1;
            scope.$digest();
            expect(scope.pageIndex).toBe(0);
        });
        it('limit should be one way bound', function() {
            isolatedScope.limit = 1;
            scope.$digest();
            expect(scope.limit).toBe(0);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('paging-details')).toBe(true);
        });
        it('depending on what numbers are passed', function() {
            var p = element.find('p');
            var tests = [
                {
                    pageIndex: 0,
                    limit: 10,
                    totalSize: 5,
                    result: 'Showing 1 to 5 of 5'
                },
                {
                    pageIndex: 0,
                    limit: 10,
                    totalSize: 15,
                    result: 'Showing 1 to 10 of 15'
                },
                {
                    pageIndex: 1,
                    limit: 10,
                    totalSize: 15,
                    result: 'Showing 11 to 15 of 15'
                },
                {
                    pageIndex: 0,
                    limit: 10,
                    totalSize: 0,
                    result: 'Showing 0 to 0 of 0'
                },
                {
                    pageIndex: 1,
                    limit: 10,
                    totalSize: 20,
                    result: 'Showing 11 to 20 of 20'
                },
                {
                    pageIndex: 1,
                    limit: 1,
                    totalSize: 5,
                    result: 'Showing 2 to 2 of 5'
                }
            ];
            _.forEach(tests, function(test) {
                scope.pageIndex = test.pageIndex;
                scope.limit = test.limit;
                scope.totalSize = test.totalSize;
                scope.$digest();
                expect(p.text()).toBe(test.result);
            });
        });
    });
});