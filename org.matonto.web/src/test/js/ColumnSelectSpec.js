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
describe('Column Select directive', function() {
    var $compile,
        scope,
        controller;

    beforeEach(function() {
        module('templates');
        module('columnSelect');

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.selectedColumn = '';
            this.element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);
            scope.$digest();
        });
        it('columns should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.columns = ['test'];
            scope.$digest();
            expect(scope.columns).toEqual(['test']);
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            scope.columns = [];
            scope.selectedColumn = '';
            this.element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);
            scope.$digest();
            controller = this.element.controller('columnSelect');
        });
        it('selectedColumn should be two way bound', function() {
            controller.selectedColumn = 'test';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<column-select columns="columns" selected-column="selectedColumn"></column-select>'))(scope);;
            scope.$digest();
        });
        it('for wrapping containers', function() { 
            expect(this.element.hasClass('column-select')).toBe(true);
        });
        it('with a column select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
});