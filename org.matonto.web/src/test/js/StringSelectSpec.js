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
        $filter,
        element,
        controller,
        isolatedScope,
        prefixes,
        splitIRIFilter,
        item;

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

        scope.bindModel = [];
        scope.onChange = jasmine.createSpy('onChange');
        scope.displayText = '';
        scope.selectList = [];
        scope.mutedText = '';
        element = $compile(angular.element('<string-select ng-model="bindModel" on-change="onChange" display-text="displayText" select-list="selectList" muted-text="mutedText"></string-select>'))(scope);
        scope.$digest();
    });

    describe('in isolated scope', function() {
        beforeEach(function() {
            isolatedScope = element.isolateScope();
        });
        it('displayText should be one way bound', function() {
            isolatedScope.displayText = 'new value';
            scope.$digest();
            expect(scope.displayText).toEqual('');
        });
        it('mutedText should be one way bound', function() {
            isolatedScope.mutedText = 'new value';
            scope.$digest();
            expect(scope.mutedText).toEqual('');
        });
        it('selectList should be one way bound', function() {
            isolatedScope.selectList = ['new value'];
            scope.$digest();
            expect(scope.selectList).toEqual([]);
        });
    });
    describe('controller bound variable', function() {
        it('bindModel should be two way bound', function() {
            var controller = element.controller('stringSelect');
            controller.bindModel = ['new value'];
            scope.$digest();
            expect(scope.bindModel).toEqual(['new value']);
        });
    });
    describe('replaces the element with the correct html', function() {
        it('for wrapping containers', function() {
            expect(element.prop('tagName')).toBe('DIV');
            expect(element.hasClass('string-select')).toBe(true);
            expect(element.hasClass('form-group')).toBe(true);
        });
        it('with a custom-label', function() {
            expect(element.find('custom-label').length).toBe(1);
        });
        it('with a ui-select', function() {
            expect(element.find('ui-select').length).toBe(1);
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
            it('when item is not DatatypeProperty or ObjectProperty, returns false', function() {
                expect(controller.disableChoice('')).toBe(false);
            });
            describe('when item is DatatypeProperty', function() {
                beforeEach(function() {
                    item = prefixes.owl + 'DatatypeProperty';
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
                it('and DatatypeProperty is selected, returns true', function() {
                    controller.bindModel = [prefixes.owl + 'DatatypeProperty'];
                    expect(controller.disableChoice(item)).toBe(true);
                });
                it('and DatatypeProperty is not selected, returns false', function() {
                    expect(controller.disableChoice(item)).toBe(false);
                });
            });
        });
    });
});