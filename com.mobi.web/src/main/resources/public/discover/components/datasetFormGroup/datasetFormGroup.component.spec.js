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
describe('Dataset Form Group Component', function() {
    var $compile, scope;

    beforeEach(function() {
        module('templates');
        module('discover');
        mockComponent('discover', 'datasetSelect');

        inject(function(_$compile_, _$rootScope_) {
            $compile = _$compile_;
            scope = _$rootScope_;
        });

        scope.bindModel = '';
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.onSelect = jasmine.createSpy('onSelect');
        this.element = $compile(angular.element('<dataset-form-group bindModel="bindModel" change-event="changeEvent(value)" on-select="onSelect()"></dataset-form-group>'))(scope);
        scope.$digest();
        this.controller = this.element.controller('datasetFormGroup');
    });

    afterEach(function() {
        $compile = null;
        scope = null;
        this.element.remove();
    });

    describe('controller bound variable', function() {
        it('bindModel should be one way bound', function() {
            this.controller.bindModel = 'Test';
            scope.$digest();
            expect(scope.bindModel).toEqual('');
        });
        it('changeEvent should be called in the parent scope', function() {
            this.controller.changeEvent({value: 'Test'});
            expect(scope.changeEvent).toHaveBeenCalledWith('Test');
        });
        it('onSelect should be called in the parent scope', function() {
            this.controller.onSelect();
            expect(scope.onSelect).toHaveBeenCalled();
        });
    });
    describe('contains the correct html', function() {
        it('for wrapping containers', function() {
            expect(this.element.prop('tagName')).toBe('DATASET-FORM-GROUP');
        });
        it('with a custom-label', function() {
            expect(this.element.find('custom-label').length).toBe(1);
        });
        it('with a .flex-container', function() {
            expect(this.element.querySelectorAll('.flex-container').length).toBe(1);
        });
        it('with a dataset-select', function() {
            expect(this.element.find('dataset-select').length).toBe(1);
        });
        it('with a .btn-clear', function() {
            expect(this.element.querySelectorAll('.btn-clear').length).toBe(1);
        });
    });
    describe('controller methods', function() {
        it('clear should clear the proper value', function() {
            this.controller.bindModel = 'test';
            this.controller.clear();
            expect(this.controller.bindModel).toBe('');
            scope.$digest();
            expect(scope.changeEvent).toHaveBeenCalledWith('');
            expect(scope.bindModel).toBe('');
        });
    });
});
