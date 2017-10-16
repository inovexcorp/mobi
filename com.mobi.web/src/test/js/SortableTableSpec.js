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
describe('Sortable Table directive', function() {
    var $compile, scope, element, isolatedScope, controller;

    beforeEach(function() {
        module('templates');
        module('sortableTable');
        injectTrustedFilter();
        mockAnalyticState();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.data = [{
            var1: {type: 'a-type1', value: 'a-value1'},
            var2: {type: 'a-type2', value: 'a-value2'}
        }, {
            var1: {type: 'b-type1', value: 'b-value1'},
            var2: {type: 'b-type2', value: 'b-value2'}
        }];
        scope.bindings = ['var1', 'var2'];
        scope.headers = {var1: 'var1', var2: 'var2'};
        scope.onSort = jasmine.createSpy('onSort');
        element = $compile(angular.element('<sortable-table bindings="bindings" data="data" headers="headers" on-sort="onSort()"></sortable-table>'))(scope);
        scope.$digest();
        isolatedScope = element.isolateScope();
        controller = element.controller('sortableTable');
    });

    describe('in isolated scope', function() {
        it('data is one way bound', function() {
            isolatedScope.data = [];
            scope.$digest();
            expect(scope.data).toEqual([{
                var1: {type: 'a-type1', value: 'a-value1'},
                var2: {type: 'a-type2', value: 'a-value2'}
            }, {
                var1: {type: 'b-type1', value: 'b-value1'},
                var2: {type: 'b-type2', value: 'b-value2'}
            }]);
        });
        it('headers is one way bound', function() {
            isolatedScope.headers = [];
            scope.$digest();
            expect(scope.headers).toEqual({var1: 'var1', var2: 'var2'});
        });
    });
    describe('controller bound variables', function() {
        it('bindings is one way bound', function() {
            controller.bindings = [];
            scope.$digest();
            expect(scope.bindings).toEqual(['var1', 'var2']);
        });
        it('onSort to be called in parent scope', function() {
            controller.onSort();
            expect(scope.onSort).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('TABLE');
            expect(element.hasClass('sortable-table')).toBe(true);
            expect(element.hasClass('sparql-result-table')).toBe(true);
            expect(element.hasClass('table')).toBe(true);
            expect(element.hasClass('table-hover')).toBe(true);
        });
        it('depending on how many binding names there are', function() {
            var theadList = element.querySelectorAll('thead');
            expect(element.html()).not.toContain('None');
            expect(theadList.length).toBe(1);
            var thead = theadList[0];
            expect(thead.querySelectorAll('th').length).toBe(scope.bindings.length);
        });
        it('depending on how many results there are', function() {
            var tbodyList = element.querySelectorAll('tbody');
            expect(element.html()).not.toContain('None');
            expect(tbodyList.length).toBe(1);
            var tbody = tbodyList[0];
            expect(tbody.querySelectorAll('tr').length).toBe(scope.data.length);
        });
    });
    describe('controller methods', function() {
        it('sort calls the correct methods and sets the correct variables', function() {
            controller.sort('var1');
            expect(scope.onSort).toHaveBeenCalled();
            expect(controller.descendingList.var1).toEqual(true);
        });
    });
    it('descendingList is kept in sync as bindings changes', function() {
        controller.descendingList = {var1: true, var2: undefined};
        scope.bindings = ['var1', 'new'];
        scope.$apply();
        expect(controller.descendingList).toEqual({var1: true, new: undefined});
    });
});