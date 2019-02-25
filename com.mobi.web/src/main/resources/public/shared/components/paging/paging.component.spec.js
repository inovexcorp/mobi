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
describe('Paging component', function() {
    var $compile, scope, $timeout;

    beforeEach(function() {
        module('templates');
        module('shared');

        inject(function(_$compile_, _$rootScope_, _$timeout_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $timeout = _$timeout_;
        });

        scope.currentPage = 1;
        scope.total = 10;
        scope.limit = 1;
        scope.changeEvent = jasmine.createSpy('changeEvent');
        this.element = $compile(angular.element('<paging total="total" limit="limit" current-page="currentPage" change-event="changeEvent(page)"></paging>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('paging');
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
        it('currentPage should be one way bound', function() {
            this.controller.currentPage = 2;
            scope.$digest();
            expect(scope.currentPage).toEqual(1);
        });
        it('changeEvent should be called in parent scope', function() {
            this.controller.changeEvent({page: 1});
            expect(scope.changeEvent).toHaveBeenCalledWith(1);
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toEqual('PAGING');
            expect(this.element.querySelectorAll('.paging').length).toEqual(1);
        });
        it('with a .paging-details', function() {
            expect(this.element.querySelectorAll('.paging-details').length).toEqual(1);
        });
        it('with a ul[uib-pagination]', function() {
            expect(this.element.querySelectorAll('ul[uib-pagination]').length).toEqual(1);
        });
        _.forEach([
            {
                currentPage: 1,
                limit: 10,
                total: 5,
                result: 'Showing 1 to 5 of 5'
            },
            {
                currentPage: 1,
                limit: 10,
                total: 15,
                result: 'Showing 1 to 10 of 15'
            },
            {
                currentPage: 2,
                limit: 10,
                total: 15,
                result: 'Showing 11 to 15 of 15'
            },
            {
                currentPage: 1,
                limit: 10,
                total: 0,
                result: 'Showing 0 to 0 of 0'
            },
            {
                currentPage: 2,
                limit: 10,
                total: 20,
                result: 'Showing 11 to 20 of 20'
            },
            {
                currentPage: 2,
                limit: 1,
                total: 5,
                result: 'Showing 2 to 2 of 5'
            }
        ], test => {
            it('when currentPage is ' + test.currentPage + ', limit is ' + test.limit + ', and total is ' + test.total, function() {
                scope.currentPage = test.currentPage;
                scope.limit = test.limit;
                scope.total = test.total;
                scope.$digest();
                expect(this.element.find('p').text()).toEqual(test.result);
            });
        });
    });
    describe('controller methods', function() {
        it('should change the page', function() {
            this.controller.onChange();
            $timeout.flush();
            expect(scope.changeEvent).toHaveBeenCalledWith(this.controller.currentPage);
        });
    });
});