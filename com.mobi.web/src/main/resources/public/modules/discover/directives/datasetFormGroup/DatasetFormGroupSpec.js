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
describe('Dataset Form Group directive', function() {
    var $compile, scope, element, controller;

    beforeEach(function() {
        module('templates');
        module('datasetFormGroup');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.onSelect = jasmine.createSpy('onSelect');

        element = $compile(angular.element('<dataset-form-group ng-model="bindModel" on-select="onSelect()"></dataset-form-group>'))(scope);
        scope.$digest();
        controller = element.controller('datasetFormGroup');
    });

    describe('in isolated scope', function() {
        it('onChange should be called in parent scope', function() {
            element.isolateScope().onSelect();
            expect(scope.onSelect).toHaveBeenCalled();
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            controller.bindModel = 'different';
            scope.$digest();
            expect(scope.bindModel).toEqual('different');
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('dataset-form-group')).toBe(true);
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a .flex-container', function() {
            expect(element.querySelectorAll('.flex-container').length).toBe(1);
        });
        it('with a dataset-select', function() {
            expect(element.find('dataset-select').length).toBe(1);
        });
        it('with a .btn-clear', function() {
            expect(element.querySelectorAll('.btn-clear').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('clear should clear the proper value', function() {
            controller.bindModel = 'test';
            controller.clear();
            expect(controller.bindModel).toBe('');
            scope.$digest();
            expect(scope.bindModel).toBe('');
        });
    });
});
