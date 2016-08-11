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
describe('String Select directive', function() {
    var $compile,
        scope,
        element,
        $filter,
        controller,
        prefixes,
        item,
        splitIRIFilter;

    beforeEach(function() {
        module('templates');
        module('stringSelect');
        injectHighlightFilter();
        injectTrustedFilter();
        injectSplitIRIFilter();
        injectRemoveIriFromArrayFilter();
        mockOntologyManager();
        mockPrefixes();

        inject(function(_$compile_, _$rootScope_, _$filter_, _prefixes_, _splitIRIFilter_) {
            $compile = _$compile_;
            scope = _$rootScope_;
            $filter = _$filter_;
            prefixes = _prefixes_;
            splitIRIFilter = _splitIRIFilter_;
        });
    });

    beforeEach(function() {
        scope.bindModel = [];
        scope.changeEvent = jasmine.createSpy('changeEvent');
        scope.displayText = '';
        scope.selectList = [];
        scope.mutedText = '';

        element = $compile(angular.element('<string-select ng-model="bindModel" change-event="changeEvent" display-text="displayText" select-list="selectList" muted-text="mutedText"></string-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        it('displayText should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.displayText = 'new value';
            scope.$digest();
            expect(scope.displayText).toEqual('new value');
        });
        it('mutedText should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.mutedText = 'new value';
            scope.$digest();
            expect(scope.mutedText).toEqual('new value');
        });
        it('selectList should be two way bound', function() {
            var isolatedScope = element.isolateScope();
            isolatedScope.selectList = ['new value'];
            scope.$digest();
            expect(scope.selectList).toEqual(['new value']);
        });
    });
    describe('controller bound variables', function() {
        it('bindModel should be two way bound', function() {
            var controller = element.controller('stringSelect');
            controller.bindModel = ['new value'];
            scope.$digest();
            expect(scope.bindModel).toEqual(['new value']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for a DIV', function() {
            expect(element.prop('tagName')).toBe('DIV');
        });
        it('has form-group class', function() {
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('based on custom-label', function() {
            var items = element.find('custom-label');
            expect(items.length).toBe(1);
        });
        it('based on ui-select', function() {
            var items = element.find('ui-select');
            expect(items.length).toBe(1);
        });
    });
    describe('controller methods', function() {
        beforeEach(function() {
            controller = element.controller('stringSelect');
        });
        it('getItemNamespace returns the correct value', function() {
            var result = controller.getItemNamespace('string');
            expect(splitIRIFilter).toHaveBeenCalledWith('string');
            expect(result).toEqual(splitIRIFilter('string').begin + splitIRIFilter('string').then);
        });
        describe('disableChoice', function() {
            it('when item is not DataTypeProperty or ObjectProperty, returns false', function() {
                expect(controller.disableChoice('')).toBe(false);
            });
            describe('when item is DataTypeProperty', function() {
                beforeEach(function() {
                    item = prefixes.owl + 'DataTypeProperty';
                });
                it('and ObjectProperty is selected, returns true', function() {
                    controller.bindModel = [prefixes.owl + 'ObjectProperty'];
                    expect(controller.disableChoice(item)).toBe(true);
                });
                it('and ObjectProperty is not selected, returns false', function() {
                    expect(controller.disableChoice(item)).toBe(false);
                });
            });
            describe('when item is ObjectProperty', function() {
                beforeEach(function() {
                    item = prefixes.owl + 'ObjectProperty';
                });
                it('and DataTypeProperty is selected, returns true', function() {
                    controller.bindModel = [prefixes.owl + 'DataTypeProperty'];
                    expect(controller.disableChoice(item)).toBe(true);
                });
                it('and DataTypeProperty is not selected, returns false', function() {
                    expect(controller.disableChoice(item)).toBe(false);
                });
            });
        });
    });
});