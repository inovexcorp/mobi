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
describe('Column Form directive', function() {
    var $compile,
        scope;

    beforeEach(function() {
        module('columnForm');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });
    });

    injectDirectiveTemplate('modules/mapper/directives/columnForm/columnForm.html');

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.set = jasmine.createSpy('set');
            scope.setNext = jasmine.createSpy('setNext');
            scope.lastProp = false;
            scope.columns = [];
            scope.selectedColumn = '';

            this.element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();
        });
        it('lastProp should be two way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.lastProp = true;
            scope.$digest();
            expect(scope.lastProp).toEqual(true);
        });
        it('columns should be two way bound', function() {
            var controller = this.element.controller('columnForm');
            controller.columns = ['test'];
            scope.$digest();
            expect(scope.columns).toEqual(['test']);
        });
        it('selectedColumn should be two way bound', function() {
            var controller = this.element.controller('columnForm');
            controller.selectedColumn = 'test';
            scope.$digest();
            expect(scope.selectedColumn).toEqual('test');
        });
        it('set should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.set();

            expect(scope.set).toHaveBeenCalled();
        });
        it('setNext should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.setNext();

            expect(scope.setNext).toHaveBeenCalled();
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            var element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();

            expect(element.hasClass('column-form')).toBe(true);
        });
        it('with a column select', function() {
            var element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();

            expect(element.find('column-select').length).toBe(1);
        });
        it('depending on whether a column is selected', function() {
            var element = $compile(angular.element('<column-form set="set(column)" set-next="setNext(column)" last-prop="lastProp" columns="columns" selected-column="selectedColumn"></column-form>'))(scope);
            scope.$digest();
            var buttons = element.find('custom-button');
            expect(buttons.length).toBe(0);
            
            element.controller('columnForm').selectedColumn = 'test';
            scope.$digest();
            buttons = element.find('custom-button');
            expect(buttons.length).toBe(2);
            expect(['Set', 'Set &amp; Next'].indexOf(angular.element(buttons[0]).text()) >= 0).toBe(true);
            expect(['Set', 'Set & Next'].indexOf(angular.element(buttons[1]).text()) >= 0).toBe(true);
        });
    });
});