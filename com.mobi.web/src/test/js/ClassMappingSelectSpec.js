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
describe('Class Mapping Select directive', function() {
    var $compile,
        scope,
        element,
        controller;

    beforeEach(function() {
        module('templates');
        module('classMappingSelect');
        injectTrustedFilter();
        injectHighlightFilter();
        mockMappingManager();
        mockMapperState();
        mockUtil();

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.onChange = jasmine.createSpy('onChange');
        element = $compile(angular.element('<class-mapping-select ng-model="bindModel" on-change="onChange()"></class-mapping-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('onChange should be called in the parent scope', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.onChange();
            expect(scope.onChange).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        beforeEach(function() {
            controller = element.controller('classMappingSelect');
        });
        it('selectedProp should be two way bound', function() {
            controller.bindModel = 'test';
            scope.$digest();
            expect(scope.bindModel).toEqual('test');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.hasClass('class-mapping-select')).toBe(true);
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
        });
    });
});