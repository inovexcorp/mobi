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
describe('Prop Select directive', function() {
    var $compile,
        scope,
        utilSvc,
        controller;

    beforeEach(function() {
        module('templates');
        module('propSelect');
        mockUtil();

        module(function($provide) {
            $provide.value('highlightFilter', jasmine.createSpy('highlightFilter'));
            $provide.value('trustedFilter', jasmine.createSpy('trustedFilter'));
        });

        inject(function(_$compile_, _$rootScope_, _utilService_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            utilSvc = _utilService_;
        });
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            scope.props = [];
            scope.selectedProp = '';
            scope.onChange = jasmine.createSpy('onChange');
            this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
        });
        it('props should be one way bound', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.props = [{}];
            scope.$digest();
            expect(scope.props).not.toEqual([{}]);
        });
        it('onChange should be called in the parent scope', function() {
            var isolatedScope = this.element.isolateScope();
            isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            scope.props = [];
            scope.selectedProp = '';
            scope.onChange = jasmine.createSpy('onChange');
            this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
            controller = this.element.controller('propSelect');
        });
        it('selectedProp should be two way bound', function() {
            controller.selectedProp = 'test';
            scope.$digest();
            expect(scope.selectedProp).toEqual('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        beforeEach(function() {
            this.element = $compile(angular.element('<prop-select props="props" selected-prop="selectedProp" on-change="onChange()"></prop-select>'))(scope);
            scope.$digest();
        });
        it('for wrapping containers', function() {
            expect(this.element.hasClass('prop-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(this.element.find('ui-select').length).toBe(1);
        });
    });
});